import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Award, Target, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { getUser, saveUser } from '../utils/db';
import { PROGRAMS } from '../data/mockData';
import { t } from '../utils/i18n';

function Programs() {
  const [user, setUser] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);

  const loadUserData = () => {
    setUser(getUser());
  };

  useEffect(() => {
    loadUserData();
    setSelectedProgram(PROGRAMS[0]); // default to show first
  }, []);

  const handleStartProgram = (programId) => {
    const updatedUser = {
      ...user,
      activeProgramId: programId,
      activeProgramWeek: 1
    };
    saveUser(updatedUser);
    setUser(updatedUser);
  };

  if (!user) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading programs...</div>;

  const lang = user.language || 'en';

  const translateActivity = (act) => {
    if (lang === 'kn') {
      return act
        .replace('Workout: ', 'ವ್ಯಾಯಾಮ: ')
        .replace('Active Recovery: ', 'ಸಕ್ರಿಯ ಚೇತರಿಕೆ: ')
        .replace('Rest Day', 'ವಿಶ್ರಾಂತಿ ದಿನ')
        .replace('Focus', 'ಗಮನ')
        .replace('Routine', 'ಕ್ರಮ')
        .replace('Hypertrophy', 'ಸ್ನಾಯು ಬೆಳೆಸುವಿಕೆ')
        .replace('Cardio', 'ಕಾರ್ಡಿಯೋ')
        .replace('Stretch', 'ಸ್ಟ್ರೆಚ್')
        .replace('Walk', 'ನಡಿಗೆ')
        .replace('Jog', 'ಜಾಗ್');
    }
    return act;
  };

  return (
    <div className="programs-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title text-gradient">{t('fitnessPrograms', lang)}</h1>
          <p className="page-subtitle">{lang === 'kn' ? 'ನಿಮ್ಮ ಆರೋಗ್ಯವನ್ನು ಸುಧಾರಿಸಲು ವಿನ್ಯಾಸಗೊಳಿಸಲಾದ ವಾರಗಳ ವೇಳಾಪಟ್ಟಿ' : 'Structured, multi-week fitness journeys designed to help you transform'}</p>
        </div>
      </div>

      <div className="programs-split-grid">
        {/* Left Column: Programs Selector List */}
        <div className="programs-select-column">
          <h2 className="section-title-left">{t('availablePrograms', lang)}</h2>
          
          <div className="programs-menu-list">
            {PROGRAMS.map((prog) => {
              const isActive = user.activeProgramId === prog.id;
              const isSelected = selectedProgram?.id === prog.id;
              
              return (
                <div 
                  key={prog.id} 
                  className={`glass-card program-menu-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedProgram(prog)}
                >
                  <div className="card-header-flex">
                    <span className="badge badge-primary">{prog.level === 'Beginner' && lang === 'kn' ? 'ಪ್ರಾರಂಭಿಕ' : prog.level === 'Intermediate' && lang === 'kn' ? 'ಮಧ್ಯಂತರ' : prog.level}</span>
                    {isActive && (
                      <span className="badge badge-cyan glow-cyan">{t('activeProgram', lang)}</span>
                    )}
                  </div>
                  <h3>{lang === 'kn' && prog.nameKn ? prog.nameKn : prog.name}</h3>
                  <p className="tagline">{lang === 'kn' && prog.taglineKn ? prog.taglineKn : prog.tagline}</p>
                  
                  <div className="prog-brief-meta">
                    <span>⏱ {prog.durationWeeks} {t('weeks', lang)}</span>
                    <span>🎯 {lang === 'kn' && prog.goalKn ? prog.goalKn : prog.goal}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Program Explorer */}
        <div className="program-explorer-column">
          {selectedProgram ? (
            <div className="glass-card program-explorer-card animate-fade-in">
              <div className="explorer-header">
                <div>
                  <span className="badge badge-primary">{selectedProgram.level === 'Beginner' && lang === 'kn' ? 'ಪ್ರಾರಂಭಿಕ' : selectedProgram.level === 'Intermediate' && lang === 'kn' ? 'ಮಧ್ಯಂತರ' : selectedProgram.level} {lang === 'kn' ? 'ಕಾರ್ಯಕ್ರಮ' : 'Program'}</span>
                  <h2>{lang === 'kn' && selectedProgram.nameKn ? selectedProgram.nameKn : selectedProgram.name}</h2>
                </div>
                {user.activeProgramId === selectedProgram.id ? (
                  <button className="btn btn-outline-neon" disabled>
                    <CheckCircle2 size={16} /> {t('currentlyTraining', lang)}
                  </button>
                ) : (
                  <button 
                    onClick={() => handleStartProgram(selectedProgram.id)} 
                    className="btn btn-primary"
                  >
                    {t('startThisProgram', lang)}
                  </button>
                )}
              </div>

              <div className="explorer-overview">
                <h3>{t('programOverview', lang)}</h3>
                <p>{lang === 'kn' && selectedProgram.descriptionKn ? selectedProgram.descriptionKn : selectedProgram.description}</p>
                
                <div className="overview-stats-grid">
                  <div className="stat">
                    <span>{lang === 'kn' ? 'ಅವಧಿ' : 'Duration'}</span>
                    <strong>{selectedProgram.durationWeeks} {t('weeks', lang)}</strong>
                  </div>
                  <div className="stat">
                    <span>{lang === 'kn' ? 'ಉದ್ದೇಶ / ಗುರಿ' : 'Focus / Goal'}</span>
                    <strong>{lang === 'kn' && selectedProgram.goalKn ? selectedProgram.goalKn : selectedProgram.goal}</strong>
                  </div>
                  <div className="stat">
                    <span>{lang === 'kn' ? 'ಮಟ್ಟ' : 'Complexity'}</span>
                    <strong>{selectedProgram.level === 'Beginner' && lang === 'kn' ? 'ಪ್ರಾರಂಭಿಕ' : selectedProgram.level === 'Intermediate' && lang === 'kn' ? 'ಮಧ್ಯಂತರ' : selectedProgram.level}</strong>
                  </div>
                </div>
              </div>

              {/* Schedule Timeline */}
              <div className="program-weeks-schedule">
                <h3>{t('week', lang)} 1 {lang === 'kn' ? 'ರ ವೇಳಾಪಟ್ಟಿ' : 'Schedule'}</h3>
                <p className="sub-desc">{lang === 'kn' ? 'ನಿಮ್ಮ ಫಿಟ್‌ನೆಸ್ ಪಯಣಕ್ಕಾಗಿ ಈ ಕೆಳಗಿನ ವಿಭಜನೆಗಳನ್ನು ಮಾಡಿ.' : 'Perform the following splits for Week 1 of your journey.'}</p>
                
                <div className="timeline-schedule-list">
                  {selectedProgram.weeks[0]?.schedule.map((dayData, idx) => (
                    <div key={idx} className="timeline-schedule-row">
                      <div className="day-name">{t(dayData.day, lang)}</div>
                      <div className="activity-details">
                        <div className="activity-label">{translateActivity(dayData.activity)}</div>
                        <span className={`status-tag ${dayData.activity.includes('Rest') ? 'status-rest' : 'status-train'}`}>
                          {dayData.activity.includes('Rest') ? (lang === 'kn' ? 'ವಿಶ್ರಾಂತಿ' : 'Rest') : (lang === 'kn' ? 'ವ್ಯಾಯಾಮ' : 'Workout')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card empty-explorer">
              <AlertCircle size={36} className="empty-icon" />
              <h3>{lang === 'kn' ? 'ಒಂದು ಕಾರ್ಯಕ್ರಮವನ್ನು ಆಯ್ಕೆಮಾಡಿ' : 'Select a Program'}</h3>
              <p>{lang === 'kn' ? 'ಅದರ ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಲು ಎಡ ಫಲಕದಿಂದ ಯಾವುದೇ ಕಾರ್ಯಕ್ರಮವನ್ನು ಆರಿಸಿ.' : 'Choose any program from the left panel to inspect its breakdown.'}</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .section-title-left {
          font-size: 1.4rem;
          margin-bottom: 16px;
          text-align: left;
        }

        .programs-split-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        @media (min-width: 1024px) {
          .programs-split-grid {
            grid-template-columns: 1fr 1.3fr;
          }
        }

        .programs-menu-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .program-menu-card {
          cursor: pointer;
          border: 1px solid var(--border-glass);
          text-align: left;
          transition: all 0.25s ease;
        }

        .program-menu-card:hover {
          border-color: var(--border-glass-bright);
          transform: translateY(-2px);
          background: var(--bg-glass-hover);
        }

        .program-menu-card.selected {
          border-color: var(--primary-neon);
          background: rgba(204, 255, 0, 0.03);
          box-shadow: 0 0 15px rgba(204, 255, 0, 0.05);
        }

        .card-header-flex {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .program-menu-card h3 {
          font-size: 1.15rem;
          margin-bottom: 4px;
        }

        .program-menu-card .tagline {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 16px;
          line-height: 1.3;
        }

        .prog-brief-meta {
          display: flex;
          gap: 16px;
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        /* Program Explorer Card styling */
        .program-explorer-card {
          text-align: left;
        }

        .explorer-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid var(--border-glass);
          padding-bottom: 20px;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .explorer-header h2 {
          font-size: 1.6rem;
          margin-top: 4px;
        }

        .explorer-overview {
          margin-bottom: 28px;
        }

        .explorer-overview h3 {
          font-size: 1.1rem;
          margin-bottom: 8px;
        }

        .explorer-overview p {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 16px;
        }

        .overview-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border-glass);
          padding: 16px;
          border-radius: var(--border-radius-md);
        }

        .overview-stats-grid .stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .overview-stats-grid span {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .overview-stats-grid strong {
          font-family: var(--font-heading);
          font-size: 1rem;
          color: var(--secondary-cyan);
        }

        .program-weeks-schedule h3 {
          font-size: 1.1rem;
          margin-bottom: 4px;
        }

        .program-weeks-schedule .sub-desc {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 16px;
        }

        .timeline-schedule-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .timeline-schedule-row {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid var(--border-glass);
          border-radius: var(--border-radius-md);
          padding: 12px 16px;
        }

        .day-name {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--primary-neon);
          width: 90px;
          flex-shrink: 0;
        }

        .activity-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex: 1;
          gap: 12px;
        }

        .activity-label {
          font-size: 0.9rem;
          color: var(--text-primary);
        }

        .status-tag {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .status-train {
          background: rgba(0, 240, 255, 0.1);
          color: var(--secondary-cyan);
        }

        .status-rest {
          background: rgba(255,255,255,0.05);
          color: var(--text-muted);
        }

        .empty-explorer {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          height: 100%;
        }

        .empty-icon {
          color: var(--text-muted);
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
}

export default Programs;
