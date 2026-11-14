import { Link, useParams } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout.jsx';
import { ErrorNotice, Loading, MockExtractionNotice, Pill } from '../components/ui.jsx';
import { Icon } from '../icons.jsx';
import { plural } from '../format.js';
import { useSession } from '../session.jsx';
import { useUploadJob } from '../uploads.js';
import { useLoad } from '../useLoad.js';
import { Progress } from './NewComparison.jsx';

const FILE_STATUS = {
  queued: ['Queued', 'grey'],
  uploading: ['Uploading and reading', 'blue'],
  reading: ['Reading', 'blue'],
  details_ready: ['Details ready', 'green'],
  confirmed: ['Confirmed', 'green'],
  failed: ['Could not add', 'red'],
};

function StepRow({ state, label, detail }) {
  const done = state === 'done';
  const current = state === 'current';
  return (
    <li className="row" style={{ gap: 14, padding: '12px 14px', borderRadius: 10, background: current ? 'var(--blue-50)' : 'transparent', flexWrap: 'nowrap' }}>
      {done && <span className="step-dot" style={{ background: 'var(--green)', color: '#fff' }}><Icon name="check" size={16} stroke={3} /></span>}
      {current && <span className="step-dot" style={{ background: 'var(--blue-50)', color: 'var(--blue-dark)' }}><Icon name="spinner" size={18} stroke={2.5} className="spin" /></span>}
      {!done && !current && <span className="step-dot" style={{ border: '2px solid var(--slate-300)' }} />}
      <span className="stack" style={{ gap: 2, flex: 1 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: done || current ? 'var(--ink)' : 'var(--slate-500)' }}>{label}</span>
        <span className="small muted">{detail}</span>
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: done ? 'var(--green)' : current ? 'var(--blue-dark)' : 'var(--slate-500)' }}>{done ? 'Done' : current ? 'In progress' : 'Waiting'}</span>
    </li>
  );
}

export default function Processing() {
  const { id } = useParams();
  const { api } = useSession();
  const job = useUploadJob(id);
  // Reload from the API whenever the job advances, so the page also works after a refresh.
  const progressKey = job ? job.files.map((f) => f.status).join() + job.done : 'none';
  const comparison = useLoad(() => api.getComparison(id), [api, id, progressKey]);

  if (comparison.loading && !comparison.data) return <AppLayout crumbs={[['My Comparisons', '/comparisons']]} width={880}><Loading /></AppLayout>;
  if (comparison.error && !comparison.data) {
    return <AppLayout crumbs={[['My Comparisons', '/comparisons']]} width={880}><ErrorNotice error={comparison.error} onRetry={comparison.reload} /></AppLayout>;
  }

  const c = comparison.data;
  // Files this tab is uploading, plus quotes that were already saved before it.
  const saved = c.quotes.map((q) => ({ key: q.id, name: q.fileName, status: q.status, error: '', extractionSource: q.extractionSource }));
  const pending = job ? job.files.filter((f) => f.status === 'queued' || f.status === 'uploading' || f.status === 'failed') : [];
  const rows = saved.concat(pending.map((f, i) => ({ key: `job-${i}`, ...f })));
  const working = rows.filter((r) => r.status === 'queued' || r.status === 'uploading').length;
  const failed = rows.filter((r) => r.status === 'failed');
  const ready = rows.filter((r) => r.status === 'details_ready' || r.status === 'confirmed').length;
  const total = rows.length;
  const finished = working === 0;
  const pct = total ? Math.round(((total - working) / total) * 100) : 0;
  const enough = ready >= 2;
  const mock = rows.some((r) => r.extractionSource === 'mock');

  return (
    <AppLayout crumbs={[['My Comparisons', '/comparisons'], [c.title]]} width={880}>
      <Progress current={1} />
      <div className="stack" style={{ gap: 6 }}>
        <span className="eyebrow">Step 2 of 4</span>
        <h1 className="page-title">{finished ? 'Your quotes are ready' : 'Processing your quotes'}</h1>
        <p className="lead">{c.title} · {plural(total, 'quote')}</p>
      </div>

      <section className="card card-pad stack" style={{ gap: 20 }}>
        <div className="stack" style={{ gap: 8 }}>
          <div className="row between" style={{ fontSize: 14 }}><span style={{ fontWeight: 600 }}>Overall progress</span><span className="muted">{pct}%</span></div>
          <div className="bar" role="progressbar" aria-label="Overall processing progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><div style={{ width: `${pct}%` }} /></div>
        </div>
        <ol aria-live="polite" className="stack" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 4 }}>
          <StepRow state={finished ? 'done' : 'current'} label="Uploading documents" detail={`Saving each PDF to storage (${total - working} of ${total} done)`} />
          <StepRow state={finished ? 'done' : 'current'} label="Reading each quote" detail="Totals, square footage, material, color, and services" />
          <StepRow state={finished ? (enough ? 'done' : 'pending') : 'pending'} label="Ready for review" detail="Waiting for you to confirm the details" />
        </ol>
      </section>

      <section className="card" style={{ overflow: 'hidden' }}>
        <h2 style={{ padding: '16px 20px', fontSize: 16, borderBottom: '1px solid var(--slate-200)' }}>Files</h2>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {rows.map((r) => {
            const [label, tone] = FILE_STATUS[r.status] || [r.status, 'grey'];
            return (
              <li key={r.key} className="row" style={{ gap: 14, padding: '14px 20px', borderTop: '1px solid var(--slate-100)', flexWrap: 'nowrap' }}>
                <span className="pdf-badge" style={{ width: 36, height: 36, fontSize: 10 }}>PDF</span>
                <span className="stack" style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                  {r.error && <span className="small" style={{ color: 'var(--red)' }}>{r.error}</span>}
                </span>
                <Pill tone={tone}>{label}</Pill>
              </li>
            );
          })}
        </ul>
      </section>

      {mock && <MockExtractionNotice />}

      {finished && failed.length > 0 && (
        <div className="notice notice-error" role="alert">
          <Icon name="alert" />
          <span>{plural(failed.length, 'file')} could not be added. {enough ? 'You can still review the others.' : 'A comparison needs at least 2 quotes.'} <Link to={`/comparisons/new?to=${id}`}>Add more files</Link></span>
        </div>
      )}

      {finished && enough && (
        <section role="status" className="row between" style={{ gap: 16, padding: '20px 24px', borderRadius: 14, background: 'var(--green-50)', border: '1px solid var(--green-200)' }}>
          <div className="row" style={{ gap: 12, flexWrap: 'nowrap' }}>
            <Icon name="checkCircle" size={24} style={{ color: 'var(--green)', flex: 'none' }} />
            <span className="stack" style={{ gap: 2 }}><span style={{ fontSize: 16, fontWeight: 700, color: '#14532D' }}>Ready for review</span><span style={{ fontSize: 14, color: '#166534' }}>Check the extracted details before you compare.</span></span>
          </div>
          <Link to={`/comparisons/${id}/review`} className="btn btn-lg btn-primary">Review extracted details<Icon name="arrowRight" /></Link>
        </section>
      )}
      {finished && !enough && failed.length === 0 && (
        <div className="notice notice-plain">
          <Icon name="info" />
          <span>This comparison has {plural(ready, 'quote')}. <Link to={`/comparisons/new?to=${id}`}>Add at least {2 - ready} more</Link> to compare.</span>
        </div>
      )}
    </AppLayout>
  );
}
