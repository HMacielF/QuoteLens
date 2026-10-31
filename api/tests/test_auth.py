import azure.functions as func
import pytest

from function_app import user_id
from quotelens.service import ApiError


def request(**headers):
    headers = {key.replace("_", "-"): value for key, value in headers.items()}
    return func.HttpRequest("GET", "http://localhost/api/quotes", headers=headers, body=b"")


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    monkeypatch.delenv("WEBSITE_AUTH_ENABLED", raising=False)
    monkeypatch.delenv("ALLOW_DEV_USER", raising=False)


def test_no_identity_is_rejected():
    with pytest.raises(ApiError) as error:
        user_id(request())
    assert error.value.status == 401


def test_dev_header_needs_the_dev_flag(monkeypatch):
    with pytest.raises(ApiError):
        user_id(request(x_user_id="alex"))
    monkeypatch.setenv("ALLOW_DEV_USER", "true")
    assert user_id(request(x_user_id="alex")) == "alex"


def test_principal_header_is_ignored_without_azure_auth():
    with pytest.raises(ApiError):
        user_id(request(x_ms_client_principal_id="spoofed"))


def test_azure_auth_uses_principal_and_turns_off_dev_header(monkeypatch):
    monkeypatch.setenv("WEBSITE_AUTH_ENABLED", "True")
    monkeypatch.setenv("ALLOW_DEV_USER", "true")
    assert user_id(request(x_ms_client_principal_id="entra-user")) == "entra-user"
    with pytest.raises(ApiError):
        user_id(request(x_user_id="alex"))
