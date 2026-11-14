import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout.jsx';
import { ErrorNotice } from '../components/ui.jsx';
import { Icon } from '../icons.jsx';
import { formatDate, plural } from '../format.js';
import { useSession } from '../session.jsx';
import { useLoad } from '../useLoad.js';

function Info({ label, children, mono }) {
  return (
    <div className="stack" style={{ gap: 2, padding: '10px 0', borderBottom: '1px solid var(--slate-100)' }}>
      <dt className="small muted">{label}</dt>
      <dd style={{ margin: 0, fontSize: 14, fontWeight: 600, fontFamily: mono ? 'ui-monospace, Menlo, monospace' : undefined, overflowWrap: 'anywhere' }}>{children}</dd>
    </div>
  );
}

export default function Settings() {
  const { api, session, updateProfile, signOut } = useSession();
  const navigate = useNavigate();
  const [name, setName] = useState(session.name || '');
  const [email, setEmail] = useState(session.email || '');
  const [message, setMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const stats = useLoad(() => Promise.all([api.listComparisons(), api.listQuotes(), api.health()]), [api]);
  const [comparisons, quotes, health] = stats.data || [[], [], null];
  const demo = session.mode === 'demo';

  function saveProfile(event) {
    event.preventDefault();
    if (!name.trim()) { setProfileError("Display name can't be empty."); setMessage(''); return; }
    if (email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setProfileError('Enter a valid email address, or leave it blank.'); setMessage(''); return; }
    updateProfile({ name: name.trim(), email: email.trim() });
    setProfileError('');
    setMessage('Profile saved in this browser');
  }

  function resetDemo() {
    api.reset();
    setConfirmReset(false);
    setMessage('Demo data cleared');
    stats.reload();
  }

  const logOut = () => {
    signOut();
    navigate('/');
  };

  const ready = comparisons.filter((c) => c.status === 'ready').length;
  return (
    <AppLayout crumbs={[['Settings']]} width={860}>
      <div className="stack" style={{ gap: 6 }}>
        <h1 className="page-title">Account Settings</h1>
        <p className="lead">{demo ? 'You are using the demo account. Everything here is saved in this browser only.' : 'You are signed in to the local API as a development user.'}</p>
      </div>
      {message && <div role="status" className="notice notice-success" style={{ fontWeight: 600 }}><Icon name="check" />{message}</div>}

      <form className="card" style={{ overflow: 'hidden' }} onSubmit={saveProfile}>
        <div className="card-head" style={{ padding: '18px 24px' }}><h2>Profile</h2></div>
        <div className="grid-auto" style={{ padding: '20px 24px', '--min': '240px' }}>
          <div className="field"><label htmlFor="s-name">Display name</label><input id="s-name" className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="field"><label htmlFor="s-email">Email</label><input id="s-email" type="email" className="input" value={email} placeholder="Optional" onChange={(e) => setEmail(e.target.value)} /></div>
        </div>
        {profileError && <p role="alert" className="small" style={{ padding: '0 24px 12px', fontWeight: 600, color: 'var(--red)' }}>{profileError}</p>}
        <div className="row between" style={{ padding: '14px 24px', borderTop: '1px solid var(--slate-200)', gap: 12 }}>
          <span className="small muted">Once sign-in is set up, your Microsoft account supplies these.</span>
          <button type="submit" className="btn btn-primary">Save profile</button>
        </div>
      </form>

      <section className="card" style={{ overflow: 'hidden' }}>
        <div className="card-head" style={{ padding: '18px 24px' }}><h2>Password and Security</h2></div>
        <div style={{ padding: '20px 24px' }}>
          <div className="notice notice-plain" style={{ color: 'var(--slate-700)' }}>
            <Icon name="shield" style={{ color: 'var(--navy)' }} />
            <p>Sign-in provider: <strong>Microsoft Entra External ID</strong> (being set up). Passwords, resets, and two-step sign-in are handled by Entra, so QuoteLens never stores a password.</p>
          </div>
        </div>
      </section>

      <section className="card" style={{ overflow: 'hidden' }}>
        <div className="card-head" style={{ padding: '18px 24px' }}><h2>Account Information</h2></div>
        <ErrorNotice error={stats.error} onRetry={stats.reload} />
        <dl className="grid-auto" style={{ margin: 0, padding: '8px 24px 16px', '--min': '220px', columnGap: 24, rowGap: 0 }}>
          <Info label="User ID" mono>{session.userId}</Info>
          <Info label="Account type">{demo ? 'Demo (saved in this browser)' : 'Development user on the local API'}</Info>
          <Info label="Using QuoteLens since">{formatDate(session.since)}</Info>
          <Info label="Comparisons">{stats.data ? `${comparisons.length} (${comparisons.length - ready} in progress, ${ready} compared)` : '…'}</Info>
          <Info label="Uploaded quotes">{stats.data ? plural(quotes.length, 'PDF') : '…'}</Info>
          <Info label="Data store" mono>{health ? health.store : '…'}</Info>
          <Info label="Data partition" mono>/userId</Info>
        </dl>
      </section>

      {demo && (
        <section className="card row between" style={{ padding: '20px 24px', gap: 16 }}>
          <div className="stack" style={{ gap: 4 }}>
            <h2 style={{ fontSize: 17 }}>Reset demo data</h2>
            <p style={{ fontSize: 14, color: 'var(--slate-600)' }}>Delete every demo comparison and quote saved in this browser.</p>
          </div>
          <button type="button" className="btn btn-danger-soft" onClick={() => setConfirmReset(true)}><Icon name="trash" />Reset demo data</button>
        </section>
      )}

      <section className="card row between" style={{ padding: '20px 24px', gap: 16 }}>
        <div className="stack" style={{ gap: 4 }}>
          <h2 style={{ fontSize: 17 }}>Sign Out</h2>
          <p style={{ fontSize: 14, color: 'var(--slate-600)' }}>End this session and return to the QuoteLens home page.{demo ? ' Your demo data stays in this browser.' : ''}</p>
        </div>
        <button type="button" className="btn btn-danger-soft" onClick={logOut}><Icon name="logout" />Sign out</button>
      </section>

      {confirmReset && (
        <div className="modal-backdrop">
          <div role="alertdialog" aria-modal="true" aria-labelledby="reset-title" aria-describedby="reset-desc" className="modal">
            <span style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--red-50)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="trash" /></span>
            <h2 id="reset-title" style={{ fontSize: 20 }}>Reset demo data?</h2>
            <p id="reset-desc" style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--slate-600)' }}>This deletes {plural(comparisons.length, 'comparison')} and {plural(quotes.length, 'quote')} from this browser. It can't be undone.</p>
            <div className="row" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
              <button type="button" className="btn btn-quiet" autoFocus onClick={() => setConfirmReset(false)}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={resetDemo}>Delete demo data</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
