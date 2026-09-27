import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Flame, Dumbbell, Award, Scale, Plus, Send } from 'lucide-react';
import { 
  getUser, 
  getTodayNutritionLogs, 
  addNutritionLog, 
  getWorkoutHistory, 
  addWeightLog 
} from '../utils/db';
import { WORKOUTS } from '../data/mockData';
import { t } from '../utils/i18n';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [todayWorkouts, setTodayWorkouts] = useState([]);
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [todayWorkoutCompleted, setTodayWorkoutCompleted] = useState(false);
  const [completedWorkoutDetails, setCompletedWorkoutDetails] = useState(null);
  
  // Weight logging modal state
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [logWeightVal, setLogWeightVal] = useState('');
  
  // Quick nutrition log state
  const [quickMealName, setQuickMealName] = useState('');
  const [quickMealCal, setQuickMealCal] = useState('');
  const [quickMealProt, setQuickMealProt] = useState('');

  const lang = user?.language || 'en';

  // AI Coach state
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: 'Hey there! I am your FitMitra AI Coach. Need a quick hydration tip, meal advice, or workout adjustment?' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Fetch db values on load
  const loadDashboardData = () => {
    const u = getUser();
    setUser(u);
    if (!u) return;

    // Compute today's calories from logs
    const todayLogs = getTodayNutritionLogs();
    const totalCal = todayLogs.reduce((acc, curr) => acc + curr.calories, 0);
    setCaloriesConsumed(totalCal);

    // Check if user completed a workout today
    const history = getWorkoutHistory();
    const todayStr = new Date().toISOString().split('T')[0];
    const completedToday = history.find(h => h.date === todayStr);
    
    if (completedToday) {
      setTodayWorkoutCompleted(true);
      setCompletedWorkoutDetails(completedToday);
    } else {
      setTodayWorkoutCompleted(false);
    }

    // Determine today's workout recommendation based on goal/program
    const recommendedWorkout = WORKOUTS.find(w => {
      if (u.fitnessGoal === 'Muscle Gain') return w.id === 'chest-triceps';
      if (u.fitnessGoal === 'Fat Loss') return w.id === 'core-cardio';
      if (u.fitnessGoal === 'Strength') return w.id === 'leg-destroyer';
      return w.id === 'shoulder-blast';
    }) || WORKOUTS[0];

    setTodayWorkouts([recommendedWorkout]);
  };

  useEffect(() => {
    loadDashboardData();
    window.addEventListener('fitmitra_db_update', loadDashboardData);
    return () => window.removeEventListener('fitmitra_db_update', loadDashboardData);
  }, []);

  const handleQuickMealLog = (e) => {
    e.preventDefault();
    if (!quickMealName || !quickMealCal) return;

    addNutritionLog({
      mealType: 'Snacks',
      name: quickMealName,
      calories: parseInt(quickMealCal),
      protein: parseInt(quickMealProt) || 0,
      carbs: 0,
      fats: 0
    });

    setQuickMealName('');
    setQuickMealCal('');
    setQuickMealProt('');
  };

  const handleWeightLogSubmit = (e) => {
    e.preventDefault();
    if (!logWeightVal) return;
    addWeightLog(logWeightVal);
    setShowWeightModal(false);
    setLogWeightVal('');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (lang === 'kn') {
      if (hour < 12) return 'ಶುಭೋದಯ';
      if (hour < 17) return 'ಶುಭ ಮಧ್ಯಾಹ್ನ';
      return 'ಶುಭ ಸಂಜೆ';
    }
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleSendMessage = (textToSend) => {
    const text = textToSend || chatInput;
    if (!text) return;

    const newMessages = [...chatMessages, { sender: 'user', text }];
    setChatMessages(newMessages);
    setChatInput('');

    // Generate responsive bot advice
    setTimeout(() => {
      let botResponse = "That sounds interesting! Keep focusing on your workouts and hitting your calorie targets.";
      
      const query = text.toLowerCase();
      if (query.includes('post-workout') || query.includes('eat') || query.includes('protein')) {
        botResponse = "Post-workout, focus on 20-30g of fast-digesting protein (like whey or egg whites) paired with simple carbs (banana or oats) to restore muscle glycogen and jumpstart repair.";
      } else if (query.includes('sore') || query.includes('rest') || query.includes('adjust')) {
        botResponse = "If your chest is sore but you have triceps scheduled, reduce the tricep overload slightly. Keep movements controlled or swap to high-rep tricep pushdowns to avoid joint strain.";
      } else if (query.includes('hydration') || query.includes('water') || query.includes('drink')) {
        botResponse = "Aim for at least 3-4 liters of water daily. During intensive lifts, drink 200ml every 15-20 minutes to maintain hydration and muscle endurance.";
      } else if (query.includes('fat') || query.includes('weight') || query.includes('deficit')) {
        botResponse = "To shred fat safely, stick to a modest 300-500 calorie deficit. Ensure protein intake is kept high (1.8g - 2.2g per kg) to preserve lean muscle tissue.";
      }

      setChatMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
    }, 800);
  };

  if (!user) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading dashboard...</div>;

  const caloriePct = Math.min(100, Math.round((caloriesConsumed / user.targetCal) * 100));
  const strokeDashoffset = 339.29 - (339.29 * caloriePct) / 100; // circumference 2 * pi * r = 2 * 3.14159 * 54 = 339.29

  return (
    <div className="dashboard-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title text-gradient">{getGreeting()}, {user.name} 👋</h1>
          <p className="page-subtitle">{lang === 'kn' ? 'ಇಂದು ನಿಮ್ಮ ಗುರಿಗಳನ್ನು ಸಾಧಿಸಲು ಸಿದ್ಧರಿದ್ದೀರಾ?' : 'Ready to conquer your goals today?'}</p>
        </div>
        <div className="dashboard-quick-header-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowWeightModal(true)}>
            <Scale size={16} /> {t('logWeight', lang)}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="dashboard-main-col">
          {/* Today's Workout Recommended */}
          <div className="glass-card today-workout-widget" style={{ marginBottom: '24px' }}>
            <h2 className="widget-title">{lang === 'kn' ? 'ಇಂದಿನ ವ್ಯಾಯಾಮ' : "Today's Workout"}</h2>
            
            {todayWorkoutCompleted ? (
              <div className="workout-completed-state">
                <div className="success-icon-wrap">
                  <Award size={48} className="success-icon" />
                </div>
                <div className="success-info">
                  <h3>{lang === 'kn' ? '✓ ವ್ಯಾಯಾಮ ಪೂರ್ಣಗೊಂಡಿದೆ!' : '✓ Workout Completed!'}</h3>
                  <p className="details">
                    {lang === 'kn' ? 'ಪೂರ್ಣಗೊಂಡಿದೆ' : 'Completed'} <strong>{completedWorkoutDetails?.name}</strong>.
                  </p>
                  <div className="completion-stats">
                    <span>🔥 {completedWorkoutDetails?.calories} Kcal</span>
                    <span>⏱ {completedWorkoutDetails?.duration} {lang === 'kn' ? 'ನಿಮಿಷಗಳು' : 'Mins'}</span>
                  </div>
                  <Link to="/progress" className="btn btn-secondary btn-sm">{lang === 'kn' ? 'ಇತಿಹಾಸ ವೀಕ್ಷಿಸಿ' : 'View Workout History'}</Link>
                </div>
              </div>
            ) : (
              todayWorkouts.map((w) => (
                <div key={w.id} className="workout-action-card">
                  <div className="info">
                    <h3>{lang === 'kn' && w.nameKn ? w.nameKn : w.name}</h3>
                    <p className="meta">
                      <span>{w.difficulty === 'Beginner' && lang === 'kn' ? 'ಪ್ರಾರಂಭಿಕ' : w.difficulty === 'Intermediate' && lang === 'kn' ? 'ಮಧ್ಯಂತರ' : w.difficulty}</span> • <span>{w.duration} {lang === 'kn' ? 'ನಿಮಿಷ' : 'Min'}</span> • <span>{w.exercises.length} {lang === 'kn' ? 'ವ್ಯಾಯಾಮಗಳು' : 'Exercises'}</span>
                    </p>
                    <p className="tagline">{lang === 'kn' && w.taglineKn ? w.taglineKn : w.tagline}</p>
                  </div>
                  <button onClick={() => navigate(`/workouts/${w.id}`)} className="btn btn-primary">
                    {t('startWorkout', lang)} <Dumbbell size={18} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Today's Nutrition Progress */}
          <div className="glass-card nutrition-widget" style={{ marginBottom: '24px' }}>
            <h2 className="widget-title">{lang === 'kn' ? 'ಇಂದಿನ ಆಹಾರದ ಅವಲೋಕನ' : "Today's Nutrition Summary"}</h2>
            <div className="nutrition-progress-flex">
              <div className="progress-circle-container">
                <svg className="progress-circle-svg">
                  <circle className="progress-circle-bg" cx="70" cy="70" r="54" />
                  <circle 
                    className="progress-circle-bar progress-circle-bar-cyan" 
                    cx="70" cy="70" r="54" 
                    strokeDasharray="339.29"
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
                <div className="progress-circle-text">
                  <span className="progress-circle-val">{caloriesConsumed}</span>
                  <p className="progress-circle-label">{lang === 'kn' ? 'ಒಟ್ಟು ' : 'of '} {user.targetCal} kcal</p>
                </div>
              </div>

              <div className="nutrition-text-info">
                <h3>{caloriePct}% {lang === 'kn' ? 'ಸೇವಿಸಿದ ಕ್ಯಾಲೊರಿಗಳು' : 'Calorie Intake'}</h3>
                <p>{lang === 'kn' ? 'ಮ್ಯಾಕ್ರೋಸ್ ವಿವರಣೆಯನ್ನು ಕೆಳಗೆ ನೀಡಲಾಗಿದೆ:' : 'Macros breakdown calculated dynamically below:'}</p>
                
                <div className="nutrition-grid" style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-glass)' }}>
                  <div className="nutrition-grid-item">
                    <span className="nutrition-grid-item-val" style={{ color: 'var(--primary-neon)' }}>{user.targetProtein}g</span>
                    <p className="nutrition-grid-item-label">{lang === 'kn' ? 'ಪ್ರೋಟೀನ್ ಗುರಿ' : 'Protein Target'}</p>
                  </div>
                  <div className="nutrition-grid-item">
                    <span className="nutrition-grid-item-val" style={{ color: 'var(--secondary-cyan)' }}>{user.targetCarbs}g</span>
                    <p className="nutrition-grid-item-label">{lang === 'kn' ? 'ಕಾರ್ಬ್ಸ್ ಗುರಿ' : 'Carbs Target'}</p>
                  </div>
                  <div className="nutrition-grid-item">
                    <span className="nutrition-grid-item-val" style={{ color: 'var(--accent-orange)' }}>{user.targetFats}g</span>
                    <p className="nutrition-grid-item-label">{lang === 'kn' ? 'ಕೊಬ್ಬಿನ ಗುರಿ' : 'Fats Target'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Calorie Add */}
            <form onSubmit={handleQuickMealLog} className="quick-calorie-form">
              <h4>{t('quickLogMeal', lang)}</h4>
              <div className="quick-fields">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder={lang === 'kn' ? 'ಉದಾ: ರಾಗಿ ರೊಟ್ಟಿ' : 'E.g., Protein shake'}
                  value={quickMealName}
                  onChange={(e) => setQuickMealName(e.target.value)}
                />
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="Kcal"
                  style={{ width: '80px' }}
                  value={quickMealCal}
                  onChange={(e) => setQuickMealCal(e.target.value)}
                />
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="Prot (g)"
                  style={{ width: '80px' }}
                  value={quickMealProt}
                  onChange={(e) => setQuickMealProt(e.target.value)}
                />
                <button type="submit" className="btn btn-cyan btn-icon-only">
                  <Plus size={20} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column (Sidebars) */}
        <div className="dashboard-sidebar-grid">
          {/* Quick Metrics Grid */}
          <div className="glass-card stats-widget" style={{ padding: '16px' }}>
            <h3 className="sidebar-widget-title">{lang === 'kn' ? 'ನಿಮ್ಮ ಪ್ರಗತಿ' : 'Your Progress'}</h3>
            <div className="dashboard-stats-grid">
              <div className="d-stat-box">
                <Flame className="stat-icon icon-neon" />
                <div>
                  <p className="stat-label">{t('streak', lang)}</p>
                  <p className="stat-val">{user.streak} {t('days', lang)}</p>
                </div>
              </div>

              <div className="d-stat-box">
                <Scale className="stat-icon icon-cyan" />
                <div>
                  <p className="stat-label">{t('currentWeight', lang)}</p>
                  <p className="stat-val">{user.currentWeight} KG</p>
                </div>
              </div>

              <div className="d-stat-box">
                <Dumbbell className="stat-icon icon-purple" />
                <div>
                  <p className="stat-label">{t('completedWorkouts', lang)}</p>
                  <p className="stat-val">{user.completedWorkoutsCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Coach Assistant */}
          <div className="glass-card ai-coach-card">
            <div className="ai-coach-header">
              <div className="bot-avatar">AI</div>
              <div>
                <h3>{t('aiCoach', lang)}</h3>
                <span className="online-indicator">{lang === 'kn' ? 'ತರಬೇತುದಾರರು ಲಭ್ಯವಿದ್ದಾರೆ' : 'Online coach ready'}</span>
              </div>
            </div>

            <div className="ai-chat-messages">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`chat-bubble ${msg.sender === 'bot' ? 'chat-bubble-bot' : 'chat-bubble-user'}`}>
                  {msg.text}
                </div>
              ))}
            </div>

            <div className="quick-advice-prompts">
              <button onClick={() => handleSendMessage("What should I eat post-workout?")}>{lang === 'kn' ? 'ವರ್ಕೌಟ್ ನಂತರದ ಊಟ?' : 'Post-Workout Meal?'}</button>
              <button onClick={() => handleSendMessage("Can I train with sore muscles?")}>{lang === 'kn' ? 'ಸ್ನಾಯು ನೋವಿದ್ದಾಗ ವ್ಯಾಯಾಮ?' : 'Train Sore Muscles?'}</button>
              <button onClick={() => handleSendMessage("Hydration tip")}>{lang === 'kn' ? 'ನೀರು ಕುಡಿಯುವ ಸಲಹೆ?' : 'Hydration Tip?'}</button>
            </div>

            <div className="chat-input-wrapper">
              <input 
                type="text" 
                className="form-control" 
                placeholder={t('askCoach', lang)}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button onClick={() => handleSendMessage()} className="btn btn-primary chat-send-btn">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Log Weight Modal */}
      {showWeightModal && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card">
            <h3>{t('logWeight', lang)}</h3>
            <p className="modal-desc">{lang === 'kn' ? 'ನಿಮ್ಮ ಪ್ರಗತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಇಂದಿನ ತೂಕವನ್ನು ನಮೂದಿಸಿ.' : 'Enter your body weight for today to keep your progress chart updated.'}</p>
            <form onSubmit={handleWeightLogSubmit}>
              <div className="form-group">
                <label className="form-label">{t('weightKg', lang)}</label>
                <input 
                  type="number" 
                  step="0.1" 
                  className="form-control" 
                  placeholder="E.g. 72.4"
                  autoFocus
                  value={logWeightVal}
                  onChange={(e) => setLogWeightVal(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowWeightModal(false)}>{t('cancel', lang)}</button>
                <button type="submit" className="btn btn-primary">{t('save', lang)}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .widget-title {
          font-size: 1.3rem;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .sidebar-widget-title {
          font-size: 1rem;
          text-transform: uppercase;
          margin-bottom: 12px;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
        }

        /* Today's Workout completion display */
        .workout-completed-state {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 10px;
        }

        @media (max-width: 480px) {
          .workout-completed-state {
            flex-direction: column;
            text-align: center;
          }
        }

        .success-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(204, 255, 0, 0.1);
          border: 1px solid rgba(204, 255, 0, 0.3);
        }

        .success-icon {
          color: var(--primary-neon);
          filter: drop-shadow(0 0 8px var(--primary-neon-glow));
        }

        .success-info h3 {
          font-size: 1.25rem;
          color: var(--primary-neon);
          margin-bottom: 4px;
        }

        .success-info .details {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .completion-stats {
          display: flex;
          gap: 16px;
          font-size: 0.85rem;
          color: var(--text-primary);
          font-weight: 600;
          margin-bottom: 12px;
        }

        .workout-action-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }

        @media (max-width: 640px) {
          .workout-action-card {
            flex-direction: column;
            align-items: stretch;
            text-align: center;
          }
        }

        .workout-action-card h3 {
          font-size: 1.25rem;
          margin-bottom: 4px;
        }

        .workout-action-card .meta {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .workout-action-card .tagline {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        /* Nutrition progress */
        .nutrition-progress-flex {
          display: flex;
          align-items: center;
          gap: 30px;
          margin-bottom: 24px;
        }

        @media (max-width: 640px) {
          .nutrition-progress-flex {
            flex-direction: column;
            text-align: center;
          }
        }

        .nutrition-text-info {
          flex: 1;
        }

        .nutrition-text-info h3 {
          font-size: 1.2rem;
          color: var(--secondary-cyan);
          margin-bottom: 8px;
        }

        .nutrition-text-info p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 12px;
        }

        /* Quick Log Snack Form */
        .quick-calorie-form {
          border-top: 1px solid var(--border-glass);
          padding-top: 20px;
        }

        .quick-calorie-form h4 {
          font-size: 0.9rem;
          margin-bottom: 12px;
          text-transform: uppercase;
          color: var(--text-secondary);
          letter-spacing: 0.05em;
        }

        .quick-fields {
          display: flex;
          gap: 10px;
        }

        @media (max-width: 480px) {
          .quick-fields {
            flex-wrap: wrap;
          }
          .quick-fields input {
            width: 100% !important;
          }
        }

        .btn-icon-only {
          padding: 12px;
          aspect-ratio: 1;
        }

        /* Stats sidebar widget */
        .dashboard-stats-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .d-stat-box {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-glass);
          padding: 12px 16px;
          border-radius: var(--border-radius-md);
        }

        .stat-icon {
          width: 24px;
          height: 24px;
        }

        .icon-neon {
          color: var(--primary-neon);
        }

        .icon-cyan {
          color: var(--secondary-cyan);
        }

        .icon-purple {
          color: var(--accent-purple);
        }

        .d-stat-box .stat-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .d-stat-box .stat-val {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 1.15rem;
        }

        /* AI Coach Layout */
        .ai-coach-card {
          padding: 16px;
        }

        .ai-coach-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          border-bottom: 1px solid var(--border-glass);
          padding-bottom: 12px;
        }

        .bot-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--primary-neon);
          color: #000;
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 10px var(--primary-neon-glow);
        }

        .ai-coach-header h3 {
          font-size: 0.95rem;
        }

        .online-indicator {
          font-size: 0.7rem;
          color: #10b981;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .online-indicator::before {
          content: '';
          display: inline-block;
          width: 6px;
          height: 6px;
          background: #10b981;
          border-radius: 50%;
        }

        .quick-advice-prompts {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }

        .quick-advice-prompts button {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-glass);
          padding: 6px 12px;
          border-radius: 9999px;
          font-size: 0.75rem;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .quick-advice-prompts button:hover {
          color: var(--primary-neon);
          border-color: rgba(204, 255, 0, 0.4);
          background: var(--primary-neon-dim);
        }

        .chat-input-wrapper {
          display: flex;
          gap: 8px;
        }

        .chat-send-btn {
          padding: 12px;
          aspect-ratio: 1;
        }

        /* Modal overlay */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
          padding: 20px;
        }

        .modal-content {
          width: 100%;
          max-width: 440px;
        }

        .modal-content h3 {
          font-size: 1.4rem;
          margin-bottom: 8px;
        }

        .modal-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 20px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
