"""Storage for the users, comparisons and quotes containers, always scoped to one user."""
from __future__ import annotations

import os
from typing import Protocol

from .models import Comparison, Quote

CONTAINERS = ("users", "comparisons", "quotes")


class Store(Protocol):
    def save_comparison(self, comparison: Comparison) -> None: ...
    def get_comparison(self, user_id: str, comparison_id: str) -> Comparison | None: ...
    def list_comparisons(self, user_id: str) -> list[Comparison]: ...
    def save_quote(self, quote: Quote) -> None: ...
    def get_quote(self, user_id: str, quote_id: str) -> Quote | None: ...
    def list_quotes(self, user_id: str, comparison_id: str | None = None) -> list[Quote]: ...


class MemoryStore:
    """Used for tests and for running with no database. Data is lost on restart."""

    def __init__(self) -> None:
        self.comparisons: dict[tuple[str, str], Comparison] = {}
        self.quotes: dict[tuple[str, str], Quote] = {}

    def save_comparison(self, comparison: Comparison) -> None:
        self.comparisons[(comparison.userId, comparison.id)] = comparison

    def get_comparison(self, user_id: str, comparison_id: str) -> Comparison | None:
        return self.comparisons.get((user_id, comparison_id))

    def list_comparisons(self, user_id: str) -> list[Comparison]:
        rows = [c for (owner, _), c in self.comparisons.items() if owner == user_id]
        return sorted(rows, key=lambda c: c.createdAt, reverse=True)

    def save_quote(self, quote: Quote) -> None:
        self.quotes[(quote.userId, quote.id)] = quote

    def get_quote(self, user_id: str, quote_id: str) -> Quote | None:
        return self.quotes.get((user_id, quote_id))

    def list_quotes(self, user_id: str, comparison_id: str | None = None) -> list[Quote]:
        rows = [q for (owner, _), q in self.quotes.items() if owner == user_id]
        if comparison_id:
            rows = [q for q in rows if q.comparisonId == comparison_id]
        return sorted(rows, key=lambda q: q.createdAt)


class CosmosStore:
    def __init__(self, endpoint: str, key: str, database: str) -> None:
        from azure.cosmos import CosmosClient, PartitionKey

        local = "localhost" in endpoint or "127.0.0.1" in endpoint
        client = CosmosClient(endpoint, credential=key, enable_endpoint_discovery=not local)
        db = client.create_database_if_not_exists(database)
        self._containers = {
            name: db.create_container_if_not_exists(id=name, partition_key=PartitionKey(path="/userId"))
            for name in CONTAINERS
        }

    def _get(self, container: str, user_id: str, item_id: str) -> dict | None:
        from azure.cosmos.exceptions import CosmosResourceNotFoundError

        try:
            return self._containers[container].read_item(item_id, partition_key=user_id)
        except CosmosResourceNotFoundError:
            return None

    def _list(self, container: str, user_id: str, query: str, params: list[dict]) -> list[dict]:
        return list(self._containers[container].query_items(query, parameters=params, partition_key=user_id))

    def save_comparison(self, comparison: Comparison) -> None:
        self._containers["comparisons"].upsert_item(comparison.model_dump(mode="json"))

    def get_comparison(self, user_id: str, comparison_id: str) -> Comparison | None:
        item = self._get("comparisons", user_id, comparison_id)
        return Comparison.model_validate(item) if item else None

    def list_comparisons(self, user_id: str) -> list[Comparison]:
        rows = self._list("comparisons", user_id, "SELECT * FROM c", [])
        rows.sort(key=lambda row: row["createdAt"], reverse=True)
        return [Comparison.model_validate(row) for row in rows]

    def save_quote(self, quote: Quote) -> None:
        self._containers["quotes"].upsert_item(quote.model_dump(mode="json"))

    def get_quote(self, user_id: str, quote_id: str) -> Quote | None:
        item = self._get("quotes", user_id, quote_id)
        return Quote.model_validate(item) if item else None

    def list_quotes(self, user_id: str, comparison_id: str | None = None) -> list[Quote]:
        if comparison_id:
            query = "SELECT * FROM c WHERE c.comparisonId = @id"
            rows = self._list("quotes", user_id, query, [{"name": "@id", "value": comparison_id}])
        else:
            rows = self._list("quotes", user_id, "SELECT * FROM c", [])
        rows.sort(key=lambda row: row["createdAt"])
        return [Quote.model_validate(row) for row in rows]


def store_from_env() -> Store:
    endpoint = os.environ.get("COSMOS_ENDPOINT", "")
    if endpoint:
        return CosmosStore(endpoint, os.environ["COSMOS_KEY"], os.environ.get("COSMOS_DATABASE", "quotelens"))
    if os.environ.get("WEBSITE_INSTANCE_ID"):
        raise RuntimeError("COSMOS_ENDPOINT is required when running in Azure")
    return MemoryStore()
