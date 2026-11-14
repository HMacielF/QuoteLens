import { useState } from 'react';
import { SERVICES, STATUS_OPTIONS } from '../format.js';

// The fields the API's ConfirmQuoteRequest accepts, nothing more (it rejects unknown fields).
export function reviewedFields(quote) {
  const { contractor, quoteNumber, quoteDate, materialType, color, totalPrice, squareFootage, edgeProfile, services, otherItems, notes, lineItems } = quote;
  return structuredClone({ contractor, quoteNumber, quoteDate, materialType, color, totalPrice, squareFootage, edgeProfile, services, otherItems, notes, lineItems });
}

const toText = (n) => (n == null ? '' : String(n));
const toNumber = (text) => {
  const clean = String(text).replace(/[$,\s]/g, '').replace(/sq\s*ft/i, '');
  if (!clean) return null;
  const n = Number(clean);
  return Number.isFinite(n) ? n : NaN;
};

function draftFrom(quote) {
  const r = reviewedFields(quote);
  const services = {};
  for (const [key] of SERVICES) {
    const s = r.services?.[key] || {};
    services[key] = { status: s.status || 'not_specified', amount: toText(s.amount), detail: s.detail || '' };
  }
  return { ...r, totalPrice: toText(r.totalPrice), squareFootage: toText(r.squareFootage), services };
}

// Turns the form back into API data, or returns an error message for the person to fix.
function parseDraft(draft) {
  if (!draft.contractor.name.trim()) return { error: 'Contractor name is required.' };
  const total = toNumber(draft.totalPrice);
  if (total == null || Number.isNaN(total) || total <= 0) return { error: 'Enter the total price as a number, like 8750.' };
  const sqft = toNumber(draft.squareFootage);
  if (Number.isNaN(sqft) || (sqft != null && sqft <= 0)) return { error: 'Square footage must be a number above 0, or blank if the quote does not say.' };
  const services = {};
  for (const [key, label] of SERVICES) {
    const s = draft.services[key];
    const amount = toNumber(s.amount);
    if (Number.isNaN(amount) || (amount != null && amount < 0)) return { error: `${label}: the amount must be a number, or blank.` };
    services[key] = { status: s.status, amount, detail: s.detail.trim() };
  }
  return {
    value: {
      ...draft,
      contractor: Object.fromEntries(Object.entries(draft.contractor).map(([k, v]) => [k, String(v ?? '').trim()])),
      totalPrice: total,
      squareFootage: sqft,
      services,
    },
  };
}

export function QuoteForm({ quote, onSave, onCancel, saving, idPrefix }) {
  const [draft, setDraft] = useState(() => draftFrom(quote));
  const [error, setError] = useState('');
  const id = (name) => `${idPrefix}-${name}`;
  const set = (path, value) => setDraft((d) => {
    const next = structuredClone(d);
    let target = next;
    const keys = path.split('.');
    keys.slice(0, -1).forEach((k) => { target = target[k]; });
    target[keys[keys.length - 1]] = value;
    return next;
  });

  const text = (path, label, props = {}) => {
    const value = path.split('.').reduce((o, k) => o?.[k], draft) ?? '';
    return (
      <div className="field" key={path}>
        <label htmlFor={id(path)}>{label}</label>
        <input id={id(path)} className="input input-sm" value={value} placeholder="Not Specified" onChange={(e) => set(path, e.target.value)} {...props} />
      </div>
    );
  };

  const submit = (event) => {
    event.preventDefault();
    const parsed = parseDraft(draft);
    if (parsed.error) {
      setError(parsed.error);
      return;
    }
    setError('');
    onSave(parsed.value);
  };

  return (
    <form onSubmit={submit} className="stack" style={{ gap: 14 }} noValidate>
      <p className="hint" style={{ lineHeight: 1.5 }}>Leave a field blank if the quote doesn't mention it. Saving confirms these details for the comparison.</p>
      <div className="grid-auto" style={{ '--min': '200px', gap: 12 }}>
        {text('contractor.name', 'Contractor name (required)')}
        {text('totalPrice', 'Total price in $ (required)', { inputMode: 'decimal' })}
        {text('squareFootage', 'Square footage', { inputMode: 'decimal' })}
        {text('materialType', 'Material type')}
        {text('color', 'Material name / color')}
        {text('edgeProfile', 'Edge profile')}
        {text('quoteNumber', 'Quote number')}
        {text('quoteDate', 'Quote date (YYYY-MM-DD)')}
        {text('contractor.contactName', 'Contact name')}
        {text('contractor.phone', 'Phone')}
        {text('contractor.email', 'Email')}
        {text('contractor.city', 'City')}
      </div>
      <fieldset className="stack" style={{ gap: 10, border: '1px solid var(--slate-200)', borderRadius: 10, padding: '12px 14px', margin: 0 }}>
        <legend className="small strong" style={{ padding: '0 6px' }}>Services</legend>
        {SERVICES.map(([key, label]) => (
          <div key={key} className="grid-auto" style={{ '--min': '150px', gap: 8, alignItems: 'end' }}>
            <div className="field">
              <label htmlFor={id(`${key}-status`)}>{label}</label>
              <select id={id(`${key}-status`)} className="select input-sm" value={draft.services[key].status} onChange={(e) => set(`services.${key}.status`, e.target.value)}>
                {STATUS_OPTIONS.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor={id(`${key}-amount`)} className="small">Amount ($)</label>
              <input id={id(`${key}-amount`)} className="input input-sm" inputMode="decimal" placeholder="Not stated" value={draft.services[key].amount} onChange={(e) => set(`services.${key}.amount`, e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor={id(`${key}-detail`)} className="small">Detail</label>
              <input id={id(`${key}-detail`)} className="input input-sm" placeholder="e.g., 4 in." value={draft.services[key].detail} onChange={(e) => set(`services.${key}.detail`, e.target.value)} />
            </div>
          </div>
        ))}
      </fieldset>
      {text('otherItems', 'Other line items')}
      <div className="field">
        <label htmlFor={id('notes')}>Notes / exclusions</label>
        <textarea id={id('notes')} className="input input-sm" value={draft.notes} placeholder="Not Specified" onChange={(e) => set('notes', e.target.value)} />
      </div>
      {error && <p role="alert" className="small" style={{ color: 'var(--red)', fontWeight: 600 }}>{error}</p>}
      <div className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-quiet" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save and confirm'}</button>
      </div>
    </form>
  );
}
