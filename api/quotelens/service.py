"""The API's behavior, kept separate from HTTP so it can be tested directly."""
from __future__ import annotations

from .comparison import build_results
from .extraction import extract_quote
from .models import (
    MAX_QUOTES_PER_COMPARISON,
    MIN_QUOTES_PER_COMPARISON,
    Comparison,
    ComparisonStatus,
    ConfirmQuoteRequest,
    Quote,
    QuoteStatus,
    now_iso,
)
from .store import Store

MAX_PDF_BYTES = 20 * 1024 * 1024


class ApiError(Exception):
    def __init__(self, status: int, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.message = message


def _require_comparison(store: Store, user_id: str, comparison_id: str) -> Comparison:
    comparison = store.get_comparison(user_id, comparison_id)
    if comparison is None:
        raise ApiError(404, "Comparison not found")
    return comparison


def _require_quote(store: Store, user_id: str, quote_id: str) -> Quote:
    quote = store.get_quote(user_id, quote_id)
    if quote is None:
        raise ApiError(404, "Quote not found")
    return quote


def _mark_stale(comparison: Comparison) -> None:
    comparison.status = ComparisonStatus.draft
    comparison.results = None


def create_comparison(store: Store, user_id: str, title: str) -> Comparison:
    comparison = Comparison(userId=user_id, title=title.strip())
    store.save_comparison(comparison)
    return comparison


def get_comparison(store: Store, user_id: str, comparison_id: str) -> dict:
    comparison = _require_comparison(store, user_id, comparison_id)
    quotes = store.list_quotes(user_id, comparison_id)
    return {**comparison.model_dump(mode="json"), "quotes": [q.model_dump(mode="json") for q in quotes]}


def add_quote(store: Store, user_id: str, comparison_id: str, file_name: str, pdf: bytes) -> Quote:
    comparison = _require_comparison(store, user_id, comparison_id)
    if not pdf.startswith(b"%PDF-"):
        raise ApiError(415, "QuoteLens reads PDF estimates only")
    if len(pdf) > MAX_PDF_BYTES:
        raise ApiError(413, "PDF is larger than 20 MB")
    position = len(comparison.quoteIds)
    if position >= MAX_QUOTES_PER_COMPARISON:
        raise ApiError(409, f"A comparison can hold up to {MAX_QUOTES_PER_COMPARISON} quotes")

    quote = Quote(userId=user_id, comparisonId=comparison_id, fileName=file_name)
    store.save_quote(quote)
    comparison.quoteIds.append(quote.id)
    _mark_stale(comparison)
    store.save_comparison(comparison)

    try:
        extracted = extract_quote(file_name, pdf, position)
    except Exception:
        quote.status = QuoteStatus.failed
        store.save_quote(quote)
        raise
    quote = quote.model_copy(update={**dict(extracted), "status": QuoteStatus.details_ready, "extractedAt": now_iso()})
    store.save_quote(quote)
    return quote


def get_status(store: Store, user_id: str, comparison_id: str) -> dict:
    _require_comparison(store, user_id, comparison_id)
    quotes = store.list_quotes(user_id, comparison_id)
    return {
        "comparisonId": comparison_id,
        "files": [{"quoteId": q.id, "fileName": q.fileName, "status": q.status.value} for q in quotes],
        "readyForReview": bool(quotes) and all(q.status != QuoteStatus.reading for q in quotes),
    }


def confirm_quote(store: Store, user_id: str, quote_id: str, reviewed: ConfirmQuoteRequest) -> Quote:
    quote = _require_quote(store, user_id, quote_id)
    if quote.status in (QuoteStatus.reading, QuoteStatus.failed):
        raise ApiError(409, "This quote has no extracted details to confirm")
    confirmed = quote.model_copy(update={**dict(reviewed), "status": QuoteStatus.confirmed, "confirmedAt": now_iso()})
    store.save_quote(confirmed)
    comparison = _require_comparison(store, user_id, quote.comparisonId)
    if comparison.results is not None:
        _mark_stale(comparison)
        store.save_comparison(comparison)
    return confirmed


def build_comparison(store: Store, user_id: str, comparison_id: str) -> Comparison:
    comparison = _require_comparison(store, user_id, comparison_id)
    quotes = store.list_quotes(user_id, comparison_id)
    confirmed = [q for q in quotes if q.status == QuoteStatus.confirmed]
    if len(confirmed) != len(quotes):
        raise ApiError(409, "Confirm every quote before comparing")
    if len(confirmed) < MIN_QUOTES_PER_COMPARISON:
        raise ApiError(409, f"A comparison needs at least {MIN_QUOTES_PER_COMPARISON} quotes")
    comparison.results = build_results(confirmed)
    comparison.status = ComparisonStatus.ready
    store.save_comparison(comparison)
    return comparison
