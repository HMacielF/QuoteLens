import { Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout.jsx';
import { ErrorNotice, Loading, PageHeader, Pill } from '../components/ui.jsx';
import { Icon } from '../icons.jsx';
import { comparisonHref, comparisonStatus, formatDate, plural } from '../format.js';
import { useSession } from '../session.jsx';
import { useLoad } from '../useLoad.js';

function StatCard({ to, label, icon, iconColor, value, sub }) {
  return (
    <Link to={to} className="card stack stat-card" style={{ padding: 22, gap: 10, textDecoration: 'none', color: 'var(--ink)' }}>
      <span className="row between"><span style={{ fontSize: 14, fontWeight: 600, color: 'var(--slate-600)' }}>{label}</span><Icon name={icon} size={20} style={{ color: iconColor }} /></span>
      <span style={{ fontSize: 34, fontWeight: 700, color: 'var(--navy)' }}>{value}</span>
      <span className="small muted">{sub}</span>
    </Link>
  );
}

// "Needs a look" items come from the account's own data: quotes not yet checked, and the
// extra-charge or exclusion flags of built comparisons.
function attentionItems(comparisons, quotes) {
  const items = [];
  for (const c of comparisons) {
    const waiting = quotes.filter((q) => q.comparisonId === c.id && q.status === 'details_ready').length;
    if (waiting) {
      items.push({ to: `/comparisons/${c.id}/review`, tone: 'plain', title: c.title, text: `${plural(waiting, 'quote')} still ${waiting === 1 ? 'needs' : 'need'} your check before you can compare.` });
      continue;
    }
    const flag = c.results?.flags.find((f) => f.kind === 'extra' || f.kind === 'excluded');
    if (flag) items.push({ to: `/comparisons/${c.id}`, tone: 'alert', title: c.title, text: flag.text });
  }
  return items.slice(0, 4);
}

export default function Dashboard() {
  const { api, session } = useSession();
  const { data, error, loading, reload } = useLoad(() => Promise.all([api.listComparisons(), api.listQuotes()]), [api]);
  const [comparisons, quotes] = data || [[], []];
  const inProgress = comparisons.filter((c) => c.status !== 'ready');
  const compared = comparisons.filter((c) => c.status === 'ready');
  const projects = new Set(quotes.map((q) => q.comparisonId)).size;
  const names = (list) => list.slice(0, 2).map((c) => c.title).join(', ') + (list.length > 2 ? ` and ${list.length - 2} more` : '');
  const attention = attentionItems(comparisons, quotes);
  const firstName = session.name === 'Demo User' ? '' : (session.name || '').split(' ')[0];

  return (
    <AppLayout crumbs={[['Dashboard']]}>
      <PageHeader title={`Welcome back${firstName ? `, ${firstName}` : ''}`} lead="Manage your countertop quotes and compare your options.">
        <Link to="/comparisons/new" className="btn btn-primary btn-lg"><Icon name="plus" stroke={2.2} />New Comparison</Link>
      </PageHeader>
      <ErrorNotice error={error} onRetry={reload} />
      {loading && !data ? <Loading /> : (
        <>
          <div className="grid-auto" style={{ '--min': '220px' }}>
            <StatCard to="/quotes" label="Total Quotes" icon="file" iconColor="var(--blue)" value={quotes.length} sub={quotes.length ? `Across ${plural(projects, 'project')}` : 'None uploaded yet'} />
            <StatCard to="/comparisons" label="In Progress" icon="spinner" iconColor="var(--blue)" value={inProgress.length} sub={inProgress.length ? names(inProgress) : 'Nothing waiting'} />
            <StatCard to="/comparisons" label="Compared" icon="checkCircle" iconColor="var(--green)" value={compared.length} sub={compared.length ? names(compared) : 'No comparisons built yet'} />
          </div>

          {comparisons.length === 0 ? (
            <section className="card empty">
              <Icon name="columns" size={28} style={{ color: 'var(--blue)' }} />
              <h2 style={{ fontSize: 18 }}>Start your first comparison</h2>
              <p className="muted" style={{ maxWidth: 440 }}>Name your project and upload 2 to 5 contractor quotes as PDFs. No quotes handy? Add the three sample quotes on the next screen.</p>
              <Link to="/comparisons/new" className="btn btn-primary">New Comparison</Link>
            </section>
          ) : (
            <div className="row" style={{ gap: 20, alignItems: 'flex-start' }}>
              <section className="card" style={{ flex: '999 1 560px', minWidth: 0, overflow: 'hidden' }}>
                <div className="card-head">
                  <h2>Recent Comparisons</h2>
                  <Link to="/comparisons" className="btn-link" style={{ fontSize: 14 }}>View all</Link>
                </div>
                <div className="table-wrap">
                  <table className="data" style={{ minWidth: 560 }}>
                    <thead>
                      <tr><th scope="col">Comparison</th><th scope="col">Quotes</th><th scope="col">Created</th><th scope="col">Status</th><th scope="col" className="num">Action</th></tr>
                    </thead>
                    <tbody>
                      {comparisons.slice(0, 5).map((c) => {
                        const status = comparisonStatus(c);
                        const contractors = quotes.filter((q) => q.comparisonId === c.id).map((q) => q.contractor.name).filter(Boolean);
                        return (
                          <tr key={c.id}>
                            <td><span className="stack" style={{ gap: 2 }}><span className="strong">{c.title}</span><span className="small muted">{contractors.join(', ') || 'No quotes yet'}</span></span></td>
                            <td>{plural(c.quoteIds.length, 'quote')}</td>
                            <td>{formatDate(c.createdAt)}</td>
                            <td><Pill tone={status.tone}>{status.label}</Pill></td>
                            <td className="num"><Link to={comparisonHref(c)} className="btn btn-sm btn-secondary">{c.status === 'ready' ? 'View Comparison' : 'Continue'}</Link></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
              <section className="card stack" style={{ flex: '1 1 300px', minWidth: 0, padding: 20, gap: 14 }}>
                <h2 style={{ fontSize: 18 }}>Needs a look</h2>
                {attention.length === 0 && <p className="small muted">Nothing needs your attention right now.</p>}
                {attention.map((item) => (
                  <Link key={item.to} to={item.to} className={`attention attention-${item.tone}`}>
                    <Icon name={item.tone === 'alert' ? 'alert' : 'file'} size={20} />
                    <span className="stack" style={{ gap: 2 }}><span style={{ fontSize: 14, fontWeight: 600 }}>{item.title}</span><span style={{ fontSize: 13, lineHeight: 1.45 }}>{item.text}</span></span>
                  </Link>
                ))}
              </section>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
