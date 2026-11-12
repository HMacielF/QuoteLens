from uuid import uuid4

import pytest

from quotelens import service
from quotelens.extraction import SAMPLES
from quotelens.models import ConfirmQuoteRequest, ExtractedQuote, QuoteStatus
from quotelens.service import ApiError

PDF = b"%PDF-1.7 test"


@pytest.fixture
def user():
    return f"user_{uuid4().hex[:8]}"


def upload(store, user, count):
    comparison = service.create_comparison(store, user, "Kitchen Renovation")
    quotes = [service.add_quote(store, user, comparison.id, f"quote{i}.pdf", PDF) for i in range(count)]
    return comparison, quotes


def confirm_all(store, user, quotes):
    for quote in quotes:
        reviewed = ConfirmQuoteRequest.model_validate(ExtractedQuote.model_validate(quote.model_dump()).model_dump())
        service.confirm_quote(store, user, quote.id, reviewed)


def test_full_flow_finds_cheapest_after_extras(store, user):
    comparison, quotes = upload(store, user, 3)
    status = service.get_status(store, user, comparison.id)
    assert status["readyForReview"] and [f["status"] for f in status["files"]] == ["details_ready"] * 3

    confirm_all(store, user, quotes)
    results = service.build_comparison(store, user, comparison.id).results

    by_name = {q.contractor: q for q in results.quotes}
    assert results.lowestStatedQuoteIds == [by_name["Modern Surfaces"].quoteId]
    assert results.lowestKnownCostQuoteIds == [by_name["ABC Countertops"].quoteId]
    assert by_name["Modern Surfaces"].knownCost == 8800
    assert by_name["Premier Stone"].knownCost == 10230
    assert by_name["ABC Countertops"].pricePerSqFt == 208.33
    assert results.priceDifference == 1780
    assert "ABC Countertops is lowest at $8,750" in results.summary
    assert any("Different square footage" in f.text for f in results.flags)
    assert any("Premier Stone charges extra for the sink cutout ($250)" in f.text for f in results.flags)


def test_results_persist_and_reload(store, user):
    comparison, quotes = upload(store, user, 2)
    confirm_all(store, user, quotes)
    service.build_comparison(store, user, comparison.id)
    loaded = service.get_comparison(store, user, comparison.id)
    assert loaded["status"] == "ready"
    assert len(loaded["quotes"]) == 2
    assert loaded["results"]["summary"]


def test_cannot_compare_until_every_quote_is_confirmed(store, user):
    comparison, quotes = upload(store, user, 2)
    confirm_all(store, user, quotes[:1])
    with pytest.raises(ApiError) as error:
        service.build_comparison(store, user, comparison.id)
    assert error.value.status == 409


def test_needs_two_quotes(store, user):
    comparison, quotes = upload(store, user, 1)
    confirm_all(store, user, quotes)
    with pytest.raises(ApiError) as error:
        service.build_comparison(store, user, comparison.id)
    assert error.value.status == 409


def test_sixth_quote_is_rejected(store, user):
    comparison, _ = upload(store, user, 5)
    with pytest.raises(ApiError) as error:
        service.add_quote(store, user, comparison.id, "six.pdf", PDF)
    assert error.value.status == 409


def test_non_pdf_is_rejected(store, user):
    comparison = service.create_comparison(store, user, "Kitchen")
    with pytest.raises(ApiError) as error:
        service.add_quote(store, user, comparison.id, "notes.txt", b"hello")
    assert error.value.status == 415


def test_editing_a_confirmed_quote_clears_old_results(store, user):
    comparison, quotes = upload(store, user, 2)
    confirm_all(store, user, quotes)
    service.build_comparison(store, user, comparison.id)

    changed = ExtractedQuote.model_validate(quotes[0].model_dump()).model_dump()
    changed["totalPrice"] = 1000
    service.confirm_quote(store, user, quotes[0].id, ConfirmQuoteRequest.model_validate(changed))

    reloaded = service.get_comparison(store, user, comparison.id)
    assert reloaded["status"] == "draft" and reloaded["results"] is None
    assert service.build_comparison(store, user, comparison.id).results.quotes[0].statedTotal == 1000


