import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout.jsx';
import { QuoteForm } from '../components/QuoteForm.jsx';
import { ErrorNotice, Loading, MockExtractionNotice, Pill, ServiceTag, Value } from '../components/ui.jsx';
import { Icon } from '../icons.jsx';
import { SERVICES, formatDate, money, perSqFt, quoteStatus, serviceView, sqftLabel } from '../format.js';
import { useSession } from '../session.jsx';
import { useLoad } from '../useLoad.js';

const VIEWS = [['data', 'Extracted data'], ['pdf', 'Original PDF'], ['split', 'Side by side']];

function PdfPane({ quote }) {
  const { api } = useSession();
  const link = useLoad(() => api.getPdfLink(quote.id), [api, quote.id]);
  // The local API's in-memory file store returns memory:// links that a browser can't open.
  const openable = link.data && /^(https?|blob):/.test(link.data.url);
  return (
    <div className="stack" style={{ flex: '1 1 460px', minWidth: 0, gap: 10 }}>
      <div className="row between small" style={{ gap: 8, color: 'var(--slate-600)' }}>
        <span className="row" style={{ gap: 6 }}><Icon name="file" size={14} />{quote.fileName}</span>
        {openable && <a href={link.data.url} target="_blank" rel="noreferrer" className="btn-link" style={{ fontSize: 13 }}>Open in a new tab</a>}
      </div>
      {link.loading && <Loading label="Opening the PDF" />}
      {link.error && <ErrorNotice error={link.error} />}
      {openable && <iframe title={`Original PDF: ${quote.fileName}`} src={link.data.url} className="pdf-frame" />}
      {openable && <p className="small muted">This link is private to your account and expires after {link.data.expiresInMinutes} minutes.</p>}
      {link.data && !openable && <ErrorNotice error="This API keeps PDFs in memory (local development), so there is no file to open. On Azure the PDF opens from Blob Storage." />}
    </div>
  );
}

