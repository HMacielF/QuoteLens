# Project status

Last checked: **2026-11-20**, against `main` at `4eabd3c` (PR #54 merged), the open GitHub
issues, and the `quotelens-rg` resource group. "Verified" means it was run or inspected that
day. Update this file when the status changes, and keep the date current.

## Working (verified)

| Area | Evidence |
|---|---|
| API deployed to `quotelens-api-hmf` with 10 functions | `/api/health` returns `{"status":"ok","store":"CosmosStore"}`; `az functionapp function list` |
| API tests | `cd api && pytest`: 21 passed |
| Cosmos DB `quotelens` with `users`, `comparisons`, `quotes` on `/userId` | `az cosmosdb sql container list` |
| Original PDFs saved to Blob `quote-files`, 10-minute owner-only links | Code in `files.py`, tests, container exists. Not yet exercised by a signed-in user in Azure |
| Unsigned requests rejected | `GET /api/quotes` returns 401 `Sign in required` |
| React web app, all 11 prototype screens, demo mode | `npm test` (9 passed), `npm run build`. Deployed and returning 200 |
| Frontend deploy pipeline | `main_quotelensapp.yml` run for `4eabd3c` succeeded and served the new build |
| Comparison rules: lowest stated price, lowest with known extras, $/sq ft, effective $/sq ft, extra, excluded and missing flags | `comparison.py` plus tests, including the real vanity quotes |

## Partly done

| Area | State | Issue |
|---|---|---|
| Extraction | **Mocked.** `extract_quote` ignores the PDF and returns one of three sample quotes by upload position (`extractionSource: "mock"`). `quotelens-docintel` exists and was tested by hand on the samples: it finds vendor and total but never square footage. On 2026-11-20 Adela created the AI Services resource `quotelens-rg-resource-4538` with GPT and embedding deployments. Its studio storage (`quotelensstudio`) and the API's permission to call it (Cognitive Services User) are set up. **Unconfirmed:** which Azure AI feature and analyzer it will use, and whether `quotelens-docintel` is still needed | #14 (Adela), #32, #45 |
| Sign-in (Entra External ID) | API code reads `x-ms-client-principal-id` and is untested in Azure. App Service authentication is not on. Creating the External ID tenant on the student subscription was denied by region policy, so the tenant approach is undecided | #7 (Hugo), #33, #42 |
| Live mode in the web app | `frontend/src/api/live.js` is written and was tested against a local API. The deployed site was built without `VITE_API_BASE`, so it only runs the demo | #25 (Kristi) |
| User profiles | The `users` container exists but nothing writes to it | #33 |

## Missing

- Website calling the deployed API: needs `VITE_API_BASE` in the build, API CORS for the site
  origin with credentials, and sign-in (#25, #7).
- CI for the API. Nothing runs `pytest` on pull requests, and the API is deployed by hand
  with `az functionapp deployment source config-zip --build-remote true` from a script outside
  the repo (#13).
- `main.bicep` matching what runs (#11). Today it only declares a storage account in `eastus`,
  which the subscription policy does not allow.
- Branch protection on `main` (#27). Teammates have pushed straight to `main`.
- Monitoring and cost alerts beyond the budget alert (#26).
- Confidence scores per extracted field and highlighting uncertain values (#32, #43).
- Stretch goals with no owner: missing-item checklist, PDF export, local price ranges (#48 to #50).

## Known bugs and limits (from the code)

- Extraction runs inside the upload request, so a quote never shows `reading` to the client.
- Two uploads to the same comparison at the same time can overwrite `quoteIds` or pass the
  5-quote limit, because writes do not check Cosmos ETags. Upload one file at a time (the
  web app already does).
- API CORS allows only `http://localhost:5173`, with `supportCredentials: false`. `live.js`
  sends `credentials: 'include'`, so the deployed site needs both changed.
- Demo mode keeps uploaded PDFs only for the open tab. Data is in `localStorage`.
- The site is served by `pm2 --spa`, so every unknown path returns 200 with `index.html`.
  Check page content, not the status code.
- The workflow also triggers on changes to root `index.html`, `css/`, `js/`, `assets/`, but it
  deploys only `frontend/dist` while `frontend/package.json` exists.

## Out-of-date documents

These still describe the earlier plan. Do not rely on them until they are updated.

- `README.md` (owner: issue #35): the badge and live-site URL are placeholders. Setup says
  `npm install` for the API (it is Python) and `python -m http.server` for the frontend (it is
  Vite). The architecture row says "Static web frontend (HTML/CSS/JS)". Status says "Done: UI,
  Blob upload".
- `api/README.md`: says "Nothing is deployed to Azure yet" and asks Crislen to edit `js/api.js`.
- Issues #9 and #18 refer to root `css/` and `js/` files. The React app in `frontend/` replaced
  that plan. **Unconfirmed** whether the team wants to close or reword them.
- Issues #8, #22, #23 and #47 ask for reviews of PRs #4, #5, #6 and #24, which are already merged.

## Branches (2026-11-20)

| Branch | State |
|---|---|
| `main` | Current |
| `web/app-from-prototype` | Merged as PR #54. Can be deleted |
| `frontend` | PR #52 closed unmerged. A comment on the PR explains how to redo the work in `frontend/src/` |
| `Data/AI` | Adela's regex test script (`process_quote.py`) and a sample PDF. Never merged, no PR |

## Priorities (from the milestones)

Milestone dates: "Core features working" Nov 22, "Demo ready" Nov 29, then demos Nov 30 to
Dec 13 and the report Dec 14 to 20. Open issues on "Core features working", in rough order of
what blocks the demo:

1. #14 real extraction with Document Intelligence (Adela)
2. #7 sign-in, then #42 sign-in on the website (Hugo, Crislen)
3. #25 site calls the API: build setting plus CORS (Kristi)
4. #13 CI for the API and tests (Kristi)
5. #32 / #43 confidence scores and highlighting (Hugo, Crislen)
6. #27 branch protection (Kristi)
7. #10 decide which screens the demo needs (Hugo)

**Unconfirmed:** whether the team will demo in demo mode if sign-in is not ready. If it does,
#25 and #42 matter less than #14.