def test_users_cannot_see_each_others_data(store, user):
    comparison, quotes = upload(store, user, 1)
    other = f"user_{uuid4().hex[:8]}"
    for call in (
        lambda: service.get_comparison(store, other, comparison.id),
        lambda: service.get_status(store, other, comparison.id),
        lambda: service.build_comparison(store, other, comparison.id),
        lambda: service.add_quote(store, other, comparison.id, "x.pdf", PDF),
        lambda: service.confirm_quote(store, other, quotes[0].id, ConfirmQuoteRequest.model_validate(SAMPLES[0])),
    ):
        with pytest.raises(ApiError) as error:
            call()
        assert error.value.status == 404
    assert store.list_comparisons(other) == []
    assert store.list_quotes(other) == []


def test_extra_with_no_amount_is_marked_incomplete(store, user):
    comparison, quotes = upload(store, user, 2)
    data = ExtractedQuote.model_validate(quotes[0].model_dump()).model_dump()
    data["services"]["installation"] = {"status": "extra", "amount": None, "detail": ""}
    service.confirm_quote(store, user, quotes[0].id, ConfirmQuoteRequest.model_validate(data))
    confirm_all(store, user, quotes[1:])
    results = service.build_comparison(store, user, comparison.id).results
    assert results.quotes[0].hasUnpricedExtras is True
    assert any("amount not stated" in f.text for f in results.flags)


def test_confirm_requires_total_and_contractor():
    with pytest.raises(ValueError):
        ConfirmQuoteRequest.model_validate({"contractor": {"name": "ABC"}})
    with pytest.raises(ValueError):
        ConfirmQuoteRequest.model_validate({"totalPrice": 100})


def confirm_as(store, user, quote, contractor, total, sqft, **services):
    data = {"contractor": {"name": contractor}, "totalPrice": total, "squareFootage": sqft, "services": services}
    service.confirm_quote(store, user, quote.id, ConfirmQuoteRequest.model_validate(data))


def test_real_vanity_quotes_flag_exclusions_and_effective_price(store, user):
    """Values from samples/vanity-2025: same vanity, two shops, neither installs."""
    comparison, quotes = upload(store, user, 2)
    none = {"status": "excluded"}
    confirm_as(store, user, quotes[0], "Architecture Stones", 2779.94, 14.2, installation=none)
    confirm_as(store, user, quotes[1], "Granite Works", 3929.80, 12, installation=none,
               sinkCutout={"status": "extra", "amount": 150})
    results = service.build_comparison(store, user, comparison.id).results

    by_name = {q.contractor: q for q in results.quotes}
    assert by_name["Architecture Stones"].pricePerSqFt == 195.77
    assert by_name["Granite Works"].effectivePricePerSqFt == 339.98
    assert by_name["Granite Works"].excludedServices == ["installation"]
    texts = [f.text for f in results.flags]
    assert "None of the quotes include installation. Budget for it separately." in texts
    assert not any("did not say whether installation" in t for t in texts)
    assert any("Different square footage" in t for t in texts)


def test_one_quote_excluding_a_service_is_named(store, user):
    comparison, quotes = upload(store, user, 2)
    confirm_as(store, user, quotes[0], "Shop A", 1000, None, backsplash={"status": "excluded"})
    confirm_as(store, user, quotes[1], "Shop B", 1200, None, backsplash={"status": "included"})
    results = service.build_comparison(store, user, comparison.id).results
    assert any(f.kind == "excluded" and f.text == "Shop A does not include backsplash." for f in results.flags)
    assert all(q.effectivePricePerSqFt is None for q in results.quotes)


def test_cosmos_without_key_uses_managed_identity(monkeypatch):
    import azure.cosmos
    import azure.identity
    from quotelens import store as store_module

    calls = {}

    class FakeClient:
        def __init__(self, endpoint, credential, **kwargs):
            calls["credential"] = credential

        def get_database_client(self, name):
            calls["database"] = name
            return self

        def get_container_client(self, name):
            return name

        def create_database_if_not_exists(self, name):
            raise AssertionError("identity mode must not try to create the database")

    monkeypatch.setattr(azure.cosmos, "CosmosClient", FakeClient)
    monkeypatch.setattr(azure.identity, "DefaultAzureCredential", lambda: "managed-identity")
    monkeypatch.setenv("COSMOS_ENDPOINT", "https://example.documents.azure.com:443/")
    monkeypatch.delenv("COSMOS_KEY", raising=False)
    built = store_module.store_from_env()
    assert calls == {"credential": "managed-identity", "database": "quotelens"}
    assert built._containers == {"users": "users", "comparisons": "comparisons", "quotes": "quotes"}
