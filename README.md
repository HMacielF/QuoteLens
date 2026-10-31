# QuoteLens frontend - Crislen

Static web UI for QuoteLens, a tool that compares contractor estimates side by side.
Built with plain HTML, CSS and JavaScript so it runs locally with no install.

## Run it
Open `index.html` in a browser, or serve the folder:

    python -m http.server 5173     # then visit http://localhost:5173

## Screens
| Route | Screen | What it does |
|---|---|---|
| `#/signin` | Sign in | Mock login (final app: Microsoft Entra External ID) |
| `#/dashboard` | Dashboard | Lists saved comparisons; empty state with sample data button |
| `#/new` | New comparison | Drag and drop or choose 2+ PDFs, with validation |
| `#/review` | Review and correct | Edit extracted fields; low-confidence fields highlighted; nothing saved until Confirm |
| `#/compare/<id>` | Comparison | Total, cost per sq ft, measured-area bars, flag when measurements differ, included / excluded / not specified per service |

## Structure
    index.html        page shell
    css/styles.css    design tokens and styles
    js/api.js         mock backend (one function per Azure Function)
    js/app.js         router and the five screens

## How it maps to the architecture
`js/api.js` is the only file that will change when the backend is ready.
Each function keeps its shape and swaps its body for a `fetch()` to Azure Functions:
`extractQuote` (ExtractQuote), `saveComparison` (ConfirmQuote + BuildComparison),
`listComparisons`, `getComparison`. Saved data lives in `localStorage` for now.

## Mocked for now
- Extraction returns two fixed sample quotes instead of calling Document Intelligence.
- Sign-in accepts any email and password.
- Saved comparisons are stored in the browser, not Cosmos DB.
- The original-PDF link works only in the session where the file was uploaded.

## Accessibility
Labeled form fields, visible keyboard focus, status text next to every color chip,
44px minimum touch targets, responsive layout down to phone width.

## Next
Connect `api.js` to the real Functions, add Entra sign-in, add phone-width testing with classmates.
