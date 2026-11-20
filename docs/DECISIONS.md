# Decisions

Each entry gives the decision, why it was made, the tradeoff, and where it is recorded. Only
decisions visible in the code, commits, issues or existing docs are listed. Add new ones at the
bottom with a date. If you change a decision, mark the old entry **Replaced** and link to the new one.

## D1. Backend is Python 3.12 Azure Functions on Linux Flex Consumption
- **Why:** The backend was written in Python (`api/`). The first Function App the team created
  was Windows and Node, which cannot run it, so a separate Linux Python app (`quotelens-api-hmf`)
  was created on 2026-11-12. The old Node app was deleted on 2026-11-20.
- **Tradeoff:** Flex Consumption has a slower cold start and some `az functionapp` commands
  return nulls. Use `az resource show --resource-type Microsoft.Web/sites` instead.
- **Source:** `api/README.md`, AI_DISCLOSURE Nov 12 entry, issue #21.

## D2. Routes are thin and rules live in `service.py`
- **Why:** The rules can be tested without an HTTP host. The tests call `service` directly
  against `MemoryStore`, and against Cosmos when `COSMOS_ENDPOINT` is set.
- **Source:** docstrings in `api/function_app.py` and `api/quotelens/service.py`.

## D3. Cosmos DB, serverless, partitioned on `/userId`
- **Why:** Every query belongs to one homeowner, so the user id is the natural partition key.
  It also makes cross-user reads structurally hard. Serverless matches the class labs, and an
  attempt to create a free-tier account timed out on Azure's side (2026-10-31).
- **Tradeoff:** No cross-user queries (none are needed). Containers must be created with a key
  or in the portal. Managed identity can read and write items but cannot create containers.
- **Source:** `api/quotelens/store.py`, `api/README.md`.

## D4. Another user's record returns 404, not 403
- **Why:** A 404 does not reveal that the id exists.
- **Source:** `api/README.md` ("Another user's id returns 404"), `test_users_cannot_see_each_others_data`.

## D5. Services have four states: included, extra, excluded, not_specified
- **Why:** Real quotes say "installation not included" (excluded), bill items on top (extra),
  or say nothing (not specified). A flat list of services could not show the difference, and
  that difference is the point of the comparison.
- **Tradeoff:** The data model goes beyond the Cosmos schema on the project slides.
- **Source:** `api/quotelens/models.py`, `api/README.md` "Data model", PR #6.

## D6. The comparison uses fixed rules, not AI
- **Why:** Every number and sentence on the results screen must trace back to a value the
  homeowner confirmed.
- **Source:** docstring in `api/quotelens/comparison.py`.

## D7. Nothing counts until the homeowner confirms it
- **Why:** Extraction will make mistakes, so the Review screen is the check. `contractor.name`
  and `totalPrice` are required to confirm. Editing a confirmed quote clears old results.
- **Source:** `ConfirmQuoteRequest` in `models.py`, `confirm_quote` in `service.py`, tests.

## D8. Unknown values stay unknown
- **Why:** A missing square footage must show as "not specified", not $0 per sq ft.
- **Source:** `samples/vanity-2025/README.md`, `summarize_quote` in `comparison.py`.

## D9. Extraction is mocked behind a fixed signature
- **Why:** The rest of the app could be built and tested before Document Intelligence was ready.
  The extraction owner replaces only the body of `extract_quote`.
- **Tradeoff:** Until then every upload returns sample data, whatever the PDF says.
- **Source:** `api/quotelens/extraction.py`, `api/README.md` "What each teammate needs".
- **Open:** The hand test on 2026-11-12 showed `prebuilt-invoice` never returns square footage,
  edge or sink counts. A text parser over the OCR content was suggested
  (`samples/vanity-2025/README.md`). **Not decided.**

## D10. In Azure, services sign in with managed identity, not keys
- **Why:** No secrets in app settings. `COSMOS_KEY` stays unset. The Function App's identity
  has Cosmos Built-in Data Contributor, Storage Blob Data Contributor on `quote-files`, and
  Storage Blob Delegator on the account.
- **Source:** `store.py`, `files.py`, `api/README.md`.

## D11. PDFs are private, with short read-only links
- **Why:** Quotes contain names, addresses and prices. Files are saved under
  `<userId>/<comparisonId>/<quoteId>.pdf`. The owner gets a user-delegation SAS link, read-only,
  valid for 10 minutes.
- **Source:** `api/quotelens/files.py`, PR #24.

## D12. Identity comes from App Service authentication (Entra External ID)
- **Why:** Azure sets `x-ms-client-principal-id` after sign-in and overwrites any value the
  client sends. The API trusts it only when `WEBSITE_AUTH_ENABLED=true`. For local work,
  `x-user-id` is accepted only with `ALLOW_DEV_USER=true`.
- **Status:** Blocked. Creating the External ID tenant on the student subscription was denied
  by its region policy (2026-11-12, issue #7). **Not decided:** host the tenant on a personal
  Azure account, or use the External ID trial.
- **Source:** `user_id()` in `api/function_app.py`, `api/tests/test_auth.py`, issue #7.

## D13. Limits: 2 to 5 quotes, PDF only, 20 MB
- **Why:** These limits come from the prototype screens. PDF is checked by its `%PDF-` header,
  not the file name.
- **Source:** `models.py`, `service.py`, mirrored in `frontend/src/api/demo.js`.

## D14. The web app is React with Vite in `frontend/`, with a demo mode in the browser
- **Why:** It was built from the 11-screen prototype (PR #54, 2026-11-14, merged 2026-11-20).
  Demo mode ports the API rules to JavaScript, so the app can be shown without sign-in or Azure.
  Live mode uses the same interface against the real API.
- **Tradeoff:** The rules exist twice (Python and JavaScript) and must be kept in step by hand.
  The earlier plan of plain `index.html` plus `css/` and `js/` files (issues #9, #18) was
  never committed in working form. PR #52, which started on it, was closed.
- **Source:** `frontend/README.md`, `frontend/src/api/`.

## D15. The API address is set at build time
- **Why:** Vite inlines `VITE_API_BASE` into the bundle. The site has no server code to look
  it up at runtime.
- **Tradeoff:** Changing the API address needs a rebuild. **Not done yet** for the deployed site.
- **Source:** `frontend/src/api/index.js`.

## D16. The frontend deploys from GitHub Actions with OIDC
- **Why:** No stored passwords. Deployment Center created the OIDC secrets. The workflow
  builds `frontend/`, runs its tests, deploys `dist/` to `quotelensapp`, and checks the
  site returns 200.
- **Source:** `.github/workflows/main_quotelensapp.yml`, PR #51.
- **Related:** Two other workflows (`main_quotelens-api.yml` and
  `azure-functions-app-nodejs.yml`) failed on every push and were removed in PR #53. The API
  has no pipeline yet (#13).

## D17. Azure region is Central US
- **Why:** The Azure for Students subscription policy denies most regions, including `eastus`.
- **Source:** resource locations, issue #11 (`main.bicep` still defaults to `eastus`).

## D18. Team process: one owner per issue, pull requests to `main`
- **Why:** The team's final proposal names a GitHub Projects board, issues, pull request
  review and an Actions deploy. Each issue has one assignee and a size.
- **Status:** Branch protection is not on yet (#27).
- **Source:** GitHub issues and milestones.
