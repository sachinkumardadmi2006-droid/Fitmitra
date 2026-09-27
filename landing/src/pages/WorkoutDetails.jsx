import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Dumbbell, Clock, Flame, Play, CheckCircle2, ChevronRight, X, RotateCcw, AlertCircle, ArrowLeft } from 'lucide-react';
import { WORKOUTS, EXERCISES } from '../data/mockData';
import { addWorkoutHistory } from '../utils/db';

function WorkoutDetails() {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState(null);
  
  // Active player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState({}); // { [exIndex_setIdx]: boolean }
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(60);
  const [isWorkoutFinished, setIsWorkoutFinished] = useState(false);

  // Time spent in workout tracker
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Load workout details
  useEffect(() => {
    const found = WORKOUTS.find(w => w.id === workoutId);
    if (found) {
      setWorkout(found);
    }
  }, [workoutId]);

  // Elapsed time counter during workout
  useEffect(() => {
    let timer;
    if (isPlaying && !isWorkoutFinished) {
      timer = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, isWorkoutFinished]);

  // Rest timer countdown
  useEffect(() => {
    let restTimer;
    if (isResting && restTimeLeft > 0) {
      restTimer = setInterval(() => {
        setRestTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isResting && restTimeLeft === 0) {
      setIsResting(false);
    }
    return () => clearInterval(restTimer);
  }, [isResting, restTimeLeft]);

  if (!workout) {
    return (
      <div className="container animate-fade-in" style={{ padding: '40px', textAlign: 'center' }}>
        <AlertCircle size={40} style={{ color: 'var(--accent-rose)', marginBottom: '16px' }} />
        <h2>Workout Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>The workout routine you are looking for does not exist.</p>
        <Link to="/workouts" className="btn btn-primary">Back to Workouts</Link>
      </div>
    );
  }

  // Get full exercise object for the active step
  const getActiveExercise = () => {
    if (!workout) return null;
    const activeExMeta = workout.exercises[currentExIndex];
    const fullExInfo = EXERCISES.find(ex => ex.id === activeExMeta.exerciseId);
    return {
      ...fullExInfo,
      sets: activeExMeta.sets,
      reps: activeExMeta.reps,
      rest: activeExMeta.rest
    };
  };

  const handleStartWorkout = () => {
    setIsPlaying(true);
    setElapsedSeconds(0);
    setCurrentExIndex(0);
    setCompletedSets({});
    setIsResting(false);
    setIsWorkoutFinished(false);
  };

  const handleToggleSetComplete = (setIndex) => {
    const key = `${currentExIndex}_${setIndex}`;
    const newState = !completedSets[key];
    setCompletedSets(prev => ({
      ...prev,
      [key]: newState
    }));

    // Trigger rest timer if checking a set as complete
    if (newState) {
      const activeEx = getActiveExercise();
      setRestTimeLeft(activeEx.rest || 60);
      setIsResting(true);
    }
  };

  const handleSkipRest = () => {
    setIsResting(false);
  };

  const handleNextExercise = () => {
    setIsResting(false);
    if (currentExIndex < workout.exercises.length - 1) {
      setCurrentExIndex(currentExIndex + 1);
    } else {
      setIsWorkoutFinished(true);
    }
  };

  const handlePrevExercise = () => {
    setIsResting(false);
    if (currentExIndex > 0) {
      setCurrentExIndex(currentExIndex - 1);
    }
  };

  const handleSaveWorkout = () => {
    // Record to database
    addWorkoutHistory({
      id: workout.id,
      name: workout.name,
      duration: Math.round(elapsedSeconds / 60) || 1,
      calories: workout.calories
    });

    // Go back to dashboard
    navigate('/dashboard');
  };

  const activeEx = getActiveExercise();

  // 1. ACTIVE PLAYER UI
  if (isPlaying) {
    if (isWorkoutFinished) {
      return (
        <div className="player-overlay animate-fade-in">
          <div className="glass-card success-screen">
            <div className="trophy-ring">
              <CheckCircle2 size={64} className="trophy-icon" />
            </div>
            <h2>Workout Completed!</h2>
            <p className="sub">Sensational effort, you pushed through to the end.</p>

            <div className="finish-stats-grid">
              <div className="f-stat">
                <span className="label">Total Time</span>
                <strong className="val">{Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s</strong>
              </div>
              <div className="f-stat">
                <span className="label">Est. Burned</span>
                <strong className="val">{workout.calories} Kcal</strong>
              </div>
              <div className="f-stat">
                <span className="label">Exercises</span>
                <strong className="val">{workout.exercises.length}</strong>
              </div>
            </div>

            <div className="success-actions">
              <button onClick={handleSaveWorkout} className="btn btn-primary btn-block">SAVE PROGRESS & FINISH</button>
              <button onClick={() => setIsPlaying(false)} className="btn btn-secondary btn-block">Discard Workout</button>
            </div>
          </div>

          <style>{`
            .player-overlay {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
              background-color: var(--bg-dark-base);
            }
            .success-screen {
              max-width: 440px;
              width: 100%;
              text-align: center;
              padding: 40px 24px;
            }
            .trophy-ring {
              width: 100px;
              height: 100px;
              border-radius: 50%;
              background: var(--primary-neon-dim);
              border: 1px solid rgba(204, 255, 0, 0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 20px;
            }
            .trophy-icon {
              color: var(--primary-neon);
              filter: drop-shadow(0 0 10px var(--primary-neon-glow));
            }
            .success-screen h2 {
              font-size: 1.8rem;
              margin-bottom: 6px;
              color: var(--primary-neon);
            }
            .success-screen .sub {
              font-size: 0.9rem;
              color: var(--text-secondary);
              margin-bottom: 30px;
            }
            .finish-stats-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;
              margin-bottom: 32px;
              border: 1px solid var(--border-glass);
              border-radius: var(--border-radius-md);
              padding: 16px;
              background: rgba(255,255,255,0.01);
            }
            .f-stat {
              display: flex;
              flex-direction: column;
              gap: 4px;
            }
            .f-stat .label {
              font-size: 0.75rem;
              color: var(--text-muted);
            }
            .f-stat .val {
              font-family: var(--font-heading);
              font-weight: 700;
              font-size: 1.1rem;
            }
            .success-actions {
              display: flex;
              flex-direction: column;
              gap: 12px;
            }
          `}</style>
        </div>
      );
    }

    return (
      <div className="player-layout animate-fade-in">
        {/* Header toolbar */}
        <div className="player-header">
          <button className="exit-btn" onClick={() => { if(confirm("Quit this active workout? Progress will not be saved.")) setIsPlaying(false); }}>
            <X size={20} /> Exit Player
          </button>
          <div className="workout-timer">
            <Clock size={16} />
            <span>{Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>

        {/* Active Exercise Card */}
        <div className="player-grid">
          <div className="glass-card active-ex-card">
            <span className="ex-step">Exercise {currentExIndex + 1} of {workout.exercises.length}</span>
            <h2 className="ex-name">{activeEx?.name}</h2>
            <p className="ex-muscle">{activeEx?.targetMuscle} • {activeEx?.equipment}</p>

            {/* Video preview */}
            {activeEx?.videoUrl ? (
              <div className="player-exercise-video-container" style={{ width: '100%', height: '240px', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px', background: '#000' }}>
                <video 
                  src={activeEx.videoUrl} 
                  controls 
                  playsInline 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ) : (
              <div className="player-exercise-image">
                <div className="overlay-indicator">
                  <Play size={40} style={{ color: 'var(--primary-neon)' }} />
                  <span>Form Demonstration Video</span>
                </div>
              </div>
            )}

            {/* instructions */}
            <div className="ex-player-instructions">
              <h4>Execution Tip</h4>
              <p>{activeEx?.instructions?.[0] || 'Keep back straight and push through heels.'}</p>
            </div>
          </div>

          {/* Sets Tracker & Rest */}
          <div className="player-side-controls">
            {/* Rest Timer Panel */}
            {isResting ? (
              <div className="glass-card rest-timer-card glow-cyan animate-fade-in">
                <h3>Rest Period</h3>
                <p>Catch your breath. Inhale deeply.</p>
                <div className="player-timer-box">
                  <span className="player-timer-val">{restTimeLeft}s</span>
                </div>
                <button onClick={handleSkipRest} className="btn btn-secondary btn-block">Skip Rest</button>
              </div>
            ) : (
              <div className="glass-card sets-tracker-card">
                <h3>Track Your Sets</h3>
                <p className="sub">Check off each completed set to proceed.</p>
                
                <div className="sets-check-list">
                  {Array.from({ length: activeEx?.sets || 4 }).map((_, idx) => {
                    const isSetDone = completedSets[`${currentExIndex}_${idx}`];
                    return (
                      <div 
                        key={idx} 
                        className={`set-check-row ${isSetDone ? 'set-done' : ''}`}
                        onClick={() => handleToggleSetComplete(idx)}
                      >
                        <span className="set-num">Set {idx + 1}</span>
                        <span className="set-details">{activeEx?.reps} Reps</span>
                        <div className="check-box">
                          {isSetDone && <div className="checked-inner" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Main Navigation controls */}
            <div className="player-controls-row">
              <button 
                onClick={handlePrevExercise} 
                disabled={currentExIndex === 0}
                className="btn btn-secondary"
              >
                Previous
              </button>
              <button 
                onClick={handleNextExercise} 
                className="btn btn-primary"
              >
                {currentExIndex === workout.exercises.length - 1 ? 'Finish Workout' : 'Next Exercise'} <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <style>{`
          .player-layout {
            padding: 20px;
            max-width: 1000px;
            margin: 0 auto;
          }
          .player-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
          }
          .exit-btn {
            background: transparent;
            border: none;
            color: var(--text-muted);
            font-size: 0.9rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .exit-btn:hover {
            color: var(--accent-rose);
          }
          .workout-timer {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(255,255,255,0.03);
            border: 1px solid var(--border-glass);
            padding: 8px 16px;
            border-radius: var(--border-radius-md);
            font-family: var(--font-heading);
            font-weight: 700;
            color: var(--primary-neon);
          }
          .player-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 24px;
          }
          @media (min-width: 768px) {
            .player-grid {
              grid-template-columns: 3fr 2fr;
            }
          }
          .ex-step {
            font-size: 0.75rem;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-weight: 700;
          }
          .ex-name {
            font-size: 1.8rem;
            margin-top: 4px;
            margin-bottom: 4px;
          }
          .ex-muscle {
            font-size: 0.85rem;
            color: var(--text-secondary);
            margin-bottom: 20px;
          }
          .ex-player-instructions {
            text-align: left;
            border-top: 1px solid var(--border-glass);
            padding-top: 16px;
          }
          .ex-player-instructions h4 {
            font-size: 0.9rem;
            color: var(--text-primary);
            margin-bottom: 6px;
          }
          .ex-player-instructions p {
            font-size: 0.85rem;
            color: var(--text-secondary);
            line-height: 1.4;
          }

          /* Sets Check list */
          .sets-check-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 16px;
          }
          .set-check-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(255,255,255,0.02);
            border: 1px solid var(--border-glass);
            padding: 12px 16px;
            border-radius: var(--border-radius-md);
            cursor: pointer;
            transition: all 0.2s;
          }
          .set-check-row:hover {
            background: rgba(255,255,255,0.05);
            border-color: var(--border-glass-bright);
          }
          .set-check-row.set-done {
            border-color: rgba(204, 255, 0, 0.4);
            background: var(--primary-neon-dim);
          }
          .set-num {
            font-weight: 600;
            font-size: 0.9rem;
          }
          .set-check-row.set-done .set-num {
            color: var(--primary-neon);
          }
          .set-details {
            font-size: 0.85rem;
            color: var(--text-secondary);
          }
          .check-box {
            width: 22px;
            height: 22px;
            border-radius: 6px;
            border: 2px solid var(--text-muted);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .set-check-row.set-done .check-box {
            border-color: var(--primary-neon);
          }
          .checked-inner {
            width: 12px;
            height: 12px;
            border-radius: 3px;
            background-color: var(--primary-neon);
            box-shadow: 0 0 6px var(--primary-neon);
          }
          .player-controls-row {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 12px;
            margin-top: 20px;
          }
          .rest-timer-card {
            border-color: var(--secondary-cyan);
            background: linear-gradient(135deg, rgba(0, 240, 255, 0.03) 0%, rgba(13, 18, 34, 0.7) 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
          }
        `}</style>
      </div>
    );
  }

  // 2. STANDARD ROUTINE DETAILS PAGE
  return (
    <div className="workout-details-page animate-fade-in">
      <div className="details-header-nav" style={{ marginBottom: '20px' }}>
        <Link to="/workouts" className="back-link">
          <ArrowLeft size={16} /> Back to Workouts
        </Link>
      </div>

      <div className="workout-details-summary glass-card" style={{ marginBottom: '30px' }}>
        <div className="summary-meta">
          <span className="badge badge-primary">{workout.difficulty}</span>
          <span className="category">{workout.category}</span>
        </div>
        <h1 className="workout-name">{workout.name}</h1>
        <p className="workout-desc-large">{workout.tagline}</p>

        <div className="workout-metrics-flex">
          <div className="metric">
            <Clock size={20} className="metric-icon" />
            <div>
              <span>Duration</span>
              <strong>{workout.duration} Mins</strong>
            </div>
          </div>
          <div className="metric">
            <Flame size={20} className="metric-icon" />
            <div>
              <span>Calorie Burn</span>
              <strong>{workout.calories} Kcal</strong>
            </div>
          </div>
          <div className="metric">
            <Dumbbell size={20} className="metric-icon" />
            <div>
              <span>Exercises</span>
              <strong>{workout.exercises.length} Exercises</strong>
            </div>
          </div>
        </div>

        <button onClick={handleStartWorkout} className="btn btn-primary btn-block glow-primary">
          <Play size={18} fill="#000" /> START ACTIVE WORKOUT
        </button>
      </div>

      <div className="exercises-list-block">
        <h2 className="block-title">Workout Routine ({workout.exercises.length} Exercises)</h2>
        <div className="exercises-timeline">
          {workout.exercises.map((meta, index) => {
            const exInfo = EXERCISES.find(ex => ex.id === meta.exerciseId);
            return (
              <div key={meta.exerciseId} className="exercise-timeline-row glass-card">
                <div className="timeline-badge">{index + 1}</div>
                <div className="timeline-info">
                  <h3>{exInfo?.name}</h3>
                  <p className="sub">{exInfo?.targetMuscle} • {exInfo?.equipment}</p>
                </div>
                <div className="timeline-params">
                  <div className="param">
                    <span className="label">Sets</span>
                    <strong>{meta.sets}</strong>
                  </div>
                  <div className="param">
                    <span className="label">Reps</span>
                    <strong>{meta.reps}</strong>
                  </div>
                  <div className="param">
                    <span className="label">Rest</span>
                    <strong>{meta.rest}s</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
          font-size: 0.9rem;
          font-weight: 500;
          transition: color 0.2s;
        }
        .back-link:hover {
          color: var(--primary-neon);
        }
        .workout-details-summary {
          text-align: left;
        }
        .summary-meta {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 12px;
        }
        .summary-meta .category {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .workout-name {
          font-size: 2.2rem;
          line-height: 1.1;
          margin-bottom: 8px;
        }
        .workout-desc-large {
          font-size: 1.05rem;
          color: var(--text-secondary);
          margin-bottom: 24px;
        }
        .workout-metrics-flex {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          margin-bottom: 28px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--border-glass);
        }
        .workout-metrics-flex .metric {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 140px;
        }
        .metric-icon {
          color: var(--secondary-cyan);
        }
        .workout-metrics-flex span {
          display: block;
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .workout-metrics-flex strong {
          font-family: var(--font-heading);
          font-size: 1.15rem;
        }
        .exercises-list-block {
          text-align: left;
        }
        .block-title {
          font-size: 1.4rem;
          margin-bottom: 20px;
        }
        .exercises-timeline {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .exercise-timeline-row {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 16px 20px;
          position: relative;
        }
        @media (max-width: 640px) {
          .exercise-timeline-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .timeline-params {
            width: 100%;
            justify-content: space-between;
          }
        }
        .timeline-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border-glass-bright);
          color: var(--text-secondary);
          font-weight: 700;
          font-family: var(--font-heading);
        }
        .timeline-info {
          flex: 1;
        }
        .timeline-info h3 {
          font-size: 1.1rem;
          margin-bottom: 2px;
        }
        .timeline-info .sub {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .timeline-params {
          display: flex;
          gap: 16px;
        }
        .timeline-params .param {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 50px;
        }
        .timeline-params .label {
          font-size: 0.7rem;
          color: var(--text-muted);
        }
        .timeline-params strong {
          font-family: var(--font-heading);
          font-size: 1.05rem;
          color: var(--secondary-cyan);
        }
      `}</style>
    </div>
  );
}

export default WorkoutDetails;
