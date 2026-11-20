# QuoteLens

![Deploy](https://github.com/HMacielF/QuoteLens/actions/workflows/<workflow-file>.yml/badge.svg)

QuoteLens is a cloud web app that helps homeowners compare contractor
estimates side by side. Users upload two or more PDF quotes, the app
extracts prices, square footage and line items with Azure AI Document
Intelligence, lets the user review and correct them, then shows total
price, effective cost per sq ft, measurement differences, and whether
each service is included, excluded or not specified.

Prototype scope: countertop installation estimates.

**Live site:** [URL]

## Team
- Hugo Maciel Fraga: team lead, countertop industry review
- Kristi Sunwar: DevOps and deployment (GitHub Actions)
- Adela Wallis: data ingestion with Document Intelligence
- Crislen Flores: frontend

## Architecture
| Layer | Azure service |
|---|---|
| Compute | Azure Functions (API) |
| Database | Cosmos DB (users, quotes, comparisons) |
| Object storage | Blob Storage (original PDFs, owner-only access) |
| UI | Static web frontend (HTML/CSS/JS) |
| AI / extra service | Azure AI Document Intelligence |
| Auth | Microsoft Entra External ID (in progress) |
| Automation | GitHub Actions (deploy), Bicep (`main.bicep`) |

Flow: upload PDF → Function saves to Blob → Document Intelligence extracts
fields → user reviews/corrects → confirmed data saved to Cosmos DB →
comparison page.

## Setup
1. Clone the repo.
2. Frontend: `python -m http.server 5173` and open http://localhost:5173
3. API: `cd api && npm install`, copy `local.settings.example.json` to
   `local.settings.json`, fill in your own keys, then `func start`.
4. Infrastructure: `az deployment group create -g <rg> -f main.bicep`

## Deployment
Merges to `main` deploy automatically through GitHub Actions.

## AI usage
See [AI_DISCLOSURE.md](AI_DISCLOSURE.md).

## Status
Done: UI, Blob upload. In progress: Document Intelligence, Cosmos DB,
Entra sign-in.
