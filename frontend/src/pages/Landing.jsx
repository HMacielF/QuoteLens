import { Link } from 'react-router-dom';
import { Icon } from '../icons.jsx';
import { Tag } from '../components/ui.jsx';
import { useSession } from '../session.jsx';
import './landing.css';

const EXAMPLE = [
  ['ABC Countertops', 'Granite, Steel Gray', '$8,750', <Tag kind="included">Included</Tag>],
  ['Premier Stone', 'Quartz, Calacatta White', '$9,980', <Tag kind="included">Included</Tag>],
  ['Modern Surfaces', 'Granite, Black Pearl', '$8,200', <Tag kind="extra">$600 extra</Tag>],
];

const STEPS = [
  ['upload', 'Upload Your Quotes', 'Upload PDF estimates received from countertop contractors.'],
  ['fileText', 'Extract the Details', 'QuoteLens organizes the important information in each quote: pricing, materials, square footage, and installation services.'],
  ['columns', 'Compare Your Options', 'View the quotes side by side to understand the differences and choose the option that works best for your project.'],
];

const COMPARED = [
  ['Material and color', 'Granite, quartz, marble, quartzite, and the exact color named on each quote.'],
  ['Square footage and $/sq ft', "Flags quotes measured at different sizes, so a lower total isn't just less stone."],
  ['Included vs. extra services', 'Fabrication, installation, sink cutouts, backsplash, edge profile, and tear-out.'],
  ['Missing information', 'Anything a quote leaves out shows as Not Specified, never as $0.'],
];

const AZURE = [
  ['App Service', 'Hosts this web app', 'Live'],
  ['Azure Functions', 'The QuoteLens API', 'Live'],
  ['Blob Storage', 'Original PDFs', 'Live'],
  ['Cosmos DB', 'Users, quotes, comparisons', 'Live'],
  ['Document Intelligence', 'Reads the PDFs', 'Being connected'],
  ['Entra External ID', 'Sign-in and tokens', 'Being set up'],
];

