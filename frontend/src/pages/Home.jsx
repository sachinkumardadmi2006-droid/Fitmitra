import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Dumbbell, Flame, TrendingUp, Calendar, ArrowRight, Award, Shield, CheckCircle } from 'lucide-react';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="landing-page container animate-fade-in">
      {/* Landing Header */}
      <header className="landing-header">
        <div className="brand">
          <Dumbbell className="brand-logo" />
          <span>FITMITRA</span>
        </div>
        <div className="auth-actions">
          <Link to="/login" className="btn btn-secondary">Log In</Link>
          <Link to="/signup" className="btn btn-primary">Get Started</Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <span className="hero-tag">🔥 TRANSFORM YOUR BODY</span>
        <h1 className="hero-title text-gradient-cyan">
          BUILD YOUR<br />BEST VERSION.
        </h1>
        <p className="hero-subtitle">
          Train • Eat • Track • Achieve. FitMitra is your complete personal fitness companion designed to track every set, meal, and pound of your transformation journey.
        </p>
        <div className="hero-actions">
          <button onClick={() => navigate('/signup')} className="btn btn-primary">
            START YOUR JOURNEY <ArrowRight size={18} />
          </button>
          <button onClick={() => navigate('/login')} className="btn btn-secondary">
            EXPLORE PROGRAMS
          </button>
        </div>
      </section>

      {/* Quick Statistics Row */}
      <section className="stats-section glass-card">
        <h2 className="section-title">FitMitra Community Stats</h2>
        <div className="stats-row">
          <div className="stat-box">
            <p className="stat-value">24</p>
            <p className="stat-label">Workouts</p>
          </div>
          <div className="stat-box">
            <p className="stat-value">8.4K</p>
            <p className="stat-label">Calories Burned</p>
          </div>
          <div className="stat-box">
            <p className="stat-value">12</p>
            <p className="stat-label">Programs</p>
          </div>
          <div className="stat-box">
            <p className="stat-value">72 KG</p>
            <p className="stat-label">Current Weight</p>
          </div>
        </div>
      </section>

      {/* Popular Workouts Grid */}
      <section className="workout-categories-section">
        <h2 className="section-title">Popular Workout Splits</h2>
        <p className="section-subtitle">Target individual muscle groups with expert routines.</p>
        
        <div className="categories-grid">
          <div className="category-card glass-card glass-card-hover" onClick={() => navigate('/login')}>
            <span className="cat-badge">12 Exercises</span>
            <h3>Chest & Triceps</h3>
            <p>Develop upper-body pushing strength and chest volume.</p>
            <div className="card-link">Explore Split <ArrowRight size={14} /></div>
          </div>

          <div className="category-card glass-card glass-card-hover" onClick={() => navigate('/login')}>
            <span className="cat-badge">10 Exercises</span>
            <h3>Back & Biceps</h3>
            <p>Carve out lat width, middle back detail, and bicep peaks.</p>
            <div className="card-link">Explore Split <ArrowRight size={14} /></div>
          </div>

          <div className="category-card glass-card glass-card-hover" onClick={() => navigate('/login')}>
            <span className="cat-badge">15 Exercises</span>
            <h3>Leg Destroyer</h3>
            <p>Focus on deep barbell squats, presses, and hamstring hinges.</p>
            <div className="card-link">Explore Split <ArrowRight size={14} /></div>
          </div>

          <div className="category-card glass-card glass-card-hover" onClick={() => navigate('/login')}>
            <span className="cat-badge">14 Exercises</span>
            <h3>Shoulder Blast</h3>
            <p>Build wide, rounded shoulders with clean overhead pressing.</p>
            <div className="card-link">Explore Split <ArrowRight size={14} /></div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="features-section">
        <h2 className="section-title">Why Choose FitMitra?</h2>
        <div className="features-grid">
          <div className="feature-item">
            <CheckCircle className="feature-icon" />
            <div>
              <h3>Interactive Workout Player</h3>
              <p>Active timer, rest tracking, and automatic calorie calculations mid-workout.</p>
            </div>
          </div>

          <div className="feature-item">
            <CheckCircle className="feature-icon" />
            <div>
              <h3>Diet & Calorie Logger</h3>
              <p>Search, log daily breakfast/lunch/dinner, and monitor protein targets.</p>
            </div>
          </div>

          <div className="feature-item">
            <CheckCircle className="feature-icon" />
            <div>
              <h3>Dynamic SVG Charts</h3>
              <p>Clean visual weight tracking graphs to capture changes day-over-day.</p>
            </div>
          </div>

          <div className="feature-item">
            <CheckCircle className="feature-icon" />
            <div>
              <h3>AI Fitness Coach</h3>
              <p>An intelligent assistant right inside your dashboard to recommend tips.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Landing Footer */}
      <footer className="landing-footer">
        <p>© 2026 FitMitra. Your Fitness. Your Transformation.</p>
      </footer>

      <style>{`
        .landing-page {
          padding-top: 20px;
          padding-bottom: 60px;
        }

        .landing-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 80px;
          margin-bottom: 40px;
        }

        .landing-header .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.5rem;
          letter-spacing: 0.05em;
        }

        .landing-header .brand-logo {
          color: var(--primary-neon);
          filter: drop-shadow(0 0 8px var(--primary-neon-glow));
        }

        .landing-header .auth-actions {
          display: flex;
          gap: 12px;
        }

        .section-title {
          font-size: 1.8rem;
          font-weight: 700;
          text-align: center;
          margin-bottom: 8px;
        }

        .section-subtitle {
          font-size: 0.95rem;
          color: var(--text-secondary);
          text-align: center;
          margin-bottom: 32px;
        }

        .stats-section {
          margin-bottom: 50px;
        }

        .workout-categories-section {
          margin-bottom: 50px;
        }

        .categories-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        @media (min-width: 640px) {
          .categories-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .categories-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .category-card {
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          height: 100%;
        }

        .cat-badge {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--primary-neon);
          background: var(--primary-neon-dim);
          border: 1px solid rgba(204, 255, 0, 0.2);
          padding: 2px 8px;
          border-radius: 4px;
          margin-bottom: 12px;
          text-transform: uppercase;
        }

        .category-card h3 {
          font-size: 1.15rem;
          margin-bottom: 8px;
        }

        .category-card p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          flex: 1;
          margin-bottom: 16px;
        }

        .card-link {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--secondary-cyan);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .features-section {
          margin-bottom: 50px;
        }

        .features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          margin-top: 32px;
        }

        @media (min-width: 768px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .feature-item {
          display: flex;
          gap: 16px;
          background: rgba(255,255,255,0.01);
          border: 1px solid var(--border-glass);
          padding: 20px;
          border-radius: var(--border-radius-md);
        }

        .feature-icon {
          color: var(--primary-neon);
          flex-shrink: 0;
        }

        .feature-item h3 {
          font-size: 1.05rem;
          margin-bottom: 4px;
        }

        .feature-item p {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .landing-footer {
          text-align: center;
          padding-top: 30px;
          border-top: 1px solid var(--border-glass);
          font-size: 0.85rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}

export default Home;
