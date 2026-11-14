import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout.jsx';
import { QuoteForm, reviewedFields } from '../components/QuoteForm.jsx';
import { Calc, ErrorNotice, Legend, Loading, MockExtractionNotice, PageHeader, Pill, ServiceTag, Tag, Value } from '../components/ui.jsx';
import { Icon } from '../icons.jsx';
import { MAX_QUOTES_PER_COMPARISON } from '../api/demo.js';
import { SERVICES, formatDate, money, perSqFt, plural, quoteStatus, serviceView, sqftLabel } from '../format.js';
import { useSession } from '../session.jsx';
import { useLoad } from '../useLoad.js';
import { Progress } from './NewComparison.jsx';

function QuoteCard({ quote, onSaved }) {
  const { api } = useSession();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const status = quoteStatus(quote);
  const views = SERVICES.map(([key]) => serviceView(quote.services?.[key]));
  const missing = [quote.quoteDate, quote.materialType, quote.color, quote.squareFootage, quote.edgeProfile].filter((v) => v == null || v === '').length
    + views.filter((v) => v.kind === 'ns').length;
  const extras = views.filter((v) => v.kind === 'extra').length;
  const canConfirm = quote.status === 'details_ready';

  async function save(reviewed) {
    setSaving(true);
    setError(null);
    try {
      await api.confirmQuote(quote.id, reviewed);
      setEditing(false);
      onSaved();
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  }

  const rows = [
    ['Quote date', formatDate(quote.quoteDate)],
    ['Material type', quote.materialType],
    ['Material / color', quote.color],
    ['Total price', quote.totalPrice != null ? money(quote.totalPrice) : ''],
    ['Square footage', sqftLabel(quote.squareFootage)],
  ];

  return (
    <article className="card stack" style={{ overflow: 'hidden', borderColor: editing ? 'var(--blue)' : undefined }}>
      <div className="stack" style={{ padding: '18px 20px', borderBottom: '1px solid var(--slate-200)', gap: 10 }}>
        <div className="row between" style={{ alignItems: 'flex-start', gap: 12, flexWrap: 'nowrap' }}>
          <div className="stack" style={{ gap: 4, minWidth: 0 }}>
            <h2 style={{ fontSize: 18, color: 'var(--navy)' }}>{quote.contractor.name || 'Contractor not specified'}</h2>
            <Link to={`/quotes/${quote.id}?view=pdf`} className="row small" style={{ gap: 6, color: 'var(--slate-600)', textDecoration: 'none', flexWrap: 'nowrap', minWidth: 0 }}>
              <Icon name="file" size={14} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{quote.fileName}</span>
            </Link>
          </div>
          <span style={{ fontSize: 22, fontWeight: 700, whiteSpace: 'nowrap' }}>{quote.totalPrice != null ? money(quote.totalPrice) : 'Not Specified'}</span>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <Pill tone={status.tone}>{status.label}</Pill>
          {missing > 0 && <Tag kind="ns">{plural(missing, 'field')} not specified</Tag>}
          {extras > 0 && <Tag kind="extra">{plural(extras, 'extra charge')}</Tag>}
        </div>
      </div>

      {editing ? (
        <div style={{ padding: '16px 20px' }}>
          <ErrorNotice error={error} />
          <QuoteForm quote={quote} idPrefix={`rv-${quote.id}`} saving={saving} onSave={save} onCancel={() => { setEditing(false); setError(null); }} />
        </div>
      ) : (
        <>
          <dl style={{ margin: 0, padding: '6px 20px 12px' }}>
            {rows.map(([label, value]) => (
              <div key={label} className="dl-row"><dt>{label}</dt><dd><Value>{value}</Value></dd></div>
            ))}
            <div className="dl-row"><dt>Price per sq ft</dt><dd>{perSqFt(quote.totalPrice, quote.squareFootage) ? <span className="row" style={{ gap: 6, justifyContent: 'flex-end' }}>{perSqFt(quote.totalPrice, quote.squareFootage)}<Calc /></span> : <Tag kind="ns">Not Specified</Tag>}</dd></div>
            {SERVICES.map(([key, label]) => (
              <div key={key} className="dl-row"><dt>{label}</dt><dd><ServiceTag item={quote.services?.[key]} /></dd></div>
            ))}
            <div className="dl-row"><dt>Edge profile</dt><dd><Value>{quote.edgeProfile}</Value></dd></div>
            <div className="dl-row"><dt>Other line items</dt><dd><Value>{quote.otherItems}</Value></dd></div>
          </dl>
          <div className="stack" style={{ padding: '0 20px 18px', gap: 6 }}>
            <span className="small muted">Notes / Exclusions</span>
            {quote.notes ? <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--slate-700)' }}>{quote.notes}</p> : <Tag kind="ns">Not Specified</Tag>}
          </div>
          <ErrorNotice error={error} />
          <div className="row" style={{ padding: '14px 20px', borderTop: '1px solid var(--slate-200)', gap: 8, marginTop: 'auto' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditing(true)}><Icon name="pencil" />Edit details</button>
            {canConfirm
              ? <button type="button" className="btn btn-primary" style={{ flex: 1 }} disabled={saving} onClick={() => save(reviewedFields(quote))}><Icon name="check" />{saving ? 'Saving…' : 'Looks right'}</button>
              : <Link to={`/quotes/${quote.id}?view=split`} className="btn btn-secondary" style={{ flex: 1 }}>Compare to PDF</Link>}
          </div>
        </>
      )}
    </article>
  );
}

export default function Review() {
  const { id } = useParams();
  const { api } = useSession();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useLoad(() => api.getComparison(id), [api, id]);
  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState(null);

  if (loading && !data) return <AppLayout crumbs={[['My Comparisons', '/comparisons']]} width={1240}><Loading /></AppLayout>;
  if (!data) return <AppLayout crumbs={[['My Comparisons', '/comparisons']]} width={1240}><ErrorNotice error={error} onRetry={reload} /></AppLayout>;

  const quotes = data.quotes;
  const confirmed = quotes.filter((q) => q.status === 'confirmed').length;
  const toCheck = quotes.filter((q) => q.status === 'details_ready').length;
  const canBuild = quotes.length >= 2 && confirmed === quotes.length;
  const reason = quotes.length < 2
    ? 'A comparison needs at least 2 quotes.'
    : `Confirm ${plural(quotes.length - confirmed, 'more quote')} to compare.`;

  async function build() {
    setBuilding(true);
    setBuildError(null);
    try {
      await api.buildComparison(id);
      navigate(`/comparisons/${id}`);
    } catch (e) {
      setBuildError(e);
      setBuilding(false);
    }
  }

  const buildButton = (
    <button type="button" className="btn btn-lg btn-primary" disabled={!canBuild || building} onClick={build}>
      {building ? 'Generating…' : 'Generate comparison'}{!building && <Icon name="arrowRight" />}
    </button>
  );

  return (
    <AppLayout crumbs={[['My Comparisons', '/comparisons'], [data.title]]} width={1240}>
      <Progress current={2} />
      <PageHeader eyebrow="Step 3 of 4" title="Review extracted details" lead="PDF extraction can miss or misread things. Check each quote against the original, fix anything that's wrong, and confirm it before you compare.">
        {buildButton}
      </PageHeader>
      {quotes.some((q) => q.extractionSource === 'mock') && <MockExtractionNotice />}
      <Legend />
      <p className="small muted" role="status">{confirmed} of {plural(quotes.length, 'quote')} confirmed{toCheck ? `, ${toCheck} still to check` : ''}.</p>
      <div className="grid-auto" style={{ '--min': '320px', gap: 20, alignItems: 'start' }}>
        {quotes.map((q) => <QuoteCard key={q.id} quote={q} onSaved={reload} />)}
      </div>
      <ErrorNotice error={buildError} />
      <div className="card row between" style={{ padding: '20px 24px', gap: 16 }}>
        <p style={{ fontSize: 15, color: 'var(--slate-700)' }}>{canBuild ? 'Everything confirmed. You can still edit any quote later from its detail page.' : reason}</p>
        <div className="row" style={{ gap: 10 }}>
          {quotes.length < MAX_QUOTES_PER_COMPARISON && <Link to={`/comparisons/new?to=${id}`} className="btn btn-lg btn-secondary">Add files</Link>}
          {buildButton}
        </div>
      </div>
    </AppLayout>
  );
}
