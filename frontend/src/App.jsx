import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Auth from './pages/Auth';
import Layout from './components/Layout';
import DashboardController from './pages/DashboardController';
import './index.css';

function App() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('overview');

  // Global loading spinner while checking session
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        background: 'var(--bg-primary)'
      }}>
        <div className="bg-glow-1"></div>
        <div className="bg-glow-2"></div>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: '3px solid rgba(59,130,246,0.2)',
          borderTopColor: '#3b82f6',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Verifying secure session…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Show Auth page if not logged in
  if (!user) {
    return <Auth />;
  }

  // Main authenticated dashboard
  return (
    <Layout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      <DashboardController currentTab={currentTab} setCurrentTab={setCurrentTab} />
    </Layout>
  );
}

export default App;
