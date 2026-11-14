import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useSession } from './session.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NewComparison from './pages/NewComparison.jsx';
import Processing from './pages/Processing.jsx';
import Review from './pages/Review.jsx';
import Comparison from './pages/Comparison.jsx';
import QuoteDetail from './pages/QuoteDetail.jsx';
import History from './pages/History.jsx';
import Quotes from './pages/Quotes.jsx';
import Settings from './pages/Settings.jsx';

function RequireSession({ children }) {
  const { session } = useSession();
  return session ? children : <Navigate to="/login" replace />;
}

const TITLES = [
  [/^\/$/, 'QuoteLens: Compare countertop quotes'],
  [/^\/login/, 'Sign in · QuoteLens'],
  [/^\/dashboard/, 'Dashboard · QuoteLens'],
  [/^\/comparisons\/new/, 'New Comparison · QuoteLens'],
  [/^\/comparisons\/[^/]+\/processing/, 'Processing · QuoteLens'],
  [/^\/comparisons\/[^/]+\/review/, 'Review details · QuoteLens'],
  [/^\/comparisons\/[^/]+/, 'Comparison results · QuoteLens'],
  [/^\/comparisons/, 'My Comparisons · QuoteLens'],
  [/^\/quotes\/[^/]+/, 'Quote details · QuoteLens'],
  [/^\/quotes/, 'My Quotes · QuoteLens'],
  [/^\/settings/, 'Settings · QuoteLens'],
];

function PageTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = (TITLES.find(([re]) => re.test(pathname)) || [null, 'QuoteLens'])[1];
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const app = (page) => <RequireSession>{page}</RequireSession>;

export default function App() {
  return (
    <>
      <PageTitle />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={app(<Dashboard />)} />
        <Route path="/comparisons" element={app(<History />)} />
        <Route path="/comparisons/new" element={app(<NewComparison />)} />
        <Route path="/comparisons/:id/processing" element={app(<Processing />)} />
        <Route path="/comparisons/:id/review" element={app(<Review />)} />
        <Route path="/comparisons/:id" element={app(<Comparison />)} />
        <Route path="/quotes" element={app(<Quotes />)} />
        <Route path="/quotes/:id" element={app(<QuoteDetail />)} />
        <Route path="/settings" element={app(<Settings />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
