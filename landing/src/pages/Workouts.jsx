import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Dumbbell, Clock, Flame, ChevronRight, Play, BookOpen, AlertTriangle, Lightbulb, Lock, Sparkles, CheckCircle2, ShieldCheck, Crown } from 'lucide-react';
import { WORKOUTS, EXERCISES } from '../data/mockData';
import { getUser, saveUser } from '../utils/db';

function Workouts() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeDifficulty, setActiveDifficulty] = useState('All');
  
  // User state for premium check
  const [user, setUser] = useState(null);

  // Exercise details modal state
  const [selectedExercise, setSelectedExercise] = useState(null);

  // Upgrade Plan Modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeItemName, setUpgradeItemName] = useState('');

  const categories = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Abs'];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  // Sync user state from storage / DB
  const loadUser = () => {
    const u = getUser();
    setUser(u);
  };

  useEffect(() => {
    loadUser();
    window.addEventListener('storage', loadUser);
    return () => window.removeEventListener('storage', loadUser);
  }, []);

  // Helper to check if difficulty tier is locked for current user
  const isLocked = (difficulty) => {
    if (user?.isPremium) return false;
    return difficulty === 'Intermediate' || difficulty === 'Advanced';
  };

  // Filter Workouts based on category & difficulty & search
  const filteredWorkouts = WORKOUTS.filter(w => {
    const matchesCategory = activeCategory === 'All' || w.category === activeCategory;
    const matchesDifficulty = activeDifficulty === 'All' || w.difficulty === activeDifficulty;
    const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          w.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  // Filter Exercises for the library based on category & difficulty & search
  const filteredExercises = EXERCISES.filter(ex => {
    const matchesCategory = activeCategory === 'All' || ex.category === activeCategory;
    const matchesDifficulty = activeDifficulty === 'All' || ex.difficulty === activeDifficulty;
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ex.targetMuscle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  const handleWorkoutClick = (w) => {
    if (isLocked(w.difficulty)) {
      setUpgradeItemName(w.name);
      setShowUpgradeModal(true);
    } else {
      navigate(`/workouts/${w.id}`);
    }
  };

  const handleExerciseClick = (ex) => {
    if (isLocked(ex.difficulty)) {
      setUpgradeItemName(ex.name);
      setShowUpgradeModal(true);
    } else {
      setSelectedExercise(ex);
    }
  };

  const handleUpgradeNow = async () => {
    const updatedUser = { ...user, isPremium: true };
    await saveUser(updatedUser);
    setUser(updatedUser);
    setShowUpgradeModal(false);
  };

  return (
    <div className="workouts-page animate-fade-in" style={{ paddingBottom: '60px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title text-gradient">Workouts & Library</h1>
          <p className="page-subtitle">Choose a pre-made routine or inspect individual exercises</p>
        </div>
      </div>

      {/* Search & Categories Bar */}
      <div className="search-filter-section glass-card" style={{ marginBottom: '30px', padding: '16px' }}>
        <div className="search-bar-wrapper">
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            className="form-control search-input" 
            placeholder="Search workouts or exercises (e.g. Bench, Squats, Core)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="category-pills" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="difficulty-pills" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingLeft: '4px' }}>
          {difficulties.map(diff => (
            <button 
              key={diff} 
              className={`pill pill-diff ${activeDifficulty === diff ? 'active' : ''}`}
              onClick={() => setActiveDifficulty(diff)}
              style={{
                fontSize: '0.8rem',
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid var(--border-glass)',
                background: activeDifficulty === diff ? 'var(--secondary-cyan)' : 'transparent',
                color: activeDifficulty === diff ? '#000' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontWeight: '600'
              }}
            >
              {diff} {isLocked(diff) && '🔒'}
            </button>
          ))}
        </div>
      </div>

      {/* Recommended Workouts Section */}
      <section className="section-block" style={{ marginBottom: '40px' }}>
        <h2 className="section-title-left">Training Routines ({filteredWorkouts.length})</h2>
        <div className="grid-cols-3">
          {filteredWorkouts.map(w => {
            const locked = isLocked(w.difficulty);
            return (
              <div 
                key={w.id} 
                className={`glass-card glass-card-hover workout-card ${locked ? 'workout-card-locked' : ''}`}
                onClick={() => handleWorkoutClick(w)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-header-info">
                  <span className={`badge ${locked ? 'badge-locked' : 'badge-primary'}`}>
                    {w.difficulty} {locked && <Lock size={12} style={{ marginLeft: '4px' }} />}
                  </span>
                  <span className="category-tag">{w.category}</span>
                </div>
                <h3 className="card-workout-name">{w.name}</h3>
                <p className="card-workout-desc">{w.tagline}</p>
                
                <div className="workout-meta-grid">
                  <div className="meta-item">
                    <Clock size={16} />
                    <span>{w.duration} Min</span>
                  </div>
                  <div className="meta-item">
                    <Flame size={16} />
                    <span>{w.calories} Kcal</span>
                  </div>
                  <div className="meta-item">
                    <Dumbbell size={16} />
                    <span>{w.exercises.length} Exercises</span>
                  </div>
                </div>

                <div className="workout-card-footer" style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', marginTop: '16px' }}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWorkoutClick(w);
                    }} 
                    className={`btn ${locked ? 'btn-upgrade-locked' : 'btn-outline-neon'} btn-sm btn-block`}
                  >
                    {locked ? (
                      <>Unlock with FitMitra Pro <Lock size={14} /></>
                    ) : (
                      <>View Details & Start <ChevronRight size={16} /></>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
          {filteredWorkouts.length === 0 && (
            <p className="no-results">No workouts match your criteria.</p>
          )}
        </div>
      </section>

      {/* Exercise Library Section */}
      <section className="section-block">
        <h2 className="section-title-left">Exercise Library ({filteredExercises.length})</h2>
        <p className="section-desc">Click any exercise to learn the proper form, setup instructions, and tips.</p>

        <div className="exercises-list-grid">
          {filteredExercises.map(ex => {
            const locked = isLocked(ex.difficulty);
            return (
              <div 
                key={ex.id} 
                className={`glass-card glass-card-hover exercise-row-card ${locked ? 'ex-row-locked' : ''}`}
                onClick={() => handleExerciseClick(ex)}
              >
                <div className="ex-info">
                  <h3>{ex.name}</h3>
                  <p>{ex.targetMuscle} • <strong>{ex.equipment}</strong></p>
                </div>
                <div className="ex-action">
                  <span className={`badge ${locked ? 'badge-locked' : 'badge-cyan'}`}>
                    {ex.difficulty} {locked && <Lock size={12} style={{ marginLeft: '4px' }} />}
                  </span>
                  {locked ? (
                    <Lock size={18} className="library-icon locked-icon" style={{ color: 'var(--accent-orange)' }} />
                  ) : (
                    <BookOpen size={18} className="library-icon" />
                  )}
                </div>
              </div>
            );
          })}
          {filteredExercises.length === 0 && (
            <p className="no-results">No exercises match your criteria.</p>
          )}
        </div>
      </section>

      {/* Exercise Details Modal */}
      {selectedExercise && (
        <div className="modal-backdrop" onClick={() => setSelectedExercise(null)}>
          <div className="modal-content glass-card exercise-modal" onClick={e => e.stopPropagation()}>
            <div className="ex-modal-header">
              <div>
                <h2>{selectedExercise.name}</h2>
                <p className="sub">{selectedExercise.targetMuscle} • {selectedExercise.equipment}</p>
              </div>
              <button className="close-btn" onClick={() => setSelectedExercise(null)}>×</button>
            </div>

            <div className="ex-modal-body">
              {selectedExercise.videoUrl ? (
                <div className="ex-media-video-container" style={{ width: '100%', height: '220px', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px', background: '#000' }}>
                  <video 
                    src={selectedExercise.videoUrl} 
                    controls 
                    playsInline 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ) : (
                <div className="ex-media-placeholder">
                  <div className="overlay-indicator">
                    <Play size={32} />
                    <span>Interactive Guide Video</span>
                  </div>
                </div>
              )}

              <div className="ex-modal-stats">
                <div className="stat">
                  <span>Sets</span>
                  <strong>{selectedExercise.defaultSets}</strong>
                </div>
                <div className="stat">
                  <span>Reps</span>
                  <strong>{selectedExercise.defaultReps}</strong>
                </div>
                <div className="stat">
                  <span>Rest</span>
                  <strong>{selectedExercise.defaultRest}s</strong>
                </div>
                <div className="stat">
                  <span>Level</span>
                  <strong>{selectedExercise.difficulty}</strong>
                </div>
              </div>

              <div className="instructions-box">
                <h3>Instructions</h3>
                <ol>
                  {selectedExercise.instructions.map((inst, i) => (
                    <li key={i}>{inst}</li>
                  ))}
                </ol>
              </div>

              <div className="tips-mistakes-flex">
                <div className="notes-box tip-border">
                  <h4 className="flex-title"><Lightbulb size={16} className="tip-color" /> Pro Tips</h4>
                  <ul>
                    {selectedExercise.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                  </ul>
                </div>

                <div className="notes-box mistake-border">
                  <h4 className="flex-title"><AlertTriangle size={16} className="mistake-color" /> Avoid Mistakes</h4>
                  <ul>
                    {selectedExercise.mistakes.map((mistake, i) => <li key={i}>{mistake}</li>)}
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="ex-modal-footer">
              <button className="btn btn-secondary btn-block" onClick={() => setSelectedExercise(null)}>Close Guide</button>
            </div>
          </div>
        </div>
      )}

      {/* UPGRADE YOUR PLAN MODAL */}
      {showUpgradeModal && (
        <div className="modal-backdrop" onClick={() => setShowUpgradeModal(false)}>
          <div className="modal-content glass-card upgrade-plan-modal" onClick={e => e.stopPropagation()}>
            <div className="upgrade-header text-center">
              <div className="crown-badge-wrapper">
                <Crown size={32} className="crown-icon" />
              </div>
              <h2 className="upgrade-title text-gradient">Upgrade Your Plan</h2>
              <p className="upgrade-subtitle">
                Unlock Intermediate & Advanced Workouts
              </p>
            </div>

            <div className="upgrade-body">
              <div className="upgrade-highlight-box">
                <p>
                  <strong>{upgradeItemName ? `"${upgradeItemName}"` : 'This routine'}</strong> requires a FitMitra Pro subscription.
                </p>
              </div>

              <p className="upgrade-desc">
                Intermediate & Advanced routines are designed for serious muscle gain and fat loss. Upgrade your account today to unlock full access across all devices!
              </p>

              <div className="perks-list">
                <div className="perk-item">
                  <CheckCircle2 size={18} className="perk-check" />
                  <span>Full access to <strong>40+ Intermediate & Advanced Workouts</strong></span>
                </div>
                <div className="perk-item">
                  <CheckCircle2 size={18} className="perk-check" />
                  <span><strong>70+ Exercise Library</strong> with HD Video Form Guides</span>
                </div>
                <div className="perk-item">
                  <CheckCircle2 size={18} className="perk-check" />
                  <span><strong>Custom Macro Goals</strong> & Specialized Nutrition Recipes</span>
                </div>
              </div>
            </div>

            <div className="upgrade-footer" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="btn btn-primary btn-block glow-neon" onClick={handleUpgradeNow}>
                <Sparkles size={18} style={{ marginRight: '8px' }} /> UPGRADE TO FITMITRA PRO NOW
              </button>
              <button className="btn btn-secondary btn-block" onClick={() => setShowUpgradeModal(false)}>
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .section-title-left {
          font-size: 1.4rem;
          margin-bottom: 8px;
          text-align: left;
        }

        .section-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 16px;
          text-align: left;
        }

        .search-bar-wrapper {
          position: relative;
          margin-bottom: 16px;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .search-input {
          padding-left: 44px;
        }

        .category-pills {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .pill {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-glass);
          color: var(--text-secondary);
          padding: 8px 16px;
          border-radius: 9999px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .pill:hover {
          color: var(--text-primary);
          border-color: var(--border-glass-bright);
        }

        .pill.active {
          background: var(--primary-neon);
          color: #000;
          font-weight: 600;
          border-color: var(--primary-neon);
          box-shadow: 0 4px 12px var(--primary-neon-glow);
        }

        /* Locked Badges & Cards */
        .badge-locked {
          background: rgba(249, 115, 22, 0.15) !important;
          color: #f97316 !important;
          border: 1px solid rgba(249, 115, 22, 0.3) !important;
          display: inline-flex;
          align-items: center;
        }

        .workout-card-locked {
          border-color: rgba(249, 115, 22, 0.25);
        }

        .btn-upgrade-locked {
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: #fff;
          font-weight: 700;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .btn-upgrade-locked:hover {
          box-shadow: 0 0 15px rgba(249, 115, 22, 0.4);
        }

        /* Workout Cards */
        .card-header-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .category-tag {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
        }

        .card-workout-name {
          font-size: 1.2rem;
          margin-bottom: 6px;
          text-align: left;
        }

        .card-workout-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          height: 40px;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 16px;
          text-align: left;
          line-height: 1.3;
        }

        .workout-meta-grid {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .no-results {
          grid-column: 1 / -1;
          padding: 40px 0;
          color: var(--text-muted);
          font-size: 0.9rem;
          text-align: center;
        }

        /* Exercise Library list */
        .exercises-list-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        @media (min-width: 768px) {
          .exercises-list-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .exercise-row-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          cursor: pointer;
        }

        .ex-info {
          text-align: left;
        }

        .ex-info h3 {
          font-size: 1rem;
          margin-bottom: 4px;
        }

        .ex-info p {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .ex-action {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .library-icon {
          color: var(--text-muted);
        }

        .exercise-row-card:hover .library-icon {
          color: var(--secondary-cyan);
        }

        /* UPGRADE MODAL STYLING */
        .upgrade-plan-modal {
          max-width: 480px;
          width: 100%;
          padding: 28px;
          text-align: center;
          border: 1px solid var(--border-glass-bright);
        }

        .crown-badge-wrapper {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: rgba(249, 115, 22, 0.15);
          border: 1px solid rgba(249, 115, 22, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .crown-icon {
          color: #f97316;
        }

        .upgrade-title {
          font-size: 1.8rem;
          margin-bottom: 4px;
        }

        .upgrade-subtitle {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-bottom: 20px;
        }

        .upgrade-highlight-box {
          background: rgba(255, 255, 255, 0.03);
          border: 1px dashed var(--border-glass-bright);
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 0.875rem;
          color: var(--text-primary);
        }

        .upgrade-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.4;
          margin-bottom: 20px;
        }

        .perks-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
          background: rgba(0, 0, 0, 0.25);
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 24px;
          border: 1px solid rgba(255, 255, 255, 0.04);
        }

        .perk-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.85rem;
          color: var(--text-primary);
        }

        .perk-check {
          color: var(--primary-neon);
          flex-shrink: 0;
        }

        .glow-neon {
          box-shadow: 0 0 20px var(--primary-neon-glow);
        }
      `}</style>
    </div>
  );
}

export default Workouts;