export default function Landing() {
  const { session } = useSession();
  const start = session ? '/dashboard' : '/login';
  return (
    <div className="landing">
      <header className="l-header">
        <div className="l-wrap row between" style={{ padding: '16px 24px', gap: 16 }}>
          <Link to="/" className="row l-brand" style={{ gap: 10 }}>
            <span className="l-mark"><Icon name="logo" size={20} stroke={2.2} /></span>
            <span>QuoteLens</span>
          </Link>
          <nav aria-label="Main" className="row" style={{ gap: 8 }}>
            <a href="#how" className="l-nav">How it works</a>
            <a href="#compare" className="l-nav">What we compare</a>
            {!session && <Link to="/login" className="l-nav strong-nav">Sign in</Link>}
            <Link to={start} className="btn btn-primary">{session ? 'Open dashboard' : 'Get Started'}</Link>
          </nav>
        </div>
      </header>

      <section className="l-wrap l-hero">
        <div className="stack" style={{ flex: '1 1 440px', minWidth: 0, gap: 24 }}>
          <span className="pill tone-blue" style={{ alignSelf: 'flex-start', fontSize: 13, padding: '6px 12px' }}>For homeowners comparing countertop estimates</span>
          <h1 className="l-h1">Compare Countertop Quotes with Confidence</h1>
          <p className="l-lead">Upload estimates from different countertop contractors and see pricing, materials, and included services side by side. Make an informed decision without sorting through multiple PDFs.</p>
          <div className="row" style={{ gap: 12 }}>
            <Link to={start} className="btn btn-primary btn-lg">Get Started<Icon name="arrowRight" /></Link>
            <a href="#how" className="btn btn-secondary btn-lg">See How It Works</a>
          </div>
        </div>
        <div style={{ flex: '1 1 520px', minWidth: 0 }}>
          <div className="card l-example">
            <div className="row between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--slate-200)', gap: 8 }}>
              <div className="stack" style={{ gap: 2 }}>
                <span className="small muted" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 12 }}>Example comparison</span>
                <span style={{ fontSize: 16, fontWeight: 700 }}>Kitchen Renovation · 3 quotes</span>
              </div>
              <span className="pill tone-grey">Sample data</span>
            </div>
            <div className="table-wrap">
              <table className="data" style={{ minWidth: 480 }}>
                <thead>
                  <tr><th scope="col">Contractor</th><th scope="col">Material</th><th scope="col">Total</th><th scope="col">Installation</th></tr>
                </thead>
                <tbody>
                  {EXAMPLE.map(([name, material, total, install]) => (
                    <tr key={name}><td className="strong">{name}</td><td>{material}</td><td className="strong">{total}</td><td>{install}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row" style={{ padding: '14px 20px', background: 'var(--blue-50)', borderTop: '1px solid var(--blue-100)', gap: 10, alignItems: 'flex-start', flexWrap: 'nowrap' }}>
              <Icon name="info" style={{ color: 'var(--blue-dark)', flex: 'none', marginTop: 2 }} />
              <p style={{ fontSize: 14, lineHeight: 1.5, color: '#1E3A8A' }}>The lowest stated price is not always the lowest complete project. Modern Surfaces quotes $8,200, but installation is $600 extra.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="l-band">
        <div className="l-wrap stack" style={{ padding: '72px 24px', gap: 40 }}>
          <div className="stack" style={{ gap: 10, maxWidth: 640 }}>
            <span className="eyebrow">How it works</span>
            <h2 className="l-h2">Three steps from a pile of PDFs to a clear comparison</h2>
          </div>
          <div className="grid-auto" style={{ '--min': '260px', gap: 24 }}>
            {STEPS.map(([icon, title, text], i) => (
              <div key={title} className="l-step">
                <div className="row" style={{ gap: 12 }}>
                  <span className="l-step-icon"><Icon name={icon} size={22} /></span>
                  <span className="small muted" style={{ fontWeight: 700 }}>STEP {i + 1}</span>
                </div>
                <h3 style={{ fontSize: 20 }}>{title}</h3>
                <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--slate-600)' }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="compare" className="l-wrap row" style={{ padding: '72px 24px', gap: 48, alignItems: 'flex-start' }}>
        <div className="stack" style={{ flex: '1 1 360px', minWidth: 0, gap: 14 }}>
          <span className="eyebrow">What we compare</span>
          <h2 className="l-h2">Line up the details that change the real price</h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--slate-600)' }}>Two quotes can look $500 apart and end up the same once you add the sink cutout, the tear-out, and the install. QuoteLens shows what each contractor included, what costs extra, and what the quote never mentions.</p>
        </div>
        <div className="grid-auto" style={{ flex: '1 1 520px', minWidth: 0, '--min': '240px' }}>
          {COMPARED.map(([title, text]) => (
            <div key={title} className="card stack" style={{ padding: 20, gap: 6, borderRadius: 12 }}>
              <h3 style={{ fontSize: 16 }}>{title}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--slate-600)' }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: 'var(--navy)' }}>
        <div className="l-wrap stack" style={{ padding: '64px 24px', gap: 28 }}>
          <div className="stack" style={{ gap: 10, maxWidth: 680 }}>
            <span className="eyebrow" style={{ color: 'var(--blue-200)' }}>Architecture</span>
            <h2 style={{ fontSize: 32, lineHeight: 1.2, color: '#fff' }}>Built on Microsoft Azure</h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--blue-100)' }}>Each piece of QuoteLens maps to an Azure service. The API and storage are live; sign-in and PDF reading are still being connected, so the demo account keeps its data in your browser for now.</p>
          </div>
          <div className="grid-auto" style={{ '--min': '170px', gap: 12 }}>
            {AZURE.map(([name, role, status]) => (
              <div key={name} className="l-azure">
                <span style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{name}</span>
                <span style={{ color: 'var(--blue-100)', fontSize: 14 }}>{role}</span>
                <span className="l-azure-status">{status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="l-wrap row between" style={{ padding: '72px 24px', gap: 24 }}>
        <div className="stack" style={{ gap: 8, flex: '1 1 400px' }}>
          <h2 style={{ fontSize: 30, color: 'var(--navy)' }}>Have two or more countertop quotes?</h2>
          <p style={{ fontSize: 17, color: 'var(--slate-600)' }}>Upload them and see the differences in a few minutes.</p>
        </div>
        <Link to={start} className="btn btn-primary btn-lg">Get Started</Link>
      </section>

      <footer style={{ borderTop: '1px solid var(--slate-200)', background: '#fff' }}>
        <div className="l-wrap row between" style={{ padding: 24, gap: 12, fontSize: 14, color: 'var(--slate-500)' }}>
          <span><span style={{ fontFamily: 'var(--serif)', fontWeight: 800, color: 'var(--navy)' }}>QuoteLens</span> · INST347 Cloud Computing, University of Maryland</span>
          <span>Class project. The demo account uses sample data.</span>
        </div>
      </footer>
    </div>
  );
}
