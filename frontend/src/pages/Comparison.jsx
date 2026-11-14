import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout.jsx';
import { Calc, ErrorNotice, Loading, PageHeader, ServiceTag, Tag, Value } from '../components/ui.jsx';
import { Icon } from '../icons.jsx';
import { SERVICES, formatDate, money, plural, serviceView, sqftLabel } from '../format.js';
import { useSession } from '../session.jsx';
import { useLoad } from '../useLoad.js';
import { Progress } from './NewComparison.jsx';

const FLAG_ICON = {
  extra: ['plus', 'tag-extra'],
  excluded: ['minus', 'tag-excluded'],
  missing: ['question', 'tag-ns'],
  info: ['infoBare', 'tag-calc'],
};

const norm = (v) => String(v ?? '').trim().toLowerCase();

export default function Comparison() {
  const { id } = useParams();
  const { api } = useSession();
  const [highlight, setHighlight] = useState(false);
  const { data, error, loading, reload } = useLoad(() => Promise.all([api.getComparison(id), api.listComparisons()]), [api, id]);

  if (loading && !data) return <AppLayout crumbs={[['My Comparisons', '/comparisons']]} width={1240}><Loading /></AppLayout>;
  if (!data) return <AppLayout crumbs={[['My Comparisons', '/comparisons']]} width={1240}><ErrorNotice error={error} onRetry={reload} /></AppLayout>;

  const [c, all] = data;
  const crumbs = [['My Comparisons', '/comparisons'], [c.title]];
  if (!c.results) {
    return (
      <AppLayout crumbs={crumbs} width={1240}>
        <PageHeader eyebrow="Comparison results" title={c.title} />
        <div className="notice notice-info">
          <Icon name="info" />
          <span>This comparison isn't built yet, or a quote changed since it was. <Link to={`/comparisons/${id}/review`}>Review and confirm the quotes</Link>, then generate it again.</span>
        </div>
      </AppLayout>
    );
  }

  const r = c.results;
  const byId = Object.fromEntries(c.quotes.map((q) => [q.id, q]));
  const summaries = r.quotes;
  const quotes = summaries.map((s) => byId[s.quoteId]).filter(Boolean);
  const lowestStated = summaries.filter((s) => r.lowestStatedQuoteIds.includes(s.quoteId));
  const totals = summaries.map((s) => s.statedTotal);
  const highest = summaries.find((s) => s.statedTotal === Math.max(...totals));
  const lowest = lowestStated[0];
  const tabs = all.filter((x) => x.status === 'ready');

  const rowDefs = [
    { label: 'Material', get: (q) => q.materialType },
    { label: 'Color', get: (q) => q.color },
    { label: 'Total Price', get: (q) => money(q.totalPrice), total: true },
    { label: 'Square Footage', get: (q) => sqftLabel(q.squareFootage) },
    { label: 'Price per Sq Ft', get: (q, s) => (s.pricePerSqFt != null ? money(s.pricePerSqFt) : ''), calc: true },
    { label: 'With Extras per Sq Ft', get: (q, s) => (s.effectivePricePerSqFt != null ? money(s.effectivePricePerSqFt) : ''), calc: true },
    ...SERVICES.map(([key, label]) => ({ label, service: key, get: (q) => serviceView(q.services?.[key]).text })),
    { label: 'Edge Profile', get: (q) => q.edgeProfile },
    { label: 'Other Charges', get: (q) => q.otherItems },
    { label: 'Notes', get: (q) => q.notes },
  ];

  return (
    <AppLayout crumbs={crumbs} width={1240}>
      <Progress current={3} />
      <PageHeader eyebrow="Comparison results" title={c.title} lead={`${plural(quotes.length, 'quote')} · created ${formatDate(c.createdAt)}`}>
        <Link to={`/comparisons/${id}/review`} className="btn btn-secondary"><Icon name="pencil" />Edit extracted details</Link>
      </PageHeader>

      {tabs.length > 1 && (
        <nav aria-label="Switch comparison" className="toggle-group">
          {tabs.map((t) => (
            <Link key={t.id} to={`/comparisons/${t.id}`} className={`chip${t.id === id ? ' on' : ''}`} aria-current={t.id === id ? 'page' : undefined} style={{ minHeight: 44, fontSize: 14, padding: '0 16px' }}>{t.title}</Link>
          ))}
        </nav>
      )}

      <div className="grid-auto" style={{ '--min': '240px' }}>
        <section className="card stack" style={{ padding: 20, gap: 8 }}>
          <div className="row between" style={{ gap: 8 }}><h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--slate-600)' }}>Lowest Quoted Price</h2><span className="tag tag-ns" style={{ fontSize: 11 }}>FROM ESTIMATES</span></div>
          <span style={{ fontSize: 30, fontWeight: 700, color: 'var(--navy)' }}>{money(lowest.statedTotal)}</span>
          <span style={{ fontSize: 14, color: 'var(--slate-700)' }}>{lowestStated.map((s) => s.contractor).join(', ')}, stated total</span>
        </section>
        <section className="card stack" style={{ padding: 20, gap: 8 }}>
          <div className="row between" style={{ gap: 8 }}><h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--slate-600)' }}>Price Difference</h2><Calc /></div>
          <span style={{ fontSize: 30, fontWeight: 700, color: 'var(--navy)' }}>{money(r.priceDifference)}</span>
          <span style={{ fontSize: 14, color: 'var(--slate-700)' }}>{r.priceDifference ? `Between ${highest.contractor} (${money(highest.statedTotal)}) and ${lowest.contractor} (${money(lowest.statedTotal)})` : 'Every quote states the same total'}</span>
        </section>
        <section className="card stack" style={{ padding: 20, gap: 10 }}>
          <div className="row between" style={{ gap: 8 }}><h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--slate-600)' }}>Total with listed extras</h2><Calc /></div>
          <ul className="stack" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 6 }}>
            {summaries.map((s) => (
              <li key={s.quoteId} className="row between" style={{ gap: 8, fontSize: 14 }}>
                <span style={{ color: 'var(--slate-700)' }}>{s.contractor}{r.lowestKnownCostQuoteIds.includes(s.quoteId) && <span className="sr-only"> (lowest with extras)</span>}</span>
                <span style={{ fontWeight: 600 }}>
                  {money(s.knownCost)}
                  {s.knownExtras > 0 && <span style={{ fontWeight: 500, color: 'var(--red)' }}> (incl. +{money(s.knownExtras)})</span>}
                  {s.hasUnpricedExtras && <span style={{ fontWeight: 500, color: 'var(--red)' }}> + unpriced extra</span>}
                </span>
              </li>
            ))}
          </ul>
          <span style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--slate-500)' }}>Adds only the extra charges each quote lists. Doesn't adjust for different square footage or items marked Not Specified.</span>
        </section>
      </div>

      <div className="row" style={{ gap: 16, alignItems: 'stretch' }}>
        <section className="card stack" style={{ flex: '1 1 380px', minWidth: 0, padding: 20, gap: 12 }}>
          <h2 style={{ fontSize: 17 }}>Important Differences</h2>
          {r.flags.length === 0 && <p className="small muted">No differences flagged.</p>}
          <ul className="stack" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 10 }}>
            {r.flags.map((f) => {
              const [icon, cls] = FLAG_ICON[f.kind] || FLAG_ICON.info;
              return (
                <li key={f.text} className="row" style={{ gap: 10, alignItems: 'flex-start', flexWrap: 'nowrap', fontSize: 14, lineHeight: 1.5, color: 'var(--slate-800)' }}>
                  <span className={`tag ${cls}`} style={{ flex: 'none', width: 22, height: 22, padding: 0, justifyContent: 'center' }}><Icon name={icon} size={14} stroke={2.6} /></span>
                  <span>{f.text}</span>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="card stack" style={{ flex: '1 1 380px', minWidth: 0, padding: 20, gap: 12 }}>
          <div className="row between" style={{ gap: 8 }}><h2 style={{ fontSize: 17 }}>Comparison Notes</h2><span className="tag tag-calc">INTERPRETATION</span></div>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--slate-800)' }}>{r.summary}</p>
          <p style={{ paddingTop: 12, borderTop: '1px solid var(--slate-100)', fontSize: 13, lineHeight: 1.5, color: 'var(--slate-500)' }}>QuoteLens doesn't pick a winner. Price is one factor; material, warranty, reviews, and schedule matter too.</p>
        </section>
      </div>

      <section className="card" style={{ overflow: 'hidden' }}>
        <div className="card-head">
          <h2>Side-by-side</h2>
          <div className="row" style={{ gap: 14 }}>
            <div className="row small" style={{ gap: 12, color: 'var(--slate-700)', fontSize: 12 }}>
              <span className="row" style={{ gap: 4 }}><span className="swatch" style={{ background: 'var(--green)' }} />Included</span>
              <span className="row" style={{ gap: 4 }}><span className="swatch" style={{ background: 'var(--red)' }} />Extra charge</span>
              <span className="row" style={{ gap: 4 }}><span className="swatch" style={{ background: '#EA580C' }} />Not included</span>
              <span className="row" style={{ gap: 4 }}><span className="swatch" style={{ background: 'var(--slate-400)' }} />Not Specified</span>
            </div>
            <button type="button" role="switch" aria-checked={highlight} onClick={() => setHighlight((h) => !h)} className={`switch${highlight ? ' on' : ''}`}>
              <span aria-hidden="true" className="switch-track"><span /></span>
              Highlight differences
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="compare" style={{ minWidth: 240 + quotes.length * 200 }}>
            <thead>
              <tr>
                <th scope="col" className="compare-corner">Contractor</th>
                {quotes.map((q) => (
                  <th scope="col" key={q.id}>
                    <span className="stack" style={{ gap: 8 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>{q.contractor.name}</span>
                      <Link to={`/quotes/${q.id}`} className="btn-link" style={{ fontSize: 13, padding: '6px 0' }}>View Quote Details<Icon name="chevronRight" size={14} /></Link>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowDefs.map((row) => {
                const values = quotes.map((q, i) => row.get(q, summaries[i]));
                const differs = new Set(values.map(norm)).size > 1;
                const show = highlight && differs;
                return (
                  <tr key={row.label} className={show ? 'differs' : ''}>
                    <th scope="row">
                      <span className="stack" style={{ gap: 4 }}>
                        <span>{row.label}</span>
                        {show && <span className="tag tag-calc" style={{ alignSelf: 'flex-start', background: 'var(--blue-100)', color: '#1E3A8A' }}><Icon name="differs" size={12} />Differs</span>}
                        {row.calc && <span style={{ alignSelf: 'flex-start' }}><Calc /></span>}
                      </span>
                    </th>
                    {quotes.map((q, i) => (
                      <td key={q.id}>
                        {row.service ? <ServiceTag item={q.services?.[row.service]} /> : (
                          <span style={{ fontWeight: row.total ? 700 : 500 }}><Value>{values[i]}</Value></span>
                        )}
                        {row.total && r.lowestStatedQuoteIds.includes(q.id) && r.priceDifference > 0 && <Tag kind="calc">Lowest stated</Tag>}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <p className="small muted">Values come from the quote details you confirmed. Rows tagged Calculated are worked out by QuoteLens.</p>
    </AppLayout>
  );
}
