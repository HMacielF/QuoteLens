"""Walk the whole API over HTTP. Run it while `func start` is running.

    python scripts/demo_flow.py
"""
import json
import os
import urllib.error
import urllib.request

BASE = os.environ.get("QUOTELENS_API", "http://localhost:7071/api")
USER = {"x-user-id": "demo-alex"}
FILES = ["ABC_Countertops_Estimate.pdf", "PremierStone_Quote_1047.pdf", "Modern_Surfaces_Kitchen.pdf"]


def call(method, path, body=None, headers=None, raw=None):
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    request = urllib.request.Request(BASE + path, data=data, method=method, headers={**USER, **(headers or {})})
    with urllib.request.urlopen(request) as response:
        print(f"{method:4} {path:<46} {response.status}")
        return json.loads(response.read())


REVIEW_FIELDS = [
    "contractor", "quoteNumber", "quoteDate", "materialType", "color", "totalPrice", "squareFootage",
    "edgeProfile", "services", "otherItems", "notes", "lineItems",
]

print("store:", call("GET", "/health")["store"])
comparison = call("POST", "/comparisons", {"title": "Kitchen Renovation"})
cid = comparison["id"]

quotes = [
    call("POST", f"/comparisons/{cid}/quotes", headers={"x-file-name": name}, raw=b"%PDF-1.7 demo")
    for name in FILES
]
print("files:", [f["status"] for f in call("GET", f"/comparisons/{cid}/status")["files"]])

for quote in quotes:
    call("PUT", f"/quotes/{quote['id']}/confirm", {key: quote[key] for key in REVIEW_FIELDS})

results = call("POST", f"/comparisons/{cid}/build")["results"]

print()
print(f"{'Contractor':<18}{'Stated':>9}{'Extras':>9}{'Known cost':>12}{'$/sq ft':>10}")
for row in results["quotes"]:
    print(f"{row['contractor']:<18}{row['statedTotal']:>9,.0f}{row['knownExtras']:>9,.0f}{row['knownCost']:>12,.0f}{row['pricePerSqFt']:>10,.2f}")
print()
print(results["summary"])
for flag in results["flags"]:
    print(f"  [{flag['kind']}] {flag['text']}")

print()
print("Saved comparisons:", len(call("GET", "/comparisons")))

try:
    call("GET", f"/comparisons/{cid}", headers={"x-user-id": "someone-else"})
except urllib.error.HTTPError as error:
    print(f"Another user reading this comparison gets: {error.code}")
