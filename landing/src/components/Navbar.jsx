import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Dumbbell, LayoutDashboard, Apple, Calendar, TrendingUp, User, LogOut, Award } from 'lucide-react';
import { getUser, saveUser } from '../utils/db';
import { t } from '../utils/i18n';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const isPremium = user?.isPremium;
  const currentLang = user?.language || 'en';

  const handleLanguageToggle = () => {
    if (!user) return;
    const newLang = currentLang === 'en' ? 'kn' : 'en';
    const updatedUser = {
      ...user,
      language: newLang
    };
    saveUser(updatedUser);
  };

  const activeStyle = ({ isActive }) => 
    `nav-item ${isActive ? 'nav-item-active' : ''}`;

  return (
    <aside className="desktop-sidebar glass-card">
      <div className="sidebar-brand">
        <Link to="/" className="brand-logo">
          <Dumbbell className="brand-icon" />
          <span>FITMITRA</span>
        </Link>
        {user && (
          <button className="lang-toggle-btn" onClick={handleLanguageToggle} title="Switch Language">
            🌐 {currentLang === 'en' ? 'ಕನ್ನಡ' : 'EN'}
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={activeStyle}>
          <LayoutDashboard size={20} />
          <span>{t('dashboard', currentLang)}</span>
        </NavLink>
        <NavLink to="/workouts" className={activeStyle}>
          <Dumbbell size={20} />
          <span>{t('workouts', currentLang)}</span>
        </NavLink>
        <NavLink to="/nutrition" className={activeStyle}>
          <Apple size={20} />
          <span>{t('nutrition', currentLang)}</span>
        </NavLink>
        <NavLink to="/programs" className={activeStyle}>
          <Calendar size={20} />
          <span>{t('programs', currentLang)}</span>
        </NavLink>
        <NavLink to="/progress" className={activeStyle}>
          <TrendingUp size={20} />
          <span>{t('progress', currentLang)}</span>
        </NavLink>
        <NavLink to="/profile" className={activeStyle}>
          <User size={20} />
          <span>{t('profile', currentLang)}</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        {user ? (
          <div className="user-profile-widget">
            <div className="user-info">
              <div className="avatar">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="details">
                <p className="name">{user.name}</p>
                <div className="status">
                  {isPremium ? (
                    <span className="premium-badge">
                      <Award size={12} /> PRO
                    </span>
                  ) : (
                    <span className="free-badge">{currentLang === 'en' ? 'FREE Tier' : 'ಉಚಿತ'}</span>
                  )}
                </div>
              </div>
            </div>
            <button className="logout-btn" onClick={onLogout} title={t('logout', currentLang)}>
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div className="sidebar-auth-btns">
            <Link to="/login" className="btn btn-primary btn-block btn-sm">{t('login', currentLang)}</Link>
          </div>
        )}
      </div>

      <style>{`
        .desktop-sidebar {
          position: fixed;
          top: 20px;
          left: 20px;
          bottom: 20px;
          width: 240px;
          border-radius: var(--border-radius-lg);
          padding: 24px 16px;
          display: none;
          flex-direction: column;
          z-index: 100;
          box-shadow: var(--shadow-dark);
        }

        @media (min-width: 1024px) {
          .desktop-sidebar {
            display: flex;
          }
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
          padding-left: 8px;
          gap: 8px;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.4rem;
          letter-spacing: 0.05em;
          color: var(--text-primary);
        }

        .lang-toggle-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-glass);
          color: var(--primary-neon);
          font-size: 0.75rem;
          font-weight: bold;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .lang-toggle-btn:hover {
          background: var(--primary-neon-dim);
          border-color: rgba(204, 255, 0, 0.4);
        }

        .brand-icon {
          color: var(--primary-neon);
          filter: drop-shadow(0 0 8px var(--primary-neon-glow));
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: var(--border-radius-md);
          color: var(--text-secondary);
          font-weight: 500;
          font-size: 0.95rem;
          transition: all 0.2s ease;
        }

        .nav-item:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.03);
          transform: translateX(4px);
        }

        .nav-item-active {
          color: #000 !important;
          background: var(--primary-neon) !important;
          font-weight: 600;
          box-shadow: 0 4px 12px var(--primary-neon-glow);
        }

        .sidebar-footer {
          border-top: 1px solid var(--border-glass);
          padding-top: 20px;
          margin-top: 20px;
        }

        .user-profile-widget {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--secondary-cyan), var(--primary-neon));
          color: #000;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 10px rgba(0, 240, 255, 0.2);
        }

        .user-info .name {
          font-weight: 600;
          font-size: 0.9rem;
          max-width: 110px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .premium-badge {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--primary-neon);
          background: var(--primary-neon-dim);
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid rgba(204, 255, 0, 0.3);
        }

        .free-badge {
          font-size: 0.65rem;
          color: var(--text-muted);
        }

        .logout-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          transition: color 0.2s;
          padding: 6px;
          border-radius: 6px;
        }

        .logout-btn:hover {
          color: var(--accent-rose);
          background: rgba(244, 63, 94, 0.1);
        }

        .sidebar-auth-btns {
          text-align: center;
        }
      `}</style>
    </aside>
  );
}

export default Navbar;
