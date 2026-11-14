import { Icon } from '../icons.jsx';
import { serviceView } from '../format.js';

export function Loading({ label = 'Loading' }) {
  return <div className="loading" role="status">{label}…</div>;
}

export function ErrorNotice({ error, onRetry }) {
  if (!error) return null;
  const message = typeof error === 'string' ? error : error.message;
  return (
    <div className="notice notice-error" role="alert">
      <Icon name="alert" />
      <span style={{ flex: 1 }}>
        {message}
        {error.details?.length ? (
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            {error.details.map((d) => <li key={d.field}>{friendlyField(d.field)}: {d.message}</li>)}
          </ul>
        ) : null}
      </span>
      {onRetry && <button type="button" className="btn btn-sm btn-quiet" onClick={onRetry}>Try again</button>}
    </div>
  );
}

const FIELD_NAMES = {
  'contractor.name': 'Contractor name',
  totalPrice: 'Total price',
  squareFootage: 'Square footage',
  title: 'Project name',
};
const friendlyField = (field) => FIELD_NAMES[field] || field;

export function Pill({ tone, children }) {
  return <span className={`pill tone-${tone}`}>{children}</span>;
}

export function Tag({ kind, children }) {
  const icon = kind === 'included' ? 'check' : kind === 'extra' ? 'plus' : null;
  return (
    <span className={`tag tag-${kind}`}>
      {icon && <Icon name={icon} size={13} stroke={2.6} />}
      {children}
    </span>
  );
}

export function ServiceTag({ item }) {
  const view = serviceView(item);
  return <Tag kind={view.kind}>{view.text}</Tag>;
}

// A value from a quote, or the grey Not Specified tag when the quote leaves it out.
export function Value({ children }) {
  const empty = children == null || children === '' || (Array.isArray(children) && !children.join(''));
  return empty ? <Tag kind="ns">Not Specified</Tag> : <span>{children}</span>;
}

export function Calc() {
  return <span className="tag tag-calc">Calculated</span>;
}

export function PageHeader({ eyebrow, title, lead, children }) {
  return (
    <div className="row between" style={{ alignItems: 'flex-end', gap: 16 }}>
      <div className="stack" style={{ gap: 6, minWidth: 0 }}>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="page-title">{title}</h1>
        {lead && <p className="lead" style={{ maxWidth: 680 }}>{lead}</p>}
      </div>
      {children && <div className="row" style={{ gap: 10 }}>{children}</div>}
    </div>
  );
}

export function Legend() {
  return (
    <div className="card row between" style={{ gap: 16, padding: '12px 16px' }}>
      <div className="row" style={{ gap: 16, fontSize: 13, color: 'var(--slate-700)' }}>
        <span className="row" style={{ gap: 6 }}><Tag kind="included">Included</Tag>in the quoted total</span>
        <span className="row" style={{ gap: 6 }}><Tag kind="extra">Extra</Tag>charged on top</span>
        <span className="row" style={{ gap: 6 }}><Tag kind="excluded">Not included</Tag>the quote leaves it out</span>
        <span className="row" style={{ gap: 6 }}><Tag kind="ns">Not Specified</Tag>the quote doesn't say</span>
        <span className="row" style={{ gap: 6 }}><Calc />worked out by QuoteLens</span>
      </div>
    </div>
  );
}

export function MockExtractionNotice() {
  return (
    <div className="notice notice-info">
      <Icon name="info" />
      <p>
        <strong>Extraction is simulated for now.</strong> The API does not read the PDF text yet, so each quote
        is filled in with one of three sample quotes until Azure Document Intelligence is connected.
        Check every field against your PDF and correct it before you compare.
      </p>
    </div>
  );
}
