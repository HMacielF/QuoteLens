# AGENTS.md: QuoteLens

Read this file first. It is the entry point for any AI coding assistant (Claude Code, Codex,
Cursor, Copilot and others) working in this repository. Facts here were checked against the
code, Git history, GitHub issues and the Azure resource group on **2026-11-20**. Anything not
checked is marked **Unconfirmed**.

| Document | Read it for |
|---|---|
| [docs/HANDOFF.md](docs/HANDOFF.md) | Where to start, how the parts connect, how to work safely |
| [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) | What works, what is mocked, what is missing, known bugs |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Why things are built the way they are |
| [api/README.md](api/README.md) | API endpoints, data model, local run |
| [frontend/README.md](frontend/README.md) | Web app run modes (demo and live) |
| [samples/vanity-2025/README.md](samples/vanity-2025/README.md) | Real sample quotes and Document Intelligence results |
| [AI_DISCLOSURE.md](AI_DISCLOSURE.md) | Required citation of AI use (see the rule below) |

## Rule 1: cite your AI use

QuoteLens is a team project for the INST347 Cloud Computing course. The course allows AI on the
project only when it is cited with the tool and the prompts. **Before you finish a session,
add an entry to [AI_DISCLOSURE.md](AI_DISCLOSURE.md)** under the teammate's name: tool and
model, date, what the AI produced, the prompts, and what was checked. Follow the format of
the existing entries. Uncited AI use counts as an academic integrity violation.

Do not assume AI may be used for individual graded work (for example the reflection papers in
issues #38 to #41). Check the syllabus first. **Unconfirmed** whether those count as project work.

## What QuoteLens is

A web app that helps homeowners compare countertop contractor estimates side by side. The user
uploads 2 to 5 PDF quotes. The app extracts contractor, price, square footage and services. The
user reviews and confirms each quote. The app then shows the lowest stated price, the lowest
price after known extras, price per sq ft, and flags for services that are extra, excluded or
not mentioned. The comparison uses fixed rules, not AI.

Scope: a course prototype for countertop estimates only. Demos run Nov 30 to Dec 13, 2026. The
final report and reflections are due Dec 14 to 20.

## Stack and architecture

```
Browser ── React app (frontend/, Vite) ── served by Web App "quotelensapp" (Linux, Node 22, F1)
   │
   │  live mode only (needs VITE_API_BASE at build time, CORS and sign-in; not set up yet)
   ▼
Function App "quotelens-api-hmf" (Python 3.12, Linux, Flex Consumption)  ── api/
   ├─ Cosmos DB "quotelens-cosmos-hmf" (serverless): database quotelens,
   │     containers users / comparisons / quotes, partition key /userId
   ├─ Storage "quotelensapihmf": private container quote-files (original PDFs)
   └─ Application Insights "quotelens-api-hmf"
Document Intelligence "quotelens-docintel" (F0): exists, not called by the code yet
AI Services "quotelens-rg-resource-4538" (S0, Canada Central): created 2026-11-20 for real
   extraction (#14). Model deployments: gpt-5.1, gpt-5.4-mini, text-embedding-3-large.
   The API's managed identity has Cognitive Services User on it. Not called by the code yet
   └─ Storage "quotelensstudio": files for the AI studio project (the AI resource's identity
      has Storage Blob Data Contributor). Kept apart from the API's storage on purpose
```

All resources are in resource group `quotelens-rg`, region Central US, on an Azure for Students
subscription.

- **Live site:** https://quotelensapp-dubedsh9d3dafzcg.centralus-01.azurewebsites.net (demo mode only)
- **API:** https://quotelens-api-hmf.azurewebsites.net/api (`/health` is public. Every other
  route returns 401 because sign-in is not set up.)

## Repository map

