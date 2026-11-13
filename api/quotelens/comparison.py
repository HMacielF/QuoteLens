"""BuildComparison: turns confirmed quotes into the results the comparison screen shows.

Rules only, no AI. Every sentence comes from a value the homeowner confirmed.
"""
from __future__ import annotations

from .models import ComparisonResults, Flag, Quote, QuoteSummary, ServiceStatus

SERVICE_NAMES = {
    "installation": "installation",
    "sinkCutout": "the sink cutout",
    "backsplash": "backsplash",
    "tearOut": "tear-out",
}


def money(value: float) -> str:
    return f"${value:,.2f}" if value % 1 else f"${value:,.0f}"


def _name(quote: Quote) -> str:
    return quote.contractor.name


def _join(names: list[str]) -> str:
    return names[0] if len(names) == 1 else ", ".join(names[:-1]) + " and " + names[-1]


def summarize_quote(quote: Quote) -> QuoteSummary:
    extras = [getattr(quote.services, key) for key in SERVICE_NAMES]
    extras = [item for item in extras if item.status == ServiceStatus.extra]
    known_extras = sum(item.amount or 0 for item in extras)
    per_sqft = round(quote.totalPrice / quote.squareFootage, 2) if quote.squareFootage else None
    return QuoteSummary(
        quoteId=quote.id,
        contractor=_name(quote),
        statedTotal=quote.totalPrice,
        knownExtras=known_extras,
        knownCost=quote.totalPrice + known_extras,
        hasUnpricedExtras=any(item.amount is None for item in extras),
        pricePerSqFt=per_sqft,
    )


def _lowest(summaries: list[QuoteSummary], field: str) -> list[QuoteSummary]:
    low = min(getattr(s, field) for s in summaries)
    return [s for s in summaries if getattr(s, field) == low]


def _flags(quotes: list[Quote]) -> list[Flag]:
    flags: list[Flag] = []
    for quote in quotes:
        for key, label in SERVICE_NAMES.items():
            item = getattr(quote.services, key)
            if item.status == ServiceStatus.extra:
                price = money(item.amount) if item.amount is not None else "amount not stated"
                flags.append(Flag(kind="extra", text=f"{_name(quote)} charges extra for {label} ({price})."))

    for key, label in SERVICE_NAMES.items():
        unknown = [q for q in quotes if getattr(q.services, key).status == ServiceStatus.not_specified]
        if unknown and (key == "installation" or len(unknown) < len(quotes)):
            flags.append(Flag(kind="missing", text=f"{_join([_name(q) for q in unknown])} did not say whether {label} is included."))

    if len({q.materialType.strip().lower() for q in quotes}) > 1:
        parts = [f"{_name(q)}: {q.materialType or 'not specified'}" for q in quotes]
        flags.append(Flag(kind="info", text="Different materials. " + "; ".join(parts) + "."))

    if len({q.squareFootage for q in quotes}) > 1:
        parts = [f"{_name(q)}: {f'{q.squareFootage:g} sq ft' if q.squareFootage else 'not specified'}" for q in quotes]
        flags.append(Flag(kind="info", text="Different square footage. " + "; ".join(parts) + "."))
    return flags


def _summary(lowest_stated: list[QuoteSummary], lowest_known: list[QuoteSummary]) -> str:
    stated = lowest_stated[0].statedTotal
    verb = "has" if len(lowest_stated) == 1 else "share"
    text = f"{_join([s.contractor for s in lowest_stated])} {verb} the lowest stated price at {money(stated)}."
    if {s.quoteId for s in lowest_known} == {s.quoteId for s in lowest_stated}:
        return text
    cost = lowest_known[0].knownCost
    return text + f" With known extras added, {_join([s.contractor for s in lowest_known])} is lowest at {money(cost)}."


def build_results(quotes: list[Quote]) -> ComparisonResults:
    summaries = [summarize_quote(quote) for quote in quotes]
    lowest_stated = _lowest(summaries, "statedTotal")
    lowest_known = _lowest(summaries, "knownCost")
    totals = [s.statedTotal for s in summaries]
    return ComparisonResults(
        quotes=summaries,
        lowestStatedQuoteIds=[s.quoteId for s in lowest_stated],
        lowestKnownCostQuoteIds=[s.quoteId for s in lowest_known],
        priceDifference=max(totals) - min(totals),
        flags=_flags(quotes),
        summary=_summary(lowest_stated, lowest_known),
    )
