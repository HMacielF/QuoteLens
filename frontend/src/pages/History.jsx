import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout.jsx';
import { ErrorNotice, Loading, PageHeader, Pill } from '../components/ui.jsx';
import { Icon } from '../icons.jsx';
import { comparisonHref, comparisonStatus, formatDate, plural } from '../format.js';
import { useSession } from '../session.jsx';
import { useLoad } from '../useLoad.js';

export default function History() {
  const { api } = useSession();
  const { data, error, loading, reload } = useLoad(() => Promise.all([api.listComparisons(), api.listQuotes()]), [api]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('new');
  const [comparisons, quotes] = data || [[], []];

  const items = comparisons.map((c) => ({
    ...c,
    contractors: quotes.filter((q) => q.comparisonId === c.id).map((q) => q.contractor.name).filter(Boolean).join(', '),
  }));
  const term = search.trim().toLowerCase();
  const rows = items
    .filter((c) => status === 'all' || c.status === status)
    .filter((c) => !term || c.title.toLowerCase().includes(term) || c.contractors.toLowerCase().includes(term))
    .sort((a, b) => (sort === 'name' ? a.title.localeCompare(b.title) : sort === 'old' ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)));

  return (
    <AppLayout crumbs={[['My Comparisons']]}>
      <PageHeader title="My Comparisons" lead="Every project you've compared, newest first.">
        <Link to="/comparisons/new" className="btn btn-lg btn-primary"><Icon name="plus" stroke={2.2} />New Comparison</Link>
      </PageHeader>
      <div className="card row" style={{ gap: 12, alignItems: 'flex-end', padding: 16 }}>
        <div className="field" style={{ flex: '1 1 260px', gap: 4 }}>
          <label htmlFor="h-search" style={{ fontSize: 13 }}>Search</label>
          <div className="search-wrap"><Icon name="search" /><input id="h-search" type="search" className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Project or contractor name" /></div>
        </div>
        <div className="field" style={{ flex: '0 1 180px', gap: 4 }}>
          <label htmlFor="h-status" style={{ fontSize: 13 }}>Status</label>
          <select id="h-status" className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="draft">In progress</option>
            <option value="ready">Compared</option>
          </select>
        </div>
        <div className="field" style={{ flex: '0 1 180px', gap: 4 }}>
          <label htmlFor="h-sort" style={{ fontSize: 13 }}>Sort by</label>
          <select id="h-sort" className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="new">Newest first</option>
            <option value="old">Oldest first</option>
            <option value="name">Name A to Z</option>
          </select>
        </div>
      </div>
      <ErrorNotice error={error} onRetry={reload} />
      {loading && !data ? <Loading /> : (
        <section className="card" style={{ overflow: 'hidden' }}>
          <div role="status" className="small muted" style={{ padding: '12px 20px', borderBottom: '1px solid var(--slate-200)' }}>{rows.length} of {plural(items.length, 'comparison')}</div>
          {rows.length > 0 ? (
            <div className="table-wrap">
              <table className="data" style={{ minWidth: 700 }}>
                <thead><tr><th scope="col">Comparison</th><th scope="col">Quotes</th><th scope="col">Created</th><th scope="col">Status</th><th scope="col" className="num">Action</th></tr></thead>
                <tbody>
                  {rows.map((c) => {
                    const s = comparisonStatus(c);
                    return (
                      <tr key={c.id}>
                        <td style={{ minWidth: 240 }}><span className="stack" style={{ gap: 2 }}><span className="strong">{c.title}</span><span className="small muted">{c.contractors || 'No quotes yet'}</span></span></td>
                        <td>{plural(c.quoteIds.length, 'quote')}</td>
                        <td>{formatDate(c.createdAt)}</td>
                        <td><Pill tone={s.tone}>{s.label}</Pill></td>
                        <td className="num"><Link to={comparisonHref(c)} className="btn btn-sm btn-secondary">{c.status === 'ready' ? 'View' : 'Continue'}<span className="sr-only"> {c.title}</span></Link></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">
              <Icon name="search" size={28} style={{ color: 'var(--slate-400)' }} />
              <span style={{ fontSize: 16, fontWeight: 600 }}>{items.length ? 'No comparisons match' : 'No comparisons yet'}</span>
              <span className="small muted" style={{ fontSize: 14 }}>{items.length ? 'Try a different search or status.' : 'Start one by uploading 2 to 5 contractor quotes.'}</span>
              {items.length
                ? <button type="button" className="btn btn-secondary" onClick={() => { setSearch(''); setStatus('all'); }}>Clear filters</button>
                : <Link to="/comparisons/new" className="btn btn-primary">New Comparison</Link>}
            </div>
          )}
        </section>
      )}
    </AppLayout>
  );
}
