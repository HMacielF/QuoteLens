"""QuoteLens HTTP API. Routes are thin; behavior lives in quotelens/service.py."""
from __future__ import annotations

import json
import logging
import os
import re

import azure.functions as func
from pydantic import BaseModel, ValidationError

from quotelens import service
from quotelens.models import ConfirmQuoteRequest, CreateComparisonRequest
from quotelens.service import ApiError
from quotelens.store import Store, store_from_env

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)
_store: Store | None = None


def store() -> Store:
    global _store
    if _store is None:
        _store = store_from_env()
    return _store


def user_id(req: func.HttpRequest) -> str:
    """Who is calling. Azure sets this header after Entra sign-in and overwrites any client value,
    but only with App Service authentication on, so it is ignored otherwise."""
    if os.environ.get("WEBSITE_AUTH_ENABLED", "").lower() == "true":
        principal = req.headers.get("x-ms-client-principal-id")
        if principal:
            return principal
    elif os.environ.get("ALLOW_DEV_USER") == "true" and req.headers.get("x-user-id"):
        return req.headers["x-user-id"]
    raise ApiError(401, "Sign in required")


def respond(body, status: int = 200) -> func.HttpResponse:
    if isinstance(body, BaseModel):
        body = body.model_dump(mode="json")
    elif isinstance(body, list):
        body = [item.model_dump(mode="json") for item in body]
    return func.HttpResponse(json.dumps(body), status_code=status, mimetype="application/json")


def api(handler):
    def wrapper(req: func.HttpRequest) -> func.HttpResponse:
        try:
            return handler(req, user_id(req))
        except ApiError as error:
            return respond({"error": error.message}, error.status)
        except ValidationError as error:
            details = [{"field": ".".join(map(str, e["loc"])), "message": e["msg"]} for e in error.errors()]
            return respond({"error": "Invalid data", "details": details}, 422)
        except ValueError:
            return respond({"error": "Request body must be valid JSON"}, 400)
        except Exception:
            logging.exception("Unhandled API error")
            return respond({"error": "Something went wrong"}, 500)

    # Not functools.wraps: the Functions worker would read the inner signature and reject `user`.
    wrapper.__name__ = handler.__name__
    return wrapper


@app.route(route="health", methods=["GET"])
def health(req: func.HttpRequest) -> func.HttpResponse:
    return respond({"status": "ok", "store": type(store()).__name__})


@app.route(route="comparisons", methods=["POST"])
@api
def create_comparison(req: func.HttpRequest, user: str) -> func.HttpResponse:
    body = CreateComparisonRequest.model_validate(req.get_json())
    return respond(service.create_comparison(store(), user, body.title), 201)


@app.route(route="comparisons", methods=["GET"])
@api
def list_comparisons(req: func.HttpRequest, user: str) -> func.HttpResponse:
    return respond(store().list_comparisons(user))


@app.route(route="comparisons/{id}", methods=["GET"])
@api
def get_comparison(req: func.HttpRequest, user: str) -> func.HttpResponse:
    return respond(service.get_comparison(store(), user, req.route_params["id"]))


@app.route(route="comparisons/{id}/quotes", methods=["POST"])
@api
def extract_quote(req: func.HttpRequest, user: str) -> func.HttpResponse:
    raw_name = req.headers.get("x-file-name", "quote.pdf")
    file_name = re.sub(r"[^\w. -]", "_", raw_name)[:120]
    quote = service.add_quote(store(), user, req.route_params["id"], file_name, req.get_body())
    return respond(quote, 201)


@app.route(route="comparisons/{id}/status", methods=["GET"])
@api
def comparison_status(req: func.HttpRequest, user: str) -> func.HttpResponse:
    return respond(service.get_status(store(), user, req.route_params["id"]))


@app.route(route="comparisons/{id}/build", methods=["POST"])
@api
def build_comparison(req: func.HttpRequest, user: str) -> func.HttpResponse:
    return respond(service.build_comparison(store(), user, req.route_params["id"]))


@app.route(route="quotes", methods=["GET"])
@api
def list_quotes(req: func.HttpRequest, user: str) -> func.HttpResponse:
    return respond(store().list_quotes(user))


@app.route(route="quotes/{id}/confirm", methods=["PUT"])
@api
def confirm_quote(req: func.HttpRequest, user: str) -> func.HttpResponse:
    reviewed = ConfirmQuoteRequest.model_validate(req.get_json())
    return respond(service.confirm_quote(store(), user, req.route_params["id"], reviewed))
