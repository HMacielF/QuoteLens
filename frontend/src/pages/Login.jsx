import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Icon } from '../icons.jsx';
import { API_BASE, DEV_USER } from '../api/index.js';
import { useSession } from '../session.jsx';
import './login.css';

const POINTS = [
  'Upload 2 to 5 PDF estimates per project',
  'Check and correct every extracted field',
  'Compare price, materials, and services side by side',
];

export default function Login() {
  const { session, signInDemo, signInDev } = useSession();
  const navigate = useNavigate();
  const [tab, setTab] = useState('signin');
  if (session) return <Navigate to="/dashboard" replace />;

  const demo = () => {
    signInDemo();
    navigate('/dashboard');
  };
  const dev = () => {
    signInDev();
    navigate('/dashboard');
  };

  const isSignIn = tab === 'signin';
  return (
    <div className="login">
      <aside className="login-side">
        <Link to="/" className="brand">
          <span className="brand-mark" style={{ width: 36, height: 36, borderRadius: 10 }}><Icon name="logo" size={20} stroke={2.2} /></span>
          <span className="brand-name" style={{ fontSize: 24 }}>QuoteLens</span>
        </Link>
        <div className="stack" style={{ gap: 16, maxWidth: 440 }}>
          <h1 style={{ fontSize: 36, lineHeight: 1.15 }}>See every countertop quote on one screen.</h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--blue-100)' }}>Your uploaded estimates, extracted details, and saved comparisons stay in your account.</p>
          <div className="stack" style={{ gap: 10, marginTop: 8 }}>
            {POINTS.map((p) => (
              <span key={p} className="row" style={{ gap: 10, fontSize: 15, color: '#E0E7FF', flexWrap: 'nowrap' }}>
                <Icon name="check" stroke={2.5} style={{ color: 'var(--blue-300)', flex: 'none' }} />{p}
              </span>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--blue-200)' }}>INST347 Cloud Computing project</p>
      </aside>

      <main className="login-main">
        <div className="card login-card">
          <div role="tablist" aria-label="Account" className="login-tabs">
            <button type="button" role="tab" aria-selected={isSignIn} onClick={() => setTab('signin')}>Sign in</button>
            <button type="button" role="tab" aria-selected={!isSignIn} onClick={() => setTab('register')}>Create account</button>
          </div>

          <div role="tabpanel" className="stack" style={{ gap: 14 }}>
            <div className="stack" style={{ gap: 6 }}>
              <h2 style={{ fontSize: 24, color: 'var(--navy)' }}>{isSignIn ? 'Welcome back' : 'Create your account'}</h2>
              <p style={{ fontSize: 15, color: 'var(--slate-600)' }}>
                {isSignIn ? 'Sign in to see your quote comparisons.' : 'Free to start. Your quotes stay private to your account.'}
              </p>
            </div>
            <button type="button" className="btn btn-lg btn-primary" disabled aria-describedby="entra-note">
              {isSignIn ? 'Sign in with Microsoft' : 'Create account with Microsoft'}
            </button>
            <p id="entra-note" className="notice notice-plain" style={{ fontSize: 13 }}>
              <Icon name="lock" />
              <span>Accounts use Microsoft Entra External ID, which is still being set up. Until it is ready, use the demo account below. QuoteLens never asks for your password directly.</span>
            </p>
          </div>

          <div className="row" style={{ gap: 12, color: 'var(--slate-500)', fontSize: 13, flexWrap: 'nowrap' }}>
            <span style={{ flex: 1, height: 1, background: 'var(--slate-200)' }} />or<span style={{ flex: 1, height: 1, background: 'var(--slate-200)' }} />
          </div>
          <button type="button" className="btn btn-lg btn-dark" onClick={demo}><Icon name="user" />Continue as Demo User</button>
          <p className="small muted" style={{ lineHeight: 1.5 }}>The demo account runs in this browser with sample extraction. Nothing you upload leaves your computer.</p>
          {API_BASE && DEV_USER && (
            <button type="button" className="btn btn-secondary" onClick={dev}>Use the local API as “{DEV_USER}”</button>
          )}
        </div>
      </main>
    </div>
  );
}
