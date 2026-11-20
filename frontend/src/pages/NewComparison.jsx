import { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import architectureStones from '../../../samples/vanity-2025/architecture-stones-30781-leon.pdf?url';
import graniteWorks from '../../../samples/vanity-2025/graniteworks-email-leon.pdf?url';
import oldTown from '../../../samples/vanity-2025/oldtown-email-leon.pdf?url';
import { AppLayout } from '../components/AppLayout.jsx';
import { ErrorNotice, Loading } from '../components/ui.jsx';
import { MAX_PDF_BYTES, MAX_QUOTES_PER_COMPARISON, MIN_QUOTES_PER_COMPARISON } from '../api/demo.js';
import { Icon } from '../icons.jsx';
import { useSession } from '../session.jsx';
import { startUploads } from '../uploads.js';
import { useLoad } from '../useLoad.js';

// Real quotes for one bathroom vanity from three shops, redacted (see samples/vanity-2025/README.md).
const SAMPLE_FILES = [
  ['architecture-stones-30781-leon.pdf', architectureStones],
  ['graniteworks-email-leon.pdf', graniteWorks],
  ['oldtown-email-leon.pdf', oldTown],
];

const sizeLabel = (bytes) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);
const isPdf = (file) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');

const STEPS = ['Name and upload', 'Process', 'Review details', 'Compare'];

export function Progress({ current }) {
  return (
    <ol aria-label="Progress" className="progress-steps">
      {STEPS.map((label, i) => (
        <li key={label} className={i === current ? 'on' : i < current ? 'done' : ''} aria-current={i === current ? 'step' : undefined}>
          <span>{i < current ? <Icon name="check" size={13} stroke={3} /> : i + 1}</span>{label}
        </li>
      ))}
    </ol>
  );
}

