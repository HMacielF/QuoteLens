# Synthetic sample quotes

Made-up estimates for testing. They contain no real customer or shop data. Each file is
marked "SYNTHETIC SAMPLE - FOR QUOTELENS SOFTWARE TESTING ONLY".

## `estimate_A_granite_pros.pdf`

Created by Adela Wallis (awallis1) on 2026-11-09, first committed on the `Data/AI` branch.
A one-page kitchen estimate in a clean table layout, so extraction should get every field.

Expected values, in the shape of `ExtractedQuote` (`api/quotelens/models.py`):

| Field | Expected |
|---|---|
| `contractor.name` | Granite Pros |
| `quoteNumber` | GP-1042 |
| `quoteDate` | 2026-11-03 |
| `materialType` / `color` | Quartz / Arctic White |
| `squareFootage` | 45 |
| `totalPrice` | 3200.00 |
| `services.fabrication` | included (combined with material: $2,475.00 for 45 sq ft at $55.00) |
| `services.installation` | included, 425.00 |
| `services.sinkCutout` | included, 0.00 |
| `services.backsplash` | not_specified ("Backsplash is not specified") |
| `services.tearOut` | excluded ("Old countertop removal is excluded") |
| `otherItems` | Template and measurement $100.00; delivery $200.00 (both inside the total) |
| `notes` | 50% deposit to schedule, balance on completion. Estimate valid 30 days |

The line items add up to the total: 2,475 + 425 + 0 + 100 + 200 = 3,200. Price per sq ft is
$71.11. There are no extras billed on top, so the effective price per sq ft is also $71.11.

What it exercises: all three non-extra service states (included, excluded, not specified) in
one quote, a stated area, and charges that are in the total but are not one of the five services.

_AI use: Claude Code (Claude Opus 5.5, Anthropic) restored this PDF from the deleted `Data/AI`
branch and drafted this README from the PDF at Hugo's request. Prompt, edited for clarity:
"Assess whether we can delete the frontend and Data/AI branches or whether we still need them."
The PDF itself is Adela's work._
