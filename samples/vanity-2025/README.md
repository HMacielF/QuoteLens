# Sample quotes: one bathroom vanity, three shops (Jan 2025)

Real quotes Hugo received in January 2025 for the same job, so they form a true
side-by-side comparison. Customer name, phone and email are redacted. Two of the
quotes came as email text; they are printed to PDF here so every input is a PDF.

The job, as measured by the customer's contractor: 73 1/2" x 27 3/4" double vanity,
eased edge, 4" back splash, customer picks up the top, no installation.

| File | Shop | Stone | Area | Sinks | Total |
|---|---|---|---|---|---|
| `architecture-stones-30781-leon.pdf` | Architecture Stones, quote 30781 | Calacatta Leon quartz | 14.2 sq ft + 2 sq ft splash, 10.8 lin ft edge | 2 cutouts, 2 sinks supplied | $2,779.94 |
| `graniteworks-email-leon.pdf` | Granite Works (email) | MSI Calacatta Leon | 12 sq ft + 2 sq ft splash, 10 lin ft edge | 1 cutout, customer provides sink | $3,929.80 |
| `oldtown-email-leon.pdf` | Old Town Marble & Granite (email reply) | MSI Calacatta Leon | not stated | not stated | $2,024.00 |
| `oldtown-est-1933-marcella.pdf` | Old Town Marble & Granite, estimate 1933 | Calacatta Marcella quartz | not stated | "vanity sinks and sink cut out" | $680.00 |

## What these should exercise

- **Measurements differ:** 12 vs 14.2 sq ft for the same top, and 1 vs 2 sink cutouts. The comparison should flag this.
- **Not specified:** two quotes give no square footage, so cost per sq ft must show "not specified", not $0.
- **Tax:** Architecture Stones shows "Tax (6%) $137.54" on a $2,642.40 subtotal, which is not 6%. Old Town lists 6% tax but charges $0.00.
- **Terms that change the real price:** 3% card fee and full-slab fee under 40 sq ft (Old Town); orders under $3,000 paid in full at signing (Architecture Stones).
- **Excluded:** installation, plumbing and removal are excluded in all of them.

## Document Intelligence check (prebuilt-invoice, 2026-11-12)

Ran against these exact files with the team's `quotelens-docintel` resource.

| File | Vendor | Total | Tax | Area found? |
|---|---|---|---|---|
| architecture-stones | Architecture Stones (0.72) | $2,779.94 (0.89) | $137.54 (0.90) | no |
| graniteworks-email | Granite Works (0.65) | $3,929.80 (0.92) | none | no |
| oldtown-email | Old Town Marble & Granite (0.65) | **missed** | none | no |
| oldtown-est-1933 | OLD TOWN MARBLE & GRANITE, INC (0.89) | $680.00 (0.79) | 0.00 (0.54) | no |

Takeaways: the invoice model gets vendor and totals from real quotes, but never returns
square footage, edge or sink counts, and it misses a price written in a sentence. Those
fields need a small parser over the OCR text (`content`), for example `(\d+(\.\d+)?)\s*sq\.?\s*ft`.
Numbers in parentheses are the model's confidence; anything under about 0.8 should be
highlighted on the Review screen.

_AI use: Claude Code (Claude Opus 5.5, Anthropic) found these emails, redacted the PDFs, ran the
Document Intelligence check and drafted this README at Hugo's request. Prompt, edited for clarity:
"Add the PDFs and emails to QuoteLens as sample files, so we can confirm Document Intelligence
can read them."_