export default function NewComparison() {
  const { api } = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const existingId = params.get('to');
  const existing = useLoad(() => (existingId ? api.getComparison(existingId) : Promise.resolve(null)), [api, existingId]);
  const [name, setName] = useState('');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState(null);
  const nextId = useRef(1);

  const already = existing.data?.quotes.length || 0;
  const room = MAX_QUOTES_PER_COMPARISON - already - files.length;

  function addFiles(list) {
    const incoming = Array.from(list || []);
    if (!incoming.length) return;
    const messages = [];
    const bad = incoming.filter((f) => !isPdf(f));
    if (bad.length) messages.push(`${bad.map((f) => f.name).join(', ')} ${bad.length > 1 ? "aren't PDFs" : "isn't a PDF"}. QuoteLens reads PDF estimates only.`);
    const big = incoming.filter((f) => isPdf(f) && f.size > MAX_PDF_BYTES);
    if (big.length) messages.push(`${big.map((f) => f.name).join(', ')} ${big.length > 1 ? 'are' : 'is'} larger than 20 MB.`);
    const good = incoming.filter((f) => isPdf(f) && f.size <= MAX_PDF_BYTES);
    if (good.length > room) messages.push(`A comparison holds up to ${MAX_QUOTES_PER_COMPARISON} quotes, so only ${Math.max(room, 0)} ${room === 1 ? 'was' : 'were'} added.`);
    const added = good.slice(0, Math.max(room, 0)).map((file) => ({ id: nextId.current++, file }));
    setFiles((current) => current.concat(added));
    setError(messages.join(' '));
  }

  async function addSamples() {
    try {
      const picked = await Promise.all(SAMPLE_FILES.map(async ([fileName, url]) => {
        const blob = await (await fetch(url)).blob();
        return new File([blob], fileName, { type: 'application/pdf' });
      }));
      addFiles(picked);
      if (!existingId && !name.trim()) setName('Bathroom Vanity');
    } catch {
      setError('Could not load the sample quotes. Try again, or upload your own PDFs.');
    }
  }

  function replace(id, list) {
    const file = list?.[0];
    if (!file) return;
    if (!isPdf(file)) { setError(`${file.name} isn't a PDF. QuoteLens reads PDF estimates only.`); return; }
    if (file.size > MAX_PDF_BYTES) { setError(`${file.name} is larger than 20 MB.`); return; }
    setFiles((current) => current.map((f) => (f.id === id ? { ...f, file } : f)));
    setError('');
  }

  const total = already + files.length;
  const nameOk = existingId ? true : name.trim().length > 0;
  const countOk = total >= MIN_QUOTES_PER_COMPARISON;
  const checks = [
    ...(existingId ? [] : [{ label: 'Project name added', ok: nameOk }]),
    { label: countOk ? `${total} quotes in this comparison` : `Add at least 2 quotes (${total} of 2)`, ok: countOk },
    { label: files.length ? `${files.length} ${files.length === 1 ? 'file' : 'files'} ready to upload` : 'Choose at least one file', ok: files.length > 0 },
  ];
  const canStart = nameOk && countOk && files.length > 0 && !starting;

  async function start() {
    setStarting(true);
    setStartError(null);
    try {
      const id = existingId || (await api.createComparison(name.trim())).id;
      startUploads(api, id, files.map((f) => f.file));
      navigate(`/comparisons/${id}/processing`);
    } catch (e) {
      setStartError(e);
      setStarting(false);
    }
  }

  const title = existing.data ? `Add quotes to ${existing.data.title}` : 'New Comparison';
  const crumbs = existing.data
    ? [['My Comparisons', '/comparisons'], [existing.data.title, `/comparisons/${existingId}/review`], ['Add quotes']]
    : [['My Comparisons', '/comparisons'], ['New Comparison']];

  if (existingId && existing.loading) return <AppLayout crumbs={crumbs} width={960}><Loading /></AppLayout>;

  return (
    <AppLayout crumbs={crumbs} width={960}>
      <Progress current={0} />
      <div className="stack" style={{ gap: 6 }}>
        <h1 className="page-title">{title}</h1>
        <p className="lead">{existingId ? `This comparison has ${already} of ${MAX_QUOTES_PER_COMPARISON} quotes. Add more PDFs to it.` : 'Name your project and upload 2 to 5 contractor quotes as PDFs.'}</p>
      </div>
      <ErrorNotice error={existing.error} />

      {!existingId && (
        <section className="card card-pad field" style={{ gap: 8 }}>
          <label htmlFor="proj" style={{ fontSize: 15, color: 'var(--ink)' }}>Project name</label>
          <input id="proj" className="input" style={{ minHeight: 48, fontSize: 16 }} value={name} maxLength={120} onChange={(e) => setName(e.target.value)} placeholder="e.g., Kitchen Countertop Renovation" />
          <span className="hint">Use something you'll recognize later, like the room or the address.</span>
        </section>
      )}

      <section className="card card-pad stack" style={{ gap: 18 }}>
        <div className="row between" style={{ gap: 12 }}>
          <h2 style={{ fontSize: 18 }}>Contractor quotes</h2>
          <span style={{ fontSize: 14, color: 'var(--slate-600)' }}>{total} of {MAX_QUOTES_PER_COMPARISON} added</span>
        </div>
        <div
          className={`dropzone${dragging ? ' dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer?.files); }}
        >
          <span style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--blue-50)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="upload" size={24} /></span>
          <span style={{ fontSize: 17, fontWeight: 600 }}>Drag and drop PDF quotes here</span>
          <span className="small muted" style={{ fontSize: 14 }}>PDF only · up to 5 per comparison · 20 MB each</span>
          <div className="row" style={{ justifyContent: 'center', gap: 10, marginTop: 4 }}>
            <label className="btn btn-primary" style={{ position: 'relative' }}>
              Browse files
              <input className="file-input" type="file" accept=".pdf,application/pdf" multiple onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
            </label>
            <button type="button" className="btn btn-secondary" onClick={addSamples} disabled={room <= 0}>Add 3 sample quotes</button>
          </div>
        </div>
        {error && (
          <div role="alert" className="notice notice-error">
            <Icon name="alert" />
            <span style={{ flex: 1 }}>{error}</span>
            <button type="button" aria-label="Dismiss message" className="btn-link" style={{ color: '#991B1B', padding: 0 }} onClick={() => setError('')}><Icon name="x" /></button>
          </div>
        )}
        {files.length > 0 && (
          <ul className="stack" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 10 }}>
            {files.map(({ id, file }) => (
              <li key={id} className="row" style={{ gap: 14, padding: '14px 16px', border: '1px solid var(--slate-200)', borderRadius: 12 }}>
                <span className="pdf-badge">PDF</span>
                <span className="stack" style={{ flex: '1 1 220px', minWidth: 0, gap: 2 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                  <span className="small muted">{sizeLabel(file.size)} · Ready to upload</span>
                </span>
                <span className="row" style={{ gap: 6 }}>
                  <label className="btn btn-sm btn-quiet" style={{ position: 'relative' }}>
                    Replace<span className="sr-only"> {file.name}</span>
                    <input className="file-input" type="file" accept=".pdf,application/pdf" onChange={(e) => { replace(id, e.target.files); e.target.value = ''; }} />
                  </label>
                  <button type="button" className="icon-btn" style={{ width: 40, height: 40, borderRadius: 8, color: 'var(--red)' }} aria-label={`Remove ${file.name}`} onClick={() => setFiles((c) => c.filter((f) => f.id !== id))}><Icon name="trash" /></button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ErrorNotice error={startError} />
      <section className="card row between" style={{ padding: '20px 24px', gap: 16 }}>
        <ul className="stack" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 8, fontSize: 14 }}>
          {checks.map((c) => (
            <li key={c.label} className="row" style={{ gap: 8, color: c.ok ? 'var(--green)' : 'var(--slate-600)' }}>
              <Icon name={c.ok ? 'checkCircle' : 'circle'} />
              <span>{c.label}</span>
            </li>
          ))}
        </ul>
        <div className="row" style={{ gap: 10 }}>
          <Link to={existingId ? `/comparisons/${existingId}/review` : '/dashboard'} className="btn btn-lg btn-secondary">Cancel</Link>
          <button type="button" className="btn btn-lg btn-primary" disabled={!canStart} onClick={start}>
            {starting ? 'Starting…' : 'Start processing'}{!starting && <Icon name="arrowRight" />}
          </button>
        </div>
      </section>
    </AppLayout>
  );
}
