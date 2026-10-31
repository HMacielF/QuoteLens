"""Mock of Azure Document Intelligence, using the prototype's three sample quotes.

Swap extract_quote's body for the real call and keep its signature and return type.
"""
from __future__ import annotations

from .models import ExtractedQuote

_included = lambda amount=None, detail="": {"status": "included", "amount": amount, "detail": detail}
_extra = lambda amount, detail="": {"status": "extra", "amount": amount, "detail": detail}

SAMPLES = [
    {
        "contractor": {"name": "ABC Countertops", "contactName": "John Doe", "email": "john@abccountertops.com", "phone": "301-555-0123", "city": "Gaithersburg, MD"},
        "quoteNumber": "EST-2291", "quoteDate": "2026-10-14", "materialType": "Granite", "color": "Steel Gray",
        "totalPrice": 8750, "squareFootage": 42, "edgeProfile": "Eased",
        "services": {"fabrication": _included(1700), "installation": _included(1200), "sinkCutout": _included(), "backsplash": _included(600, "4 in.")},
        "notes": "Price valid 30 days. Plumbing disconnect and reconnect by others.",
        "lineItems": [{"description": "Steel Gray granite, 3 cm (42 sq ft)", "price": 5250}, {"description": "Fabrication", "price": 1700}, {"description": "Installation", "price": 1200}, {"description": "4 in. backsplash", "price": 600}],
    },
    {
        "contractor": {"name": "Premier Stone", "contactName": "Maria Lopez", "email": "maria.lopez@premierstone.com", "phone": "240-555-0188", "city": "Rockville, MD"},
        "quoteNumber": "1047", "quoteDate": "2026-10-17", "materialType": "Quartz", "color": "Calacatta White",
        "totalPrice": 9980, "squareFootage": 42, "edgeProfile": "Eased",
        "services": {"fabrication": _included(1890), "installation": _included(1370), "sinkCutout": _extra(250)},
        "otherItems": "Template visit: Included",
        "notes": "Sink cutout billed separately. Final price set after template measurement.",
        "lineItems": [{"description": "Calacatta White quartz, 3 cm (42 sq ft)", "price": 6720}, {"description": "Fabrication", "price": 1890}, {"description": "Installation", "price": 1370}],
    },
    {
        "contractor": {"name": "Modern Surfaces", "contactName": "Sam Patel", "phone": "301-555-0147"},
        "quoteNumber": "MS-0820", "quoteDate": "2026-10-20", "materialType": "Granite", "color": "Black Pearl",
        "totalPrice": 8200, "squareFootage": 40, "edgeProfile": "Half bullnose",
        "services": {"fabrication": _included(1800), "installation": _extra(600), "sinkCutout": _included(), "backsplash": _included(800, "4 in."), "tearOut": _included()},
        "notes": "Installation quoted separately. 40 sq ft based on homeowner sketch, to be confirmed at template.",
    },
]


def extract_quote(file_name: str, pdf: bytes, position: int = 0) -> ExtractedQuote:
    """Return the fields found in a PDF. The mock ignores the file and picks a sample by position."""
    return ExtractedQuote.model_validate(SAMPLES[position % len(SAMPLES)])
