# Handoff: joining QuoteLens

A practical guide for a teammate, or their AI assistant, picking up work. Read
[AGENTS.md](../AGENTS.md) first for the rules, then this file.

## 1. First 15 minutes

1. Pull the latest `main`: `git switch main && git pull`.
2. Read [PROJECT_STATUS.md](PROJECT_STATUS.md) to see what works and what is mocked.
3. Find your work: `gh issue list --assignee @me` (or the GitHub Project board).
4. Run both test suites so you know your machine works:
   `cd api && pytest`, then `cd frontend && npm ci && npm test`.
5. Open the app in demo mode: `cd frontend && npm run dev`, go to http://localhost:5173 and
   choose "Continue as Demo User".

## 2. How a comparison flows

```
New Comparison ──POST /comparisons──────────────▶ draft comparison (Cosmos: comparisons)
Upload PDFs ─────POST /comparisons/{id}/quotes──▶ PDF saved to Blob quote-files
   (one at a time)                                 extract_quote()  (MOCK today)
                                                   quote status: details_ready (Cosmos: quotes)
Processing ──────GET  /comparisons/{id}/status
Review ──────────PUT  /quotes/{id}/confirm──────▶ quote status: confirmed
Results ─────────POST /comparisons/{id}/build───▶ comparison.results (rules in comparison.py)
Quote details ───GET  /quotes/{id}/pdf──────────▶ 10-minute read-only PDF link
```

In the web app, every page calls `apiFor(session)` from `frontend/src/api/index.js`.
- **Demo session:** `demo.js` runs the same steps in the browser and stores data in `localStorage`.
- **Live session:** `live.js` calls the routes above with `fetch`. It is available only when
  the build has `VITE_API_BASE`, and, for a local API, `VITE_DEV_USER`.

## 3. Where to make common changes

| You want to | Change | Also change |
|---|---|---|
| Real extraction (#14) | Body of `extract_quote` in `api/quotelens/extraction.py`. Return `ExtractedQuote`, and leave unknown fields empty | Set `extractionSource` to something other than `"mock"`. Test with `samples/vanity-2025/`. Call `quotelens-rg-resource-4538` with `DefaultAzureCredential` (the API already has Cognitive Services User on it), and add its endpoint and analyzer name as app settings on `quotelens-api-hmf`. Send the PDF bytes; do not give the AI resource access to `quote-files`. Then redeploy the API |
| A comparison rule or flag | `api/quotelens/comparison.py` | `frontend/src/api/comparison.js`, plus tests on both sides |
| A limit or status rule | `api/quotelens/service.py` / `models.py` | `frontend/src/api/demo.js` |
| A new field on a quote | `ExtractedQuote` in `models.py` | `frontend/src/components/QuoteForm.jsx`, `samples.js`, and the Review and Detail pages |
| A screen | `frontend/src/pages/*.jsx` | Route and title in `frontend/src/App.jsx` |
| Website hosting or CORS (#25) | Azure settings plus `VITE_API_BASE` in the workflow build step | API CORS must list the site origin with credentials allowed |
| Infrastructure as code (#11) | `main.bicep` | Match the resources in [AGENTS.md](../AGENTS.md) and use Central US |

## 4. Working safely

- **Branch and PR.** Create a branch named `<area>/<short-name>` (for example
  `extraction/document-intelligence`). Open a pull request to `main` and ask a teammate to review.
- **Merging deploys.** A merge that touches `frontend/` deploys the live site within a few
  minutes. The API does **not** deploy on merge. Whoever deploys it uses
  `az functionapp deployment source config-zip --build-remote true` with a zip of `api/`
  that excludes `tests/`, `scripts/`, `*.md` and `requirements-dev.txt` (see `api/.funcignore`).
- **Run the tests** before you push. CI does not run the API tests yet.
- **Do not edit another teammate's open branch** without asking them.
- **Azure changes:** Teammates have Contributor on `quotelens-rg` only. Tell the team before
  you create or delete anything, and record it in the issue.
- **Secrets:** Read keys with `az` when you need them. Never paste them into code, docs,
  issues or AI chats that will be shared.
- **Cite AI use** in `AI_DISCLOSURE.md` (AGENTS.md Rule 1).

## 5. Starting a new AI session

Paste something like this as the first message:

> Read AGENTS.md, docs/PROJECT_STATUS.md and docs/HANDOFF.md. I am <name>, and I am working on
> issue #<n>: <title>. Check the current code before you change anything, keep the API and the
> demo mode in step, run the tests, and draft my AI_DISCLOSURE.md entry at the end.

Codex and Cursor read `AGENTS.md` automatically, and Claude Code reads `CLAUDE.md`, which
imports it. Other tools may need the files opened or pasted.

## 6. Who owns what

| Teammate | Area | Open issues (2026-11-20) |
|---|---|---|
| Hugo Maciel Fraga (`HMacielF`) | Backend, database, sign-in, team lead | #7, #10, #32, #33, #37, #38 |
| Kristi Sunwar (`ksunwar`) | Azure infrastructure and DevOps | #11, #13, #25, #26, #27, #39 |
| Adela Wallis (`awallis1`) | Extraction with Document Intelligence, data | #14, #19, #20, #35, #40, #45 |
| Crislen Flores (`cff08`) | Frontend | #34, #36, #41, #42, #43, #44, #46 |

## 7. Questions to settle as a team

- Sign-in: personal Azure account for the External ID tenant, or the trial (#7)?
- Extraction: prebuilt-invoice plus a text parser for square footage, or another model (#14)?
- Will the demo use demo mode if live sign-in is not ready by Nov 29?
- Keep or delete the legacy Team Counter files at the repository root?
