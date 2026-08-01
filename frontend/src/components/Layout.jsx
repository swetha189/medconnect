import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Activity, Calendar, FileText, Share2, FlaskConical, 
  ShoppingBag, ShieldAlert, LogOut, Menu, X, Bell, User, Bed, ClipboardCheck
} from 'lucide-react';

const Layout = ({ currentTab, setCurrentTab, children }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return <>{children}</>;

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'badge-danger';
      case 'HOSPITAL_ADMIN': return 'badge-warning';
      case 'DOCTOR': return 'badge-info';
      case 'PATIENT': return 'badge-success';
      default: return 'badge-info';
    }
  };

  const getNavItems = (role) => {
    const items = [
      { id: 'overview', label: 'Overview', icon: Activity },
    ];

    if (role === 'PATIENT') {
      items.push(
        { id: 'appointments', label: 'Bookings', icon: Calendar },
        { id: 'records', label: 'Medical EHR', icon: FileText },
        { id: 'referrals', label: 'Referrals', icon: Share2 },
        { id: 'labs', label: 'Lab Reports', icon: FlaskConical },
        { id: 'consent', label: 'Access Control', icon: ShieldAlert }
      );
    } else if (role === 'DOCTOR') {
      items.push(
        { id: 'appointments', label: 'Manage Appts', icon: Calendar },
        { id: 'ehr-create', label: 'Add Diagnosis', icon: FileText },
        { id: 'referrals', label: 'Referrals', icon: Share2 },
        { id: 'labs', label: 'Lab Reports', icon: FlaskConical }
      );
    } else if (role === 'HOSPITAL_ADMIN') {
      items.push(
        { id: 'pending-approvals', label: 'Pending Approvals', icon: ClipboardCheck },
        { id: 'doctors-list', label: 'Manage Doctors', icon: User },
        { id: 'beds', label: 'Beds Availability', icon: Bed }
      );
    } else if (role === 'LAB_TECHNICIAN') {
      items.push(
        { id: 'labs-upload', label: 'Upload Lab Report', icon: FlaskConical }
      );
    } else if (role === 'PHARMACIST') {
      items.push(
        { id: 'pharmacy-queue', label: 'Prescriptions Queue', icon: ShoppingBag }
      );
    } else if (role === 'SUPER_ADMIN') {
      items.push(
        { id: 'beds', label: 'System Beds', icon: Bed },
        { id: 'referrals', label: 'All Referrals', icon: Share2 }
      );
    }

    return items;
  };

  const navItems = getNavItems(user.role);

  const handleNavClick = (tabId) => {
    setCurrentTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="app-container fade-in">
      <div className="bg-glow-1"></div>
      <div className="bg-glow-2"></div>

      {/* Sidebar - Desktop */}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`} style={mobileMenuOpen ? { display: 'flex', position: 'fixed', width: '100%', height: '100vh' } : {}}>
        <div className="flex-between" style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={28} color="#3b82f6" style={{ filter: 'drop-shadow(0 0 8px #3b82f6)' }} />
            <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.03em' }}>Med<span style={{ color: '#3b82f6' }}>Connect</span></span>
          </div>
          {mobileMenuOpen && (
            <X size={24} onClick={() => setMobileMenuOpen(false)} style={{ cursor: 'pointer' }} />
          )}
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="btn"
                style={{
                  justifyContent: 'flex-start',
                  background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  color: isActive ? '#f9fafb' : '#9ca3af',
                  borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                  paddingLeft: '12px',
                  borderRadius: '6px',
                  width: '100%',
                }}
              >
                <Icon size={18} color={isActive ? '#3b82f6' : '#9ca3af'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
          <button
            onClick={logout}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Navbar */}
        <header className="glass-card" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              className="btn btn-secondary mobile-menu-toggle" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ display: 'none', padding: '8px' }}
            >
              <Menu size={20} />
            </button>
            <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>
              Welcome back, <strong style={{ color: '#fff' }}>{user.firstName} {user.lastName}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span className={`badge ${getRoleBadgeClass(user.role)}`}>
              {user.role.replace('_', ' ')}
            </span>
            <div style={{ position: 'relative', background: 'rgba(255,255,255,0.04)', borderRadius: '50%', padding: '10px', display: 'flex', alignItems: 'center' }}>
              <Bell size={18} color="#9ca3af" />
            </div>
          </div>
        </header>

        {/* Dynamic page content injects here */}
        <div className="page-body">
          {children}
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-toggle {
            display: inline-flex !important;
          }
          .sidebar {
            display: none !important;
          }
          .sidebar.open {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