export default function QuoteDetail() {
  const { id } = useParams();
  const { api, session } = useSession();
  const [params, setParams] = useSearchParams();
  const view = VIEWS.some(([v]) => v === params.get('view')) ? params.get('view') : 'data';
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saved, setSaved] = useState(false);
  const { data, error, loading, reload } = useLoad(async () => {
    const quotes = await api.listQuotes();
    const quote = quotes.find((q) => q.id === id);
    if (!quote) {
      const missing = new Error('Quote not found');
      missing.status = 404;
      throw missing;
    }
    const comparison = await api.getComparison(quote.comparisonId);
    return { quote, comparison };
  }, [api, id]);

  useEffect(() => { setEditing(false); setSaved(false); setSaveError(null); }, [id]);

  if (loading && !data) return <AppLayout crumbs={[['My Quotes', '/quotes']]} width={1240}><Loading /></AppLayout>;
  if (!data) return <AppLayout crumbs={[['My Quotes', '/quotes']]} width={1240}><ErrorNotice error={error} onRetry={reload} /></AppLayout>;

  const { quote: q, comparison: c } = data;
  const backTo = c.status === 'ready' ? `/comparisons/${c.id}` : `/comparisons/${c.id}/review`;
  const status = quoteStatus(q);
  const services = SERVICES.map(([key, label]) => ({ key, label, item: q.services?.[key], view: serviceView(q.services?.[key]) }));
  const included = services.filter((s) => s.view.kind === 'included');
  const offTotal = services.filter((s) => s.view.kind === 'extra' || s.view.kind === 'excluded');
  const missing = services.filter((s) => s.view.kind === 'ns');
  const extras = services.filter((s) => s.view.kind === 'extra');
  const ppsf = perSqFt(q.totalPrice, q.squareFootage);
  const subtitle = [[q.materialType, q.color].filter(Boolean).join(', '), q.quoteNumber && `Quote ${q.quoteNumber}`, formatDate(q.quoteDate)].filter(Boolean).join(' · ');
  const record = { ...q };

  async function save(reviewed) {
    setSaving(true);
    setSaveError(null);
    try {
      await api.confirmQuote(q.id, reviewed);
      setEditing(false);
      setSaved(true);
      reload();
    } catch (e) {
      setSaveError(e);
    } finally {
      setSaving(false);
    }
  }

  const fields = [
    ['Material type', q.materialType],
    ['Material / color', q.color],
    ['Edge profile', q.edgeProfile],
    ['Quote number', q.quoteNumber],
    ['Quote date', formatDate(q.quoteDate)],
    ['Other line items', q.otherItems],
  ];

  return (
    <AppLayout crumbs={[['My Comparisons', '/comparisons'], [c.title, backTo], [q.contractor.name || q.fileName]]} width={1240}>
      <Link to={backTo} className="btn-link" style={{ alignSelf: 'flex-start', fontSize: 14 }}><Icon name="chevronLeft" size={16} />Back to {c.status === 'ready' ? 'comparison' : 'review'}</Link>
      <div className="row between" style={{ alignItems: 'flex-start', gap: 16 }}>
        <div className="stack" style={{ gap: 4 }}>
          <h1 className="page-title">{q.contractor.name || 'Contractor not specified'}</h1>
          <span style={{ fontSize: 15, color: 'var(--slate-600)' }}>{subtitle || q.fileName}</span>
          <span><Pill tone={status.tone}>{status.label}</Pill></span>
        </div>
        <div className="stack" style={{ alignItems: 'flex-end', gap: 2 }}>
          <span className="small muted">Stated total</span>
          <span style={{ fontSize: 30, fontWeight: 700 }}>{q.totalPrice != null ? money(q.totalPrice) : 'Not Specified'}</span>
        </div>
      </div>

      <div className="row between" style={{ gap: 12 }}>
        <nav aria-label="Choose quote" className="toggle-group">
          {c.quotes.map((other) => (
            <Link key={other.id} to={`/quotes/${other.id}${view !== 'data' ? `?view=${view}` : ''}`} className={`chip${other.id === q.id ? ' on' : ''}`} aria-current={other.id === q.id ? 'page' : undefined}>
              {other.contractor.name || other.fileName}
            </Link>
          ))}
        </nav>
        <div role="tablist" aria-label="View" className="segmented">
          {VIEWS.map(([v, label]) => (
            <button key={v} type="button" role="tab" aria-selected={view === v} onClick={() => setParams(v === 'data' ? {} : { view: v }, { replace: true })}>{label}</button>
          ))}
        </div>
      </div>

      {q.extractionSource === 'mock' && q.status !== 'confirmed' && <MockExtractionNotice />}

      <div className="row" style={{ gap: 20, alignItems: 'flex-start' }}>
        {view !== 'pdf' && (
          <div className="stack" style={{ flex: '1 1 460px', minWidth: 0, gap: 16 }}>
            <section className="card grid-auto" style={{ padding: 20, '--min': '180px', gap: 14 }}>
              <div className="stack" style={{ gap: 2 }}><span className="small muted" style={{ fontSize: 12 }}>Contact</span><span className="strong" style={{ fontSize: 14 }}><Value>{q.contractor.contactName}</Value></span></div>
              <div className="stack" style={{ gap: 2 }}><span className="small muted" style={{ fontSize: 12 }}>Phone</span><span className="strong" style={{ fontSize: 14 }}><Value>{q.contractor.phone}</Value></span></div>
              <div className="stack" style={{ gap: 2, minWidth: 0 }}><span className="small muted" style={{ fontSize: 12 }}>Email</span><span className="strong" style={{ fontSize: 14, overflowWrap: 'anywhere' }}><Value>{q.contractor.email}</Value></span></div>
              <div className="stack" style={{ gap: 2 }}><span className="small muted" style={{ fontSize: 12 }}>Square footage</span><span className="strong" style={{ fontSize: 14 }}>{q.squareFootage ? <>{sqftLabel(q.squareFootage)}{ppsf && <> · {ppsf}/sq ft <span className="tag tag-calc">CALC</span></>}</> : <Value />}</span></div>
            </section>

            <section className="card" style={{ overflow: 'hidden' }}>
              <h2 style={{ padding: '16px 20px', fontSize: 16, borderBottom: '1px solid var(--slate-200)' }}>Pricing breakdown</h2>
              <table className="data">
                <tbody>
                  {q.lineItems.length === 0 && <tr><td colSpan={2} className="muted">The quote lists no line items.</td></tr>}
                  {q.lineItems.map((l, i) => (
                    <tr key={l.description + i}><td>{l.description}</td><td className="num strong">{l.price != null ? money(l.price) : 'Included'}</td></tr>
                  ))}
                  <tr style={{ background: 'var(--slate-50)' }}><th scope="row" style={{ background: 'transparent', color: 'var(--ink)' }}>Stated total</th><td className="num" style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>{q.totalPrice != null ? money(q.totalPrice) : 'Not Specified'}</td></tr>
                </tbody>
              </table>
              {extras.length > 0 && (
                <div className="stack" style={{ padding: '14px 20px', borderTop: '1px solid var(--red-200)', background: 'var(--red-50)', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#991B1B' }}>Charged on top of the stated total</span>
                  {extras.map((x) => (
                    <span key={x.key} className="row between" style={{ fontSize: 14, color: '#7F1D1D' }}><span>{x.label}</span><span style={{ fontWeight: 700 }}>{x.item.amount != null ? `+${money(x.item.amount)}` : 'Amount not stated'}</span></span>
                  ))}
                </div>
              )}
            </section>

            <section className="grid-auto" style={{ '--min': '200px', gap: 12 }}>
              <div className="card stack" style={{ padding: 16, gap: 10 }}>
                <h3 className="row" style={{ fontSize: 14, gap: 6, color: 'var(--green)' }}><Icon name="check" size={16} stroke={2.6} />Included</h3>
                {included.length ? included.map((s) => <span key={s.key} style={{ fontSize: 14 }}>{s.label}{s.view.text !== 'Included' ? `: ${s.view.text.replace(/^Included \((.*)\)$/, '$1')}` : ''}</span>) : <span className="small muted">None listed</span>}
              </div>
              <div className="card stack" style={{ padding: 16, gap: 10 }}>
                <h3 className="row" style={{ fontSize: 14, gap: 6, color: 'var(--red)' }}><Icon name="plus" size={16} stroke={2.6} />Not included / extra</h3>
                {offTotal.length ? offTotal.map((s) => <span key={s.key} style={{ fontSize: 14 }}>{s.label} ({s.view.text.replace(/^\+/, '')})</span>) : <span className="small muted">None listed</span>}
              </div>
              <div className="card stack" style={{ padding: 16, gap: 10 }}>
                <h3 className="row" style={{ fontSize: 14, gap: 6, color: 'var(--slate-600)' }}><Icon name="question" size={16} stroke={2.6} />Not Specified</h3>
                {missing.length ? missing.map((s) => <span key={s.key} style={{ fontSize: 14 }}>{s.label}</span>) : <span className="small muted">Nothing missing</span>}
              </div>
            </section>

            <section className="card" style={{ overflow: 'hidden', borderColor: editing ? 'var(--blue)' : undefined }}>
              <div className="card-head" style={{ padding: '14px 20px' }}>
                <h2 style={{ fontSize: 16 }}>Extracted fields</h2>
                {!editing && <button type="button" className="btn btn-sm btn-secondary" onClick={() => { setEditing(true); setSaved(false); }}><Icon name="pencil" />Edit details</button>}
                {saved && !editing && <span role="status" className="small" style={{ fontWeight: 600, color: 'var(--green)' }}>Saved and confirmed</span>}
              </div>
              {editing ? (
                <div style={{ padding: '16px 20px' }}>
                  <ErrorNotice error={saveError} />
                  <QuoteForm quote={q} idPrefix="qd" saving={saving} onSave={save} onCancel={() => { setEditing(false); setSaveError(null); }} />
                </div>
              ) : (
                <>
                  <dl className="grid-auto" style={{ margin: 0, padding: '4px 20px 12px', '--min': '240px', columnGap: 24, rowGap: 0 }}>
                    {fields.map(([label, value]) => <div key={label} className="dl-row"><dt>{label}</dt><dd><Value>{value}</Value></dd></div>)}
                    {services.map((s) => <div key={s.key} className="dl-row"><dt>{s.label}</dt><dd><ServiceTag item={s.item} /></dd></div>)}
                  </dl>
                  <div className="stack" style={{ padding: '0 20px 16px', gap: 4 }}>
                    <span className="small muted">Notes / Exclusions</span>
                    {q.notes ? <span style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--slate-700)' }}>{q.notes}</span> : <Value />}
                  </div>
                </>
              )}
            </section>

            <details className="card" style={{ padding: '16px 20px' }}>
              <summary style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--slate-600)' }}>
                {session.mode === 'demo' ? 'Stored record (demo, saved in this browser)' : 'Stored record (Cosmos DB, quotes container)'}
              </summary>
              <pre className="record">{JSON.stringify(record, null, 2)}</pre>
            </details>
          </div>
        )}
        {view !== 'data' && <PdfPane quote={q} />}
      </div>
    </AppLayout>
  );
}
