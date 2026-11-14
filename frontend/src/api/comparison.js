// A line-for-line port of api/quotelens/comparison.py, used by demo mode so the browser builds
// the same results the API would. Keep the two in step: same rules, same sentences.

export const SERVICE_NAMES = {
  installation: 'installation',
  sinkCutout: 'the sink cutout',
  backsplash: 'backsplash',
  tearOut: 'tear-out',
};

const round2 = (n) => Math.round(n * 100) / 100;

// Python: f"${value:,.2f}" if value % 1 else f"${value:,.0f}"
export function money(value) {
  const cents = value % 1 !== 0;
  return '$' + Number(value).toLocaleString('en-US', {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });
}

const name = (quote) => quote.contractor.name;
const join = (names) => (names.length === 1 ? names[0] : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1]);
const service = (quote, key) => quote.services?.[key] ?? { status: 'not_specified', amount: null, detail: '' };

export function summarizeQuote(quote) {
  const extras = Object.keys(SERVICE_NAMES).map((key) => service(quote, key)).filter((item) => item.status === 'extra');
  const knownExtras = extras.reduce((sum, item) => sum + (item.amount || 0), 0);
  const knownCost = quote.totalPrice + knownExtras;
  const sqft = quote.squareFootage;
  return {
    quoteId: quote.id,
    contractor: name(quote),
    statedTotal: quote.totalPrice,
    knownExtras,
    knownCost,
    hasUnpricedExtras: extras.some((item) => item.amount == null),
    pricePerSqFt: sqft ? round2(quote.totalPrice / sqft) : null,
    effectivePricePerSqFt: sqft ? round2(knownCost / sqft) : null,
    excludedServices: Object.keys(SERVICE_NAMES).filter((key) => service(quote, key).status === 'excluded'),
  };
}

function lowest(summaries, field) {
  const low = Math.min(...summaries.map((s) => s[field]));
  return summaries.filter((s) => s[field] === low);
}

// Python's f"{x:g}" for the square footage values QuoteLens sees.
const sqftText = (n) => String(Number(n));

function flagsFor(quotes) {
  const flags = [];
  for (const quote of quotes) {
    for (const [key, label] of Object.entries(SERVICE_NAMES)) {
      const item = service(quote, key);
      if (item.status === 'extra') {
        const price = item.amount != null ? money(item.amount) : 'amount not stated';
        flags.push({ kind: 'extra', text: `${name(quote)} charges extra for ${label} (${price}).` });
      }
    }
  }

  for (const [key, label] of Object.entries(SERVICE_NAMES)) {
    const excluded = quotes.filter((q) => service(q, key).status === 'excluded');
    if (excluded.length === quotes.length && quotes.length > 1) {
      flags.push({ kind: 'excluded', text: `None of the quotes include ${label}. Budget for it separately.` });
    } else if (excluded.length) {
      const verb = excluded.length === 1 ? 'does' : 'do';
      flags.push({ kind: 'excluded', text: `${join(excluded.map(name))} ${verb} not include ${label}.` });
    }
  }

  for (const [key, label] of Object.entries(SERVICE_NAMES)) {
    const unknown = quotes.filter((q) => service(q, key).status === 'not_specified');
    if (unknown.length && (key === 'installation' || unknown.length < quotes.length)) {
      flags.push({ kind: 'missing', text: `${join(unknown.map(name))} did not say whether ${label} is included.` });
    }
  }

  if (new Set(quotes.map((q) => (q.materialType || '').trim().toLowerCase())).size > 1) {
    const parts = quotes.map((q) => `${name(q)}: ${q.materialType || 'not specified'}`);
    flags.push({ kind: 'info', text: 'Different materials. ' + parts.join('; ') + '.' });
  }

  if (new Set(quotes.map((q) => q.squareFootage ?? null)).size > 1) {
    const parts = quotes.map((q) => `${name(q)}: ${q.squareFootage ? sqftText(q.squareFootage) + ' sq ft' : 'not specified'}`);
    flags.push({ kind: 'info', text: 'Different square footage. ' + parts.join('; ') + '.' });
  }
  return flags;
}

function summaryText(lowestStated, lowestKnown) {
  const stated = lowestStated[0].statedTotal;
  const verb = lowestStated.length === 1 ? 'has' : 'share';
  const text = `${join(lowestStated.map((s) => s.contractor))} ${verb} the lowest stated price at ${money(stated)}.`;
  const sameSet = lowestKnown.length === lowestStated.length && lowestKnown.every((k) => lowestStated.some((s) => s.quoteId === k.quoteId));
  if (sameSet) return text;
  const cost = lowestKnown[0].knownCost;
  return text + ` With known extras added, ${join(lowestKnown.map((s) => s.contractor))} is lowest at ${money(cost)}.`;
}

export function buildResults(quotes) {
  const summaries = quotes.map(summarizeQuote);
  const lowestStated = lowest(summaries, 'statedTotal');
  const lowestKnown = lowest(summaries, 'knownCost');
  const totals = summaries.map((s) => s.statedTotal);
  return {
    quotes: summaries,
    lowestStatedQuoteIds: lowestStated.map((s) => s.quoteId),
    lowestKnownCostQuoteIds: lowestKnown.map((s) => s.quoteId),
    priceDifference: Math.max(...totals) - Math.min(...totals),
    flags: flagsFor(quotes),
    summary: summaryText(lowestStated, lowestKnown),
  };
}
