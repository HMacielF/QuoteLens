# QuoteLens API - Hugo

Azure Functions (Python 3.12) backend for QuoteLens. It stores quotes and comparisons in
Cosmos DB and works out which quote is cheapest once known extras are added.

This starter was written with Claude Code. See [AI_DISCLOSURE.md](../AI_DISCLOSURE.md).

## Run it

Needs Python 3.12, Azure Functions Core Tools 4, and Docker for the local database.

    cd api
    python3.12 -m venv .venv && source .venv/bin/activate
    pip install -r requirements-dev.txt
    cp local.settings.example.json local.settings.json

    # Optional, without it data is kept in memory until restart
    docker run -d --name quotelens-cosmos -p 8081:8081 -p 1234:1234 \
      mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:vnext-preview --protocol http
    # Then set COSMOS_ENDPOINT to http://localhost:8081 in local.settings.json, and
    # COSMOS_KEY to the emulator key from Microsoft's Cosmos DB emulator docs

    func start
    python scripts/demo_flow.py    # in a second terminal, walks the whole flow

## Tests

    pytest                          # in memory
    COSMOS_ENDPOINT=http://localhost:8081 COSMOS_KEY=<emulator key> pytest    # also against Cosmos

## Endpoints

All routes are under `/api`. Every route except `health` needs a signed-in user, and every
read is limited to that user's Cosmos partition. Another user's id returns 404.

| Method | Route | Prototype screen | Does |
|---|---|---|---|
| GET | `/health` | | Reports which store is running |
| POST | `/comparisons` | New Comparison | Creates a draft from `{"title": "..."}` |
| GET | `/comparisons` | My Comparisons | Lists the user's comparisons |
| GET | `/comparisons/{id}` | Comparison Results | One comparison with its quotes |
| POST | `/comparisons/{id}/quotes` | New Comparison | Takes raw PDF bytes, with the name in `x-file-name`. Limits: 5 quotes, 20 MB |
| GET | `/comparisons/{id}/status` | Processing | Status of each file |
| POST | `/comparisons/{id}/build` | Comparison Results | Builds results once 2+ quotes are all confirmed |
| GET | `/quotes` | My Quotes | Every quote the user has |
| PUT | `/quotes/{id}/confirm` | Review | Saves the reviewed fields. Editing a quote clears old results |

Errors look like `{"error": "message"}`, and 422 responses add `details` per field.

## Data model

Containers `users`, `comparisons` and `quotes`, all partitioned on `/userId`.

This extends the Cosmos slide in two ways the prototype needs. `services` is an object instead of
a flat list, so each service can be `included`, `extra` or `not_specified` with an amount. Quotes
also gain material, color, edge, date, notes and a `status` for the Processing screen.
`users` is created but not written yet; that comes with Entra sign-in.

## What each teammate needs

- **Adela (extraction):** replace the body of `extract_quote` in `quotelens/extraction.py` with
  the Document Intelligence call, keeping its signature. It returns `ExtractedQuote` in
  `quotelens/models.py`. Fields it can't find stay empty, and services stay `not_specified`.
- **Crislen (frontend):** point `js/api.js` at these routes. Until Entra is in, send
  `x-user-id` locally. Port 5173 is already allowed for CORS.
- **Kristi (infrastructure):** the Function App needs Python 3.12, `COSMOS_ENDPOINT`, `COSMOS_KEY`,
  `COSMOS_DATABASE`, and App Service authentication on with Entra External ID.
  Never set `ALLOW_DEV_USER` in Azure.

## Mocked or not done yet

- Extraction returns the prototype's three sample quotes and never reads the PDF. These quotes
  have `extractionSource: "mock"`.
- PDFs are not saved to Blob Storage yet, so `pdfBlobPath` is empty.
- Extraction runs inside the upload request, so `status` only ever shows the end state. It will
  matter once extraction runs in the background.
- Entra sign-in is written but untested until it is deployed. Locally, `x-user-id` stands in.
- Upload files one at a time. Two uploads at once to the same comparison can overwrite its
  `quoteIds` or pass the 5-quote limit until writes check Cosmos ETags.
- Nothing is deployed to Azure yet.
