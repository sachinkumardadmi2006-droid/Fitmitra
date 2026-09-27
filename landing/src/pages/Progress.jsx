import React, { useState, useEffect } from 'react';
import { History, Plus, AlertCircle } from 'lucide-react';
import { getUser, getWeightHistory, getWorkoutHistory, addWeightLog } from '../utils/db';

function Progress() {
  const [user, setUser] = useState(null);
  const [weightLogs, setWeightLogs] = useState([]);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [inputWeight, setInputWeight] = useState('');

  const loadProgressData = () => {
    setUser(getUser());
    setWeightLogs(getWeightHistory());
    setWorkoutLogs(getWorkoutHistory());
  };

  useEffect(() => {
    loadProgressData();
    window.addEventListener('fitmitra_db_update', loadProgressData);
    return () => window.removeEventListener('fitmitra_db_update', loadProgressData);
  }, []);

  const handleAddWeight = (e) => {
    e.preventDefault();
    if (!inputWeight) return;
    addWeightLog(inputWeight);
    setInputWeight('');
  };

  if (!user) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading progress...</div>;

  // Weight calculations
  const starting = user.startingWeight || 78;
  const current = user.currentWeight || 72;
  const goal = user.goalWeight || 68;
  
  // Calculate percentage of weight goal progress
  // E.g. lost 6kg out of 10kg goal = 60%
  let weightProgressPct = 0;
  const totalChangeNeeded = Math.abs(starting - goal);
  const totalChangeAchieved = Math.abs(starting - current);
  if (totalChangeNeeded > 0) {
    weightProgressPct = Math.min(100, Math.round((totalChangeAchieved / totalChangeNeeded) * 100));
  }

  // Render SVG Chart Coordinates
  const renderSvgChart = () => {
    if (weightLogs.length < 2) {
      return (
        <div className="chart-fallback">
          <AlertCircle size={28} />
          <p>Please log your weight on multiple days to populate the chart.</p>
        </div>
      );
    }

    const width = 600;
    const height = 200;
    const padding = 30;

    // Find min and max weight
    const weights = weightLogs.map(l => l.weight);
    const minW = Math.min(...weights) - 1;
    const maxW = Math.max(...weights) + 1;
    const wRange = maxW - minW;

    // Map coordinates
    const points = weightLogs.map((log, index) => {
      const x = padding + (index / (weightLogs.length - 1)) * (width - padding * 2);
      const y = height - padding - ((log.weight - minW) / wRange) * (height - padding * 2);
      return { x, y, weight: log.weight, date: log.date };
    });

    // Create path d string
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    
    // Create fill path d string (closes the bottom)
    const fillPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return (
      <div className="chart-container">
        <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary-neon)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--primary-neon)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} className="chart-grid-line" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} className="chart-grid-line" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="chart-grid-line" />

          {/* Gradient area */}
          <path d={fillPath} className="chart-area-path" />

          {/* Core path line */}
          <path d={linePath} className="chart-line-path" />

          {/* Node points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="5" className="chart-point" />
              {/* Tooltip labels */}
              <text x={p.x} y={p.y - 12} textAnchor="middle" fill="var(--primary-neon)" fontSize="10" fontWeight="bold">
                {p.weight}
              </text>
              {/* Date labels on X axis */}
              <text x={p.x} y={height - 10} textAnchor="middle" className="chart-axis-label">
                {p.date.split('-')[2]}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="progress-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title text-gradient">Your Progress</h1>
          <p className="page-subtitle">Track body weights, streaks, and review your historical workouts</p>
        </div>
      </div>

      {/* Weight Summary widget */}
      <div className="glass-card weight-progress-panel" style={{ marginBottom: '30px' }}>
        <h2 className="widget-title">Weight Transformation Goal</h2>
        
        <div className="transformation-numbers">
          <div className="num-item">
            <span className="label">Starting</span>
            <strong>{starting} KG</strong>
          </div>
          <div className="arrow">➔</div>
          <div className="num-item">
            <span className="label">Current</span>
            <strong>{current} KG</strong>
          </div>
          <div className="arrow">➔</div>
          <div className="num-item">
            <span className="label">Target Goal</span>
            <strong>{goal} KG</strong>
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-bar-wrapper">
          <div className="bar-labels">
            <span>Goal Progress</span>
            <span>{weightProgressPct}% Achieved</span>
          </div>
          <div className="bar-bg">
            <div className="bar-fill" style={{ width: `${weightProgressPct}%` }}></div>
          </div>
        </div>

        {/* Dynamic Chart */}
        <div className="chart-outer-wrap">
          <h3>Weight Tracker Line Graph</h3>
          {renderSvgChart()}
        </div>
      </div>

      <div className="progress-double-grid">
        {/* Left Column: Log Weight & History list */}
        <div className="weight-log-column">
          <div className="glass-card log-weight-card" style={{ marginBottom: '24px' }}>
            <h3>Log Today's Weight</h3>
            <form onSubmit={handleAddWeight} className="inline-log-form">
              <input 
                type="number" 
                step="0.1" 
                className="form-control" 
                placeholder="E.g. 71.8"
                value={inputWeight}
                onChange={(e) => setInputWeight(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                <Plus size={16} /> Log Entry
              </button>
            </form>
          </div>

          <div className="glass-card history-card">
            <h3>Weight History Logs</h3>
            <div className="history-table-wrapper">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Weight</th>
                    <th>Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {weightLogs.slice().reverse().map((log, idx, arr) => {
                    const nextLog = arr[idx + 1]; // because reversed, nextLog is chronological previous
                    let diffText = '-';
                    let diffClass = '';
                    if (nextLog) {
                      const diff = log.weight - nextLog.weight;
                      if (diff > 0) {
                        diffText = `+${diff.toFixed(1)} KG`;
                        diffClass = 'diff-up';
                      } else if (diff < 0) {
                        diffText = `${diff.toFixed(1)} KG`;
                        diffClass = 'diff-down';
                      } else {
                        diffText = '0.0 KG';
                      }
                    }
                    return (
                      <tr key={idx}>
                        <td>{log.date}</td>
                        <td className="w-val">{log.weight} KG</td>
                        <td className={diffClass}>{diffText}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Workout history checklist */}
        <div className="workout-history-column">
          <div className="glass-card workout-history-card">
            <div className="card-header-with-icon">
              <History size={20} className="icon-cyan" />
              <h3>Completed Workouts ({workoutLogs.length})</h3>
            </div>
            
            <div className="workout-history-list">
              {workoutLogs.slice().reverse().map((w, idx) => (
                <div key={idx} className="workout-history-row">
                  <div className="check-badge">✓</div>
                  <div className="w-info">
                    <h4>{w.name}</h4>
                    <p className="w-date">{w.date} • {w.duration} mins</p>
                  </div>
                  <span className="cal-burned">+{w.calories} Kcal</span>
                </div>
              ))}
              {workoutLogs.length === 0 && (
                <div className="empty-history">
                  <AlertCircle size={28} />
                  <p>No workouts completed yet. Open the Workouts tab to get started!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .widget-title {
          font-size: 1.25rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 20px;
        }

        .transformation-numbers {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin-bottom: 24px;
        }

        @media (max-width: 480px) {
          .transformation-numbers {
            flex-wrap: wrap;
            gap: 12px;
          }
          .arrow { display: none; }
        }

        .num-item {
          text-align: center;
        }

        .num-item .label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          display: block;
          margin-bottom: 4px;
        }

        .num-item strong {
          font-family: var(--font-heading);
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .arrow {
          font-size: 1.2rem;
          color: var(--text-muted);
        }

        .progress-bar-wrapper {
          margin-bottom: 30px;
        }

        .bar-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          margin-bottom: 6px;
          color: var(--text-secondary);
        }

        .bar-bg {
          width: 100%;
          height: 10px;
          background: rgba(255,255,255,0.05);
          border-radius: 999px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--secondary-cyan), var(--primary-neon));
          border-radius: 999px;
        }

        .chart-outer-wrap {
          border-top: 1px solid var(--border-glass);
          padding-top: 20px;
        }

        .chart-outer-wrap h3 {
          font-size: 1rem;
          margin-bottom: 16px;
          color: var(--text-secondary);
        }

        .chart-fallback {
          height: 150px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: var(--text-muted);
          font-size: 0.85rem;
          background: rgba(255,255,255,0.01);
          border-radius: var(--border-radius-md);
          border: 1px dashed var(--border-glass);
        }

        .progress-double-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        @media (min-width: 1024px) {
          .progress-double-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .inline-log-form {
          display: flex;
          gap: 12px;
          margin-top: 12px;
        }

        .history-table-wrapper {
          max-height: 250px;
          overflow-y: auto;
          margin-top: 12px;
        }

        .logs-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.85rem;
        }

        .logs-table th {
          color: var(--text-muted);
          font-weight: 600;
          padding: 8px 12px;
          border-bottom: 1px solid var(--border-glass);
        }

        .logs-table td {
          padding: 10px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.02);
        }

        .logs-table .w-val {
          font-weight: 600;
          color: var(--text-primary);
        }

        .diff-up {
          color: var(--accent-rose);
          font-weight: 500;
        }

        .diff-down {
          color: #10b981;
          font-weight: 500;
        }

        /* Workout History timeline styling */
        .card-header-with-icon {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }

        .workout-history-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 420px;
          overflow-y: auto;
        }

        .workout-history-row {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.01);
          border: 1px solid var(--border-glass);
          padding: 12px;
          border-radius: var(--border-radius-md);
        }

        .check-badge {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--primary-neon-dim);
          border: 1px solid rgba(204, 255, 0, 0.3);
          color: var(--primary-neon);
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
        }

        .w-info {
          flex: 1;
          text-align: left;
        }

        .w-info h4 {
          font-size: 0.95rem;
          margin-bottom: 2px;
        }

        .w-date {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .cal-burned {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 0.9rem;
          color: var(--secondary-cyan);
        }

        .empty-history {
          text-align: center;
          padding: 40px;
          color: var(--text-muted);
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
}

export default Progress;
