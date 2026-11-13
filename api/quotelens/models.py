"""Data model for the Cosmos DB containers. Every document is partitioned by /userId."""
from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field, model_validator

MAX_QUOTES_PER_COMPARISON = 5
MIN_QUOTES_PER_COMPARISON = 2


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:12]}"


class ServiceStatus(str, Enum):
    included = "included"  # part of the stated total
    extra = "extra"  # billed on top of the stated total
    not_specified = "not_specified"  # the quote does not say


class ServiceItem(BaseModel):
    status: ServiceStatus = ServiceStatus.not_specified
    amount: float | None = Field(default=None, ge=0)
    detail: str = ""


class Services(BaseModel):
    fabrication: ServiceItem = Field(default_factory=ServiceItem)
    installation: ServiceItem = Field(default_factory=ServiceItem)
    sinkCutout: ServiceItem = Field(default_factory=ServiceItem)
    backsplash: ServiceItem = Field(default_factory=ServiceItem)
    tearOut: ServiceItem = Field(default_factory=ServiceItem)


class Contractor(BaseModel):
    name: str = ""
    contactName: str = ""
    email: str = ""
    phone: str = ""
    city: str = ""


class LineItem(BaseModel):
    description: str
    price: float | None = Field(default=None, ge=0)


class ExtractedQuote(BaseModel):
    """What extraction returns and what the review screen edits."""

    contractor: Contractor = Field(default_factory=Contractor)
    quoteNumber: str = ""
    quoteDate: str = ""
    materialType: str = ""
    color: str = ""
    totalPrice: float | None = Field(default=None, gt=0)
    squareFootage: float | None = Field(default=None, gt=0)
    edgeProfile: str = ""
    services: Services = Field(default_factory=Services)
    otherItems: str = ""
    notes: str = ""
    lineItems: list[LineItem] = Field(default_factory=list)


class QuoteStatus(str, Enum):
    reading = "reading"
    details_ready = "details_ready"
    confirmed = "confirmed"
    failed = "failed"


class Quote(ExtractedQuote):
    id: str = Field(default_factory=lambda: new_id("quote"))
    userId: str
    comparisonId: str
    status: QuoteStatus = QuoteStatus.reading
    fileName: str
    pdfBlobPath: str | None = None
    extractionSource: str = "mock"
    createdAt: str = Field(default_factory=now_iso)
    extractedAt: str | None = None
    confirmedAt: str | None = None


class ConfirmQuoteRequest(ExtractedQuote):
    """The homeowner's reviewed values. Nothing counts until this is saved."""

    model_config = ConfigDict(extra="forbid")

    @model_validator(mode="after")
    def require_comparable_fields(self) -> "ConfirmQuoteRequest":
        if not self.contractor.name.strip():
            raise ValueError("contractor.name is required")
        if self.totalPrice is None:
            raise ValueError("totalPrice is required")
        return self


class QuoteSummary(BaseModel):
    quoteId: str
    contractor: str
    statedTotal: float
    knownExtras: float
    knownCost: float
    hasUnpricedExtras: bool
    pricePerSqFt: float | None


class Flag(BaseModel):
    kind: str  # extra | missing | info
    text: str


class ComparisonResults(BaseModel):
    quotes: list[QuoteSummary]
    lowestStatedQuoteIds: list[str]
    lowestKnownCostQuoteIds: list[str]
    priceDifference: float
    flags: list[Flag]
    summary: str


class ComparisonStatus(str, Enum):
    draft = "draft"
    ready = "ready"


class CreateComparisonRequest(BaseModel):
    title: str = Field(min_length=1, max_length=120)


class Comparison(BaseModel):
    id: str = Field(default_factory=lambda: new_id("comp"))
    userId: str
    title: str
    status: ComparisonStatus = ComparisonStatus.draft
    quoteIds: list[str] = Field(default_factory=list)
    results: ComparisonResults | None = None
    createdAt: str = Field(default_factory=now_iso)