| Path | What it is |
|---|---|
| `api/function_app.py` | HTTP routes (thin), auth header handling, error format |
| `api/quotelens/service.py` | Business rules: limits, statuses, confirm, build |
| `api/quotelens/comparison.py` | Rule-based comparison results, flags and summary text |
| `api/quotelens/models.py` | Pydantic models, which define the Cosmos document shape |
| `api/quotelens/extraction.py` | **Mock** extraction. Replace the function body and keep the signature |
| `api/quotelens/store.py` | `MemoryStore` and `CosmosStore`, always scoped to one user |
| `api/quotelens/files.py` | `MemoryFileStore` and `BlobFileStore`, plus 10-minute read-only PDF links |
| `api/tests/` | pytest suite (21 tests) |
| `frontend/src/api/` | One interface, two backends: `demo.js` (in browser) and `live.js` (real API) |
| `frontend/src/api/comparison.js`, `samples.js` | JavaScript ports of `comparison.py` and `extraction.py` |
| `frontend/src/pages/` | The 11 screens from the prototype |
| `samples/vanity-2025/` | Four real, redacted quotes for testing extraction |
| `.github/workflows/main_quotelensapp.yml` | Builds `frontend/` and deploys it on pushes to `main` |
| `main.bicep` | **Stale.** Does not match what is deployed (issue #11) |
| Root `index.html`, `server.js`, `db.js`, `getCount.js`, `addOne.js`, `version.js`, `package.json`, `host.json`, `local.settings.example.json` | **Legacy** "Team Counter" lab code from INST347 class labs. Not part of QuoteLens. The Function App that ran it was deleted on 2026-11-20 |
| Root `styles.css` (prototype CSS) and `style.css` (empty) | **Legacy.** Nothing loads them |

## Setup, run and test

API (needs Python 3.12 and Azure Functions Core Tools 4):

```bash
cd api
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp local.settings.example.json local.settings.json   # never commit this file
pytest                                               # 21 tests, in memory
func start                                           # http://localhost:7071/api
```

Web app (needs Node 22):

```bash
cd frontend
npm ci
npm run dev       # http://localhost:5173, demo mode
npm test          # vitest, 9 tests
npm run build     # writes dist/
# Against a local API:
VITE_API_BASE=http://localhost:7071/api VITE_DEV_USER=dev1 npm run dev
```

For the local API from the browser, `api/local.settings.json` needs
`"Host": { "CORS": "http://localhost:5173", "CORSCredentials": true }`.

The root `README.md` setup section is out of date (it says `npm install` for the API and
`python -m http.server` for the frontend). Use the commands above.

## Conventions

- **Routes stay thin.** Behavior goes in `api/quotelens/service.py` so tests can call it directly.
- **Every read and write takes a `user_id`** and uses it as the Cosmos partition key. A record
  owned by another user returns 404, never 403.
- **Errors** are `{"error": "message"}`. Validation errors (422) add `details` per field.
- **Comparison output must come only from values the homeowner confirmed.** No AI in `comparison.py`.
- **Keep demo mode and the API in step.** If you change a rule in `service.py`, `comparison.py`
  or `extraction.py`, change `frontend/src/api/demo.js`, `comparison.js` or `samples.js` the
  same way, and update the tests on both sides.
- **Unknown is not zero.** Missing square footage or prices stay `null`, and services stay
  `not_specified`.
- Python: type hints, Pydantic v2, `from __future__ import annotations`. JavaScript: ES modules,
  React function components, no CSS framework.
- Work on a branch and open a pull request to `main`. Merges to `main` that touch `frontend/`
  deploy the live site automatically.

## Do not change without the team agreeing

- `extract_quote(file_name, pdf, position) -> ExtractedQuote` signature (the service depends on it).
- The Cosmos layout: containers `users`, `comparisons`, `quotes`, partition key `/userId`.
- Auth in `api/function_app.py`: in Azure the user comes only from `x-ms-client-principal-id`.
  `x-user-id` is accepted only when `ALLOW_DEV_USER=true`, which must **never** be set in Azure.
- `COSMOS_KEY` stays unset in Azure. The Function App signs in with its managed identity.
- PDFs stay in the private `quote-files` container. Links are read-only and last 10 minutes.
- The AI resource gets no access to `quotelensapihmf`. The API sends it the PDF bytes it
  already has. Its studio project uses `quotelensstudio`.
- Limits: 2 to 5 quotes per comparison, PDF only, 20 MB per file.
- `.github/workflows/main_quotelensapp.yml` and the repository secrets `AZUREAPPSERVICE_*`
  (they sign in to Azure with OIDC through managed identity `oidc-msi-b915`).

## Safety

- Never commit `local.settings.json`, `.env.local`, keys, connection strings or SAS links. Get
  values from the Azure portal or `az` when you need them.
- Do not create, change or delete Azure resources unless a teammate asks you to. The account
  has a $20/month budget alert and limited student credit. The subscription's policy only allows
  certain regions (as of 2026-10-31: Central US, North Central US, Canada Central, Norway East,
  Belgium Central). Use Central US.
- The GPT deployments on the AI resource bill per call. Test with the four sample quotes, not
  loops or bulk runs.
- Sample quotes in `samples/` are real and redacted. Do not add unredacted personal data.
- The repository is **public**.
