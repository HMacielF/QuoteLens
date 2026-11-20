import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '../icons.jsx';
import { initials, plural } from '../format.js';
import { useSession } from '../session.jsx';

const NAV = [
  ['/dashboard', 'Dashboard', 'dashboard'],
  ['/comparisons', 'My Comparisons', 'columns'],
  ['/quotes', 'My Quotes', 'fileText'],
  ['/comparisons/new', 'New Comparison', 'plusCircle'],
  ['/settings', 'Settings', 'settings'],
];

export function Brand({ to = '/dashboard' }) {
  return (
    <Link to={to} className="brand">
      <span className="brand-mark"><Icon name="logo" size={19} stroke={2.2} /></span>
      <span className="brand-name">QuoteLens</span>
    </Link>
  );
}

// Notifications are worked out from the account's own data: quotes waiting for a check, and
// comparisons that are built. Nothing is stored or sent.
function Bell() {
  const { api } = useSession();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const box = useRef(null);

  useEffect(() => {
    let live = true;
    Promise.all([api.listComparisons(), api.listQuotes()])
      .then(([comparisons, quotes]) => {
        if (!live) return;
        const next = [];
        for (const c of comparisons) {
          const waiting = quotes.filter((q) => q.comparisonId === c.id && q.status === 'details_ready').length;
          if (waiting) next.push({ to: `/comparisons/${c.id}/review`, title: `${c.title} is ready for review`, sub: `${plural(waiting, 'quote')} to check` });
          else if (c.status === 'ready') next.push({ to: `/comparisons/${c.id}`, title: `${c.title} comparison generated`, sub: plural(c.quoteIds.length, 'quote') });
        }
        setItems(next.slice(0, 5));
      })
      .catch(() => live && setItems([]));
    return () => { live = false; };
  }, [api]);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (event.type === 'keydown' ? event.key === 'Escape' : !box.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const waiting = items.filter((i) => i.to.endsWith('/review')).length;
  return (
    <div ref={box}>
      <button
        type="button"
        className="icon-btn"
        aria-label={waiting ? `Notifications, ${waiting} waiting` : 'Notifications'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="bell" size={19} />
        {waiting > 0 && <span className="dot" aria-hidden="true" />}
      </button>
      {open && (
        <div className="popover" role="dialog" aria-label="Notifications">
          <div style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700 }}>Notifications</div>
          {items.length === 0 && <p className="small muted" style={{ padding: '0 16px 14px' }}>Nothing new. Start a comparison to see updates here.</p>}
          {items.map((item) => (
            <Link key={item.to} to={item.to} onClick={() => setOpen(false)}>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>{item.title}</span>
              <span className="small muted">{item.sub}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function AppLayout({ crumbs = [], children, width = 1120 }) {
  const { session, signOut } = useSession();
  const navigate = useNavigate();
  const accountType = session.mode === 'demo' ? 'Demo account' : 'Local API';
  const logOut = () => {
    signOut();
    navigate('/');
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <Brand />
        <Link to="/comparisons/new" className="btn btn-primary side-new"><Icon name="plus" stroke={2.2} />New Comparison</Link>
        <nav aria-label="App" className="side-nav">
          {NAV.map(([to, label, icon]) => (
            <NavLink key={to} to={to} end className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}>
              <Icon name={icon} />{label}
            </NavLink>
          ))}
        </nav>
        <div className="side-user">
          <span className="avatar" aria-hidden="true">{initials(session.name)}</span>
          <div className="stack" style={{ minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.name}</span>
            <span style={{ fontSize: 12, color: '#C7D2FE' }}>{accountType}</span>
          </div>
          <button type="button" className="side-logout" aria-label="Log out" onClick={logOut}><Icon name="logout" /></button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <nav aria-label="Breadcrumb" className="crumbs">
            {crumbs.map(([label, to], i) => (
              <span key={label + i} className="row" style={{ gap: 8 }}>
                {i > 0 && <span aria-hidden="true">/</span>}
                {to ? <Link to={to}>{label}</Link> : <span className={crumbs.length > 1 ? 'here' : ''} aria-current="page">{label}</span>}
              </span>
            ))}
          </nav>
          <div className="row" style={{ gap: 8 }}>
            <Bell />
            <Link to="/settings" className="avatar avatar-dark" aria-label="Account settings">{initials(session.name)}</Link>
          </div>
        </header>
        <div className="content" style={{ maxWidth: width }}>{children}</div>
      </main>
    </div>
  );
}
