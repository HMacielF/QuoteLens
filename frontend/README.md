# QuoteLens web app

React (Vite) front end for QuoteLens, built from the 11-screen prototype: landing, sign-in,
dashboard, new comparison, processing, review, comparison results, quote details, my
comparisons, my quotes, and settings.

## Run it

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm test         # demo-mode rules, checked against the same cases as api/tests
npm run build    # writes dist/, which .github/workflows/main_quotelensapp.yml deploys
```

## Two modes, one interface

Every page talks to `src/api/`, which has the same calls as the API in `api/function_app.py`.

- **Demo (default).** "Continue as Demo User" on the sign-in page. The calls run in the browser
  and save to `localStorage`. `src/api/demo.js` and `src/api/comparison.js` port the rules in
  `api/quotelens/service.py` and `comparison.py` (2 to 5 quotes, PDF only, 20 MB cap, the same
  flags and summary). Extraction uses the same three sample quotes as `extraction.py`. The
  uploaded PDF is kept only for the open tab. If you change a rule in the API, change it here too.
- **Live.** Set `VITE_API_BASE` (the Function App address ending in `/api`) when you build or run
  the dev server. Requests go to the real endpoints with `credentials: 'include'`.
  For a local Functions host started with `ALLOW_DEV_USER=true`, also set `VITE_DEV_USER`; the
  sign-in page then offers "Use the local API", which sends that name as `x-user-id`:

  ```bash
  VITE_API_BASE=http://localhost:7071/api VITE_DEV_USER=dev1 npm run dev
  ```

  The local host needs `"Host": { "CORS": "http://localhost:5173", "CORSCredentials": true }` in
  `local.settings.json`.

Real sign-in waits on Entra External ID (#7). Until then, the sign-in and create-account
buttons are disabled with a note.
