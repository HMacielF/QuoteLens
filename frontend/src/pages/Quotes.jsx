import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout.jsx';
import { ErrorNotice, Loading, PageHeader, Pill, Value } from '../components/ui.jsx';
import { Icon } from '../icons.jsx';
import { formatDate, money, plural, quoteStatus } from '../format.js';
import { useSession } from '../session.jsx';
import { useLoad } from '../useLoad.js';

const dateOf = (q) => q.quoteDate || q.createdAt.slice(0, 10);

export default function Quotes() {
  const { api } = useSession();
  const { data, error, loading, reload } = useLoad(() => Promise.all([api.listQuotes(), api.listComparisons()]), [api]);
  const [search, setSearch] = useState('');
  const [project, setProject] = useState('all');
  const [sort, setSort] = useState('new');
  const [quotes, comparisons] = data || [[], []];
  const titles = Object.fromEntries(comparisons.map((c) => [c.id, c.title]));

  const term = search.trim().toLowerCase();
  const order = {
    new: (a, b) => dateOf(b).localeCompare(dateOf(a)),
    old: (a, b) => dateOf(a).localeCompare(dateOf(b)),
    low: (a, b) => (a.totalPrice ?? Infinity) - (b.totalPrice ?? Infinity),
    high: (a, b) => (b.totalPrice ?? -Infinity) - (a.totalPrice ?? -Infinity),
  }[sort];
  const rows = quotes
    .filter((q) => project === 'all' || q.comparisonId === project)
    .filter((q) => !term || [q.contractor.name, q.materialType, q.color, titles[q.comparisonId], q.fileName].join(' ').toLowerCase().includes(term))
    .sort(order);

  return (
    <AppLayout crumbs={[['My Quotes']]}>
      <PageHeader title="My Quotes" lead="Every contractor estimate you've uploaded, across all projects.">
        <Link to="/comparisons/new" className="btn btn-lg btn-primary"><Icon name="upload" />Upload quotes</Link>
      </PageHeader>
      <div className="card row" style={{ gap: 12, alignItems: 'flex-end', padding: 16 }}>
        <div className="field" style={{ flex: '1 1 260px', gap: 4 }}>
          <label htmlFor="q-search" style={{ fontSize: 13 }}>Search</label>
          <div className="search-wrap"><Icon name="search" /><input id="q-search" type="search" className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Contractor, material, or color" /></div>
        </div>
        <div className="field" style={{ flex: '0 1 200px', gap: 4 }}>
          <label htmlFor="q-proj" style={{ fontSize: 13 }}>Project</label>
          <select id="q-proj" className="select" value={project} onChange={(e) => setProject(e.target.value)}>
            <option value="all">All projects</option>
            {comparisons.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: '0 1 200px', gap: 4 }}>
          <label htmlFor="q-sort" style={{ fontSize: 13 }}>Sort by</label>
          <select id="q-sort" className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="new">Quote date, newest</option>
            <option value="old">Quote date, oldest</option>
            <option value="low">Total, low to high</option>
            <option value="high">Total, high to low</option>
          </select>
        </div>
      </div>
      <ErrorNotice error={error} onRetry={reload} />
      {loading && !data ? <Loading /> : (
        <section className="card" style={{ overflow: 'hidden' }}>
          <div role="status" className="small muted" style={{ padding: '12px 20px', borderBottom: '1px solid var(--slate-200)' }}>{rows.length} of {plural(quotes.length, 'quote')}</div>
          {rows.length > 0 ? (
            <div className="table-wrap">
              <table className="data" style={{ minWidth: 860 }}>
                <thead><tr><th scope="col">Contractor</th><th scope="col">Project</th><th scope="col">Material</th><th scope="col" className="num">Stated total</th><th scope="col">Quote date</th><th scope="col">Status</th><th scope="col" className="num">Action</th></tr></thead>
                <tbody>
                  {rows.map((q) => {
                    const s = quoteStatus(q);
                    return (
                      <tr key={q.id}>
                        <td><span className="stack" style={{ gap: 2 }}><span className="strong">{q.contractor.name || 'Not specified'}</span><span className="row small muted" style={{ gap: 4, fontSize: 12 }}><Icon name="file" size={12} />{q.fileName}</span></span></td>
                        <td>{titles[q.comparisonId]}</td>
                        <td><Value>{[q.materialType, q.color].filter(Boolean).join(', ')}</Value></td>
                        <td className="num strong">{q.totalPrice != null ? money(q.totalPrice) : <Value />}</td>
                        <td>{q.quoteDate ? formatDate(q.quoteDate) : <Value />}</td>
                        <td><Pill tone={s.tone}>{s.label}</Pill></td>
                        <td className="num"><Link to={`/quotes/${q.id}`} className="btn btn-sm btn-secondary">View details<span className="sr-only"> for {q.contractor.name || q.fileName}</span></Link></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">
              <span style={{ fontSize: 16, fontWeight: 600 }}>{quotes.length ? 'No quotes match' : 'No quotes yet'}</span>
              <span className="small muted" style={{ fontSize: 14 }}>{quotes.length ? 'Try a different search or project.' : 'Quotes you upload to a comparison show up here.'}</span>
              {quotes.length
                ? <button type="button" className="btn btn-secondary" onClick={() => { setSearch(''); setProject('all'); }}>Clear filters</button>
                : <Link to="/comparisons/new" className="btn btn-primary">Upload quotes</Link>}
            </div>
          )}
        </section>
      )}
    </AppLayout>
  );
}
