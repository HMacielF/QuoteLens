// Demo mode: the same endpoints as the API, run in this browser and saved in localStorage.
// The rules are ported from api/quotelens/service.py so the demo behaves like the real thing.
import { buildResults } from './comparison.js';
import { ApiError } from './errors.js';
import { extractQuote, normalizeExtracted } from './samples.js';

export const MAX_QUOTES_PER_COMPARISON = 5;
export const MIN_QUOTES_PER_COMPARISON = 2;
export const MAX_PDF_BYTES = 20 * 1024 * 1024;
const LINK_MINUTES = 10;

const nowIso = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const newId = (prefix) => `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
const clone = (value) => structuredClone(value);

// Object URLs for the PDFs picked in this tab. They do not survive a reload.
const pdfUrls = new Map();

export function createDemoApi({ userId, storage = globalThis.localStorage }) {
  const key = `quotelens.demo.${userId}`;

  function load() {
    try {
      const saved = JSON.parse(storage.getItem(key) || 'null');
      if (saved && Array.isArray(saved.comparisons) && Array.isArray(saved.quotes)) return saved;
    } catch {
      // Unreadable or blocked storage: start empty.
    }
    return { comparisons: [], quotes: [] };
  }

  function save(db) {
    try {
      storage.setItem(key, JSON.stringify(db));
    } catch {
      // Storage full or blocked: the demo still works until the tab closes.
    }
  }

  const later = (fn) => new Promise((resolve, reject) => setTimeout(() => {
    try { resolve(fn()); } catch (error) { reject(error); }
  }, 120));

  function requireComparison(db, id) {
    const comparison = db.comparisons.find((c) => c.id === id && c.userId === userId);
    if (!comparison) throw new ApiError(404, 'Comparison not found');
    return comparison;
  }

  function requireQuote(db, id) {
    const quote = db.quotes.find((q) => q.id === id && q.userId === userId);
    if (!quote) throw new ApiError(404, 'Quote not found');
    return quote;
  }

  const quotesOf = (db, comparisonId) =>
    db.quotes.filter((q) => q.userId === userId && (!comparisonId || q.comparisonId === comparisonId))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  function markStale(comparison) {
    comparison.status = 'draft';
    comparison.results = null;
  }

  function validateReviewed(reviewed) {
    const details = [];
    const data = normalizeExtracted(reviewed || {});
    if (!data.contractor.name.trim()) details.push({ field: 'contractor.name', message: 'contractor.name is required' });
    if (data.totalPrice == null) details.push({ field: 'totalPrice', message: 'totalPrice is required' });
    else if (!(data.totalPrice > 0)) details.push({ field: 'totalPrice', message: 'Input should be greater than 0' });
    if (data.squareFootage != null && !(data.squareFootage > 0)) details.push({ field: 'squareFootage', message: 'Input should be greater than 0' });
    for (const [name, item] of Object.entries(data.services)) {
      if (item.amount != null && item.amount < 0) details.push({ field: `services.${name}.amount`, message: 'Input should be greater than or equal to 0' });
    }
    if (details.length) throw new ApiError(422, 'Invalid data', details);
    return data;
  }

  return {
    mode: 'demo',

    health: () => later(() => ({ status: 'ok', store: 'BrowserDemoStore' })),

    listComparisons: () => later(() => clone(load().comparisons.filter((c) => c.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)))),

    createComparison: (title) => later(() => {
      const clean = String(title || '').trim();
      if (!clean || clean.length > 120) {
        throw new ApiError(422, 'Invalid data', [{ field: 'title', message: 'Give the comparison a name of 1 to 120 characters' }]);
      }
      const db = load();
      const comparison = { id: newId('comp'), userId, title: clean, status: 'draft', quoteIds: [], results: null, createdAt: nowIso() };
      db.comparisons.push(comparison);
      save(db);
      return clone(comparison);
    }),

    getComparison: (id) => later(() => {
      const db = load();
      return clone({ ...requireComparison(db, id), quotes: quotesOf(db, id) });
    }),

    async addQuote(comparisonId, file) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      return later(() => {
        const db = load();
        const comparison = requireComparison(db, comparisonId);
        const head = String.fromCharCode(...bytes.slice(0, 5));
        if (head !== '%PDF-') throw new ApiError(415, 'QuoteLens reads PDF estimates only');
        if (bytes.length > MAX_PDF_BYTES) throw new ApiError(413, 'PDF is larger than 20 MB');
        const position = comparison.quoteIds.length;
        if (position >= MAX_QUOTES_PER_COMPARISON) throw new ApiError(409, `A comparison can hold up to ${MAX_QUOTES_PER_COMPARISON} quotes`);

        const fileName = String(file.name || 'quote.pdf').replace(/[^\w. -]/g, '_').slice(0, 120);
        const id = newId('quote');
        pdfUrls.set(id, URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })));
        const quote = {
          ...extractQuote(position),
          id, userId, comparisonId, status: 'details_ready', fileName,
          pdfBlobPath: `${userId}/${comparisonId}/${id}.pdf`,
          extractionSource: 'mock', createdAt: nowIso(), extractedAt: nowIso(), confirmedAt: null,
        };
        db.quotes.push(quote);
        comparison.quoteIds.push(id);
        markStale(comparison);
        save(db);
        return clone(quote);
      });
    },

    getStatus: (id) => later(() => {
      const db = load();
      requireComparison(db, id);
      const quotes = quotesOf(db, id);
      return {
        comparisonId: id,
        files: quotes.map((q) => ({ quoteId: q.id, fileName: q.fileName, status: q.status })),
        readyForReview: quotes.length > 0 && quotes.every((q) => q.status !== 'reading'),
      };
    }),

    buildComparison: (id) => later(() => {
      const db = load();
      const comparison = requireComparison(db, id);
      const quotes = quotesOf(db, id);
      const confirmed = quotes.filter((q) => q.status === 'confirmed');
      if (confirmed.length !== quotes.length) throw new ApiError(409, 'Confirm every quote before comparing');
      if (confirmed.length < MIN_QUOTES_PER_COMPARISON) throw new ApiError(409, `A comparison needs at least ${MIN_QUOTES_PER_COMPARISON} quotes`);
      comparison.results = buildResults(confirmed);
      comparison.status = 'ready';
      save(db);
      return clone(comparison);
    }),

    listQuotes: () => later(() => clone(quotesOf(load()))),

    confirmQuote: (id, reviewed) => later(() => {
      const data = validateReviewed(reviewed);
      const db = load();
      const quote = requireQuote(db, id);
      if (quote.status === 'reading' || quote.status === 'failed') throw new ApiError(409, 'This quote has no extracted details to confirm');
      Object.assign(quote, data, { status: 'confirmed', confirmedAt: nowIso() });
      const comparison = requireComparison(db, quote.comparisonId);
      if (comparison.results != null) markStale(comparison);
      save(db);
      return clone(quote);
    }),

    getPdfLink: (id) => later(() => {
      const quote = requireQuote(load(), id);
      const url = pdfUrls.get(quote.id);
      if (!url) throw new ApiError(404, 'Demo mode keeps the original PDF only until this tab is closed or reloaded');
      return { url, expiresInMinutes: LINK_MINUTES };
    }),

    reset: () => {
      try { storage.removeItem(key); } catch { /* nothing saved */ }
    },
  };
}
