import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import { saveUser } from '../utils/db';

function Layout({ children, user, onLogout }) {
  const location = useLocation();
  
  const currentLang = user?.language || 'en';
  const handleLanguageToggle = () => {
    if (!user) return;
    const newLang = currentLang === 'en' ? 'kn' : 'en';
    saveUser({
      ...user,
      language: newLang
    });
  };

  // Hide standard layouts for public landing page (Home), Login, Signup, or Onboarding
  const isNoLayoutPage = 
    location.pathname === '/' || 
    location.pathname === '/login' || 
    location.pathname === '/signup' || 
    location.pathname === '/onboarding';

  if (isNoLayoutPage) {
    return <>{children}</>;
  }

  return (
    <div className="app-layout">
      {/* Mobile Top Header */}
      <header className="mobile-top-header">
        <Link to="/" className="mobile-brand">
          <Dumbbell className="brand-icon" size={24} />
          <span>FITMITRA</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user && (
            <button className="lang-toggle-btn" onClick={handleLanguageToggle} style={{ fontSize: '0.7rem' }}>
              🌐 {currentLang === 'en' ? 'ಕನ್ನಡ' : 'EN'}
            </button>
          )}
          {user ? (
            <Link to="/profile" className="mobile-profile-btn">
              <div className="mobile-avatar">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            </Link>
          ) : (
            <Link to="/login" className="mobile-login-link">Login</Link>
          )}
        </div>
      </header>

      {/* Desktop Sidebar Navigation */}
      <Navbar user={user} onLogout={onLogout} />

      {/* Main Content Wrapper */}
      <main className="main-content">
        <div className="container page-content-container">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <BottomNav />

      <style>{`
        .mobile-top-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 60px;
          padding: 0 20px;
          background: rgba(6, 9, 19, 0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--border-glass);
          position: sticky;
          top: 0;
          z-index: 90;
        }

        .mobile-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.25rem;
          color: var(--text-primary);
          letter-spacing: 0.05em;
        }

        .mobile-brand .brand-icon {
          color: var(--primary-neon);
        }

        .mobile-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--secondary-cyan), var(--primary-neon));
          color: #000;
          font-weight: 700;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 8px rgba(0, 240, 255, 0.2);
        }

        .mobile-login-link {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--primary-neon);
          background: var(--primary-neon-dim);
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid rgba(204, 255, 0, 0.2);
        }

        .page-content-container {
          padding: 20px;
        }

        @media (min-width: 1024px) {
          .mobile-top-header {
            display: none;
          }
          .page-content-container {
            padding: 30px;
          }
        }
      `}</style>
    </div>
  );
}

export default Layout;
