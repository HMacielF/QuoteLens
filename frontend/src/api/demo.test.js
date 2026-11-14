// Mirrors api/tests/test_flow.py, so demo mode and the API agree on the rules and the wording.
import { beforeEach, describe, expect, it } from 'vitest';
import { createDemoApi } from './demo.js';

const PDF = '%PDF-1.4 sample';
const memoryStorage = () => {
  const data = new Map();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: (k) => data.delete(k) };
};
const pdf = (name = 'quote.pdf', text = PDF) => new File([text], name, { type: 'application/pdf' });
const reviewedFrom = (quote) => {
  const { contractor, quoteNumber, quoteDate, materialType, color, totalPrice, squareFootage, edgeProfile, services, otherItems, notes, lineItems } = quote;
  return { contractor, quoteNumber, quoteDate, materialType, color, totalPrice, squareFootage, edgeProfile, services, otherItems, notes, lineItems };
};

let api;
let storage;
beforeEach(() => {
  storage = memoryStorage();
  api = createDemoApi({ userId: 'user1', storage });
});

async function upload(count) {
  const comparison = await api.createComparison('Kitchen');
  const quotes = [];
  for (let i = 0; i < count; i += 1) quotes.push(await api.addQuote(comparison.id, pdf(`q${i}.pdf`)));
  return { comparison, quotes };
}

async function confirmAs(quote, name, total, sqft, services = {}) {
  return api.confirmQuote(quote.id, { contractor: { name }, totalPrice: total, squareFootage: sqft, services });
}

describe('demo API', () => {
  it('runs the full flow and builds the same results as the API', async () => {
    const { comparison, quotes } = await upload(3);
    const status = await api.getStatus(comparison.id);
    expect(status.readyForReview).toBe(true);
    expect(status.files.map((f) => f.status)).toEqual(['details_ready', 'details_ready', 'details_ready']);
    for (const quote of quotes) await api.confirmQuote(quote.id, reviewedFrom(quote));

    const { results } = await api.buildComparison(comparison.id);
    const byName = Object.fromEntries(results.quotes.map((q) => [q.contractor, q]));
    expect(results.lowestStatedQuoteIds).toEqual([byName['Modern Surfaces'].quoteId]);
    expect(results.lowestKnownCostQuoteIds).toEqual([byName['ABC Countertops'].quoteId]);
    expect(byName['Modern Surfaces'].knownCost).toBe(8800);
    expect(byName['Premier Stone'].knownCost).toBe(10230);
    expect(byName['ABC Countertops'].pricePerSqFt).toBe(208.33);
    expect(results.priceDifference).toBe(1780);
    expect(results.summary).toContain('ABC Countertops is lowest at $8,750');
    expect(results.flags.some((f) => f.text.includes('Different square footage'))).toBe(true);
    expect(results.flags.some((f) => f.text.includes('Premier Stone charges extra for the sink cutout ($250)'))).toBe(true);

    const loaded = await api.getComparison(comparison.id);
    expect(loaded.status).toBe('ready');
    expect(loaded.quotes).toHaveLength(3);
  });

  it('refuses to compare before every quote is confirmed, or with fewer than 2', async () => {
    const { comparison, quotes } = await upload(2);
    await expect(api.buildComparison(comparison.id)).rejects.toMatchObject({ status: 409 });
    const single = await upload(1);
    await api.confirmQuote(single.quotes[0].id, reviewedFrom(single.quotes[0]));
    await expect(api.buildComparison(single.comparison.id)).rejects.toMatchObject({ status: 409 });
    expect(quotes).toHaveLength(2);
  });

  it('caps a comparison at 5 quotes and reads PDFs only', async () => {
    const { comparison } = await upload(5);
    await expect(api.addQuote(comparison.id, pdf())).rejects.toMatchObject({ status: 409 });
    const other = await api.createComparison('Other');
    await expect(api.addQuote(other.id, pdf('notes.txt', 'hello'))).rejects.toMatchObject({ status: 415 });
  });

  it('marks a built comparison stale when a quote changes', async () => {
    const { comparison, quotes } = await upload(2);
    for (const quote of quotes) await api.confirmQuote(quote.id, reviewedFrom(quote));
    await api.buildComparison(comparison.id);
    await confirmAs(quotes[0], 'ABC Countertops', 1000, 40);
    const reloaded = await api.getComparison(comparison.id);
    expect(reloaded.status).toBe('draft');
    expect(reloaded.results).toBeNull();
    expect((await api.buildComparison(comparison.id)).results.quotes[0].statedTotal).toBe(1000);
  });

  it('requires a contractor name and a total when confirming', async () => {
    const { quotes } = await upload(1);
    await expect(api.confirmQuote(quotes[0].id, { contractor: { name: 'ABC' } })).rejects.toMatchObject({ status: 422 });
    await expect(api.confirmQuote(quotes[0].id, { totalPrice: 100 })).rejects.toMatchObject({ status: 422 });
  });

  it('flags an extra with no amount', async () => {
    const { comparison, quotes } = await upload(2);
    const data = reviewedFrom(quotes[0]);
    data.services.installation = { status: 'extra', amount: null, detail: '' };
    await api.confirmQuote(quotes[0].id, data);
    await api.confirmQuote(quotes[1].id, reviewedFrom(quotes[1]));
    const { results } = await api.buildComparison(comparison.id);
    expect(results.quotes[0].hasUnpricedExtras).toBe(true);
    expect(results.flags.some((f) => f.text.includes('amount not stated'))).toBe(true);
  });

  it('flags exclusions and effective price on the real vanity quotes', async () => {
    const { comparison, quotes } = await upload(2);
    const none = { status: 'excluded' };
    await confirmAs(quotes[0], 'Architecture Stones', 2779.94, 14.2, { installation: none });
    await confirmAs(quotes[1], 'Granite Works', 3929.8, 12, { installation: none, sinkCutout: { status: 'extra', amount: 150 } });
    const { results } = await api.buildComparison(comparison.id);
    const byName = Object.fromEntries(results.quotes.map((q) => [q.contractor, q]));
    expect(byName['Architecture Stones'].pricePerSqFt).toBe(195.77);
    expect(byName['Granite Works'].effectivePricePerSqFt).toBe(339.98);
    expect(byName['Granite Works'].excludedServices).toEqual(['installation']);
    const texts = results.flags.map((f) => f.text);
    expect(texts).toContain('None of the quotes include installation. Budget for it separately.');
    expect(texts.some((t) => t.includes('did not say whether installation'))).toBe(false);
    expect(texts.some((t) => t.includes('Different square footage'))).toBe(true);
  });

  it('names a single quote that excludes a service', async () => {
    const { comparison, quotes } = await upload(2);
    await confirmAs(quotes[0], 'Shop A', 1000, null, { backsplash: { status: 'excluded' } });
    await confirmAs(quotes[1], 'Shop B', 1200, null, { backsplash: { status: 'included' } });
    const { results } = await api.buildComparison(comparison.id);
    expect(results.flags).toContainEqual({ kind: 'excluded', text: 'Shop A does not include backsplash.' });
    expect(results.quotes.every((q) => q.effectivePricePerSqFt === null)).toBe(true);
  });

  it('keeps each user to their own data', async () => {
    await upload(1);
    const other = createDemoApi({ userId: 'user2', storage });
    expect(await other.listComparisons()).toEqual([]);
    await expect(other.listQuotes()).resolves.toEqual([]);
  });
});
