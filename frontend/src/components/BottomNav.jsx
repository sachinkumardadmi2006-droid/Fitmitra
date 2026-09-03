import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Dumbbell, Apple, TrendingUp, User } from 'lucide-react';
import { getUser } from '../utils/db';
import { t } from '../utils/i18n';

function BottomNav() {
  const user = getUser();
  const currentLang = user?.language || 'en';

  const activeStyle = ({ isActive }) => 
    `mobile-nav-item ${isActive ? 'mobile-nav-item-active' : ''}`;

  return (
    <nav className="mobile-bottom-nav">
      <NavLink to="/dashboard" className={activeStyle}>
        <Home size={22} />
        <span>{t('home', currentLang)}</span>
      </NavLink>
      <NavLink to="/workouts" className={activeStyle}>
        <Dumbbell size={22} />
        <span>{t('workout', currentLang)}</span>
      </NavLink>
      <NavLink to="/nutrition" className={activeStyle}>
        <Apple size={22} />
        <span>{t('diet', currentLang)}</span>
      </NavLink>
      <NavLink to="/progress" className={activeStyle}>
        <TrendingUp size={22} />
        <span>{t('progress', currentLang)}</span>
      </NavLink>
      <NavLink to="/profile" className={activeStyle}>
        <User size={22} />
        <span>{t('profile', currentLang)}</span>
      </NavLink>

      <style>{`
        .mobile-bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 64px;
          background: rgba(13, 18, 34, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid var(--border-glass);
          display: flex;
          justify-content: space-around;
          align-items: center;
          z-index: 100;
          padding: 0 10px;
        }

        @media (min-width: 1024px) {
          .mobile-bottom-nav {
            display: none;
          }
        }

        .mobile-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          color: var(--text-secondary);
          font-size: 0.7rem;
          font-weight: 500;
          width: 20%;
          height: 100%;
          transition: all 0.2s ease;
          position: relative;
        }

        .mobile-nav-item svg {
          transition: transform 0.2s ease;
        }

        .mobile-nav-item:active svg {
          transform: scale(0.85);
        }

        .mobile-nav-item-active {
          color: var(--primary-neon);
        }

        .mobile-nav-item-active svg {
          color: var(--primary-neon);
          filter: drop-shadow(0 0 6px var(--primary-neon-glow));
          transform: translateY(-2px);
        }

        .mobile-nav-item-active::after {
          content: '';
          position: absolute;
          bottom: 6px;
          width: 4px;
          height: 4px;
          background-color: var(--primary-neon);
          border-radius: 50%;
          box-shadow: 0 0 8px var(--primary-neon);
        }
      `}</style>
    </nav>
  );
}

export default BottomNav;
