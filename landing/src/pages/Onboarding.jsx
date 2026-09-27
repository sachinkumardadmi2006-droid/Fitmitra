import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Dumbbell, UserCheck, Flame, Scale, Activity } from 'lucide-react';
import { saveUser, getUser, addWeightLog } from '../utils/db';

function Onboarding({ user, onOnboardingComplete }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState('Muscle Gain');
  const [experience, setExperience] = useState('Intermediate');
  const [age, setAge] = useState(24);
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(72);
  const [gender, setGender] = useState('Male');
  const [activity, setActivity] = useState('Moderately Active');

  const totalSteps = 3;

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    // Calculate targeted calories and macros based on parameters
    let baseCal = 1500;
    
    // Basal Metabolic Rate (BMR) simple calculation: Mifflin-St Jeor Equation approx.
    if (gender === 'Male') {
      baseCal = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      baseCal = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Activity multiplier
    let multiplier = 1.2;
    if (activity === 'Moderately Active') multiplier = 1.4;
    if (activity === 'Very Active') multiplier = 1.6;

    let targetCal = Math.round(baseCal * multiplier);

    // Goal adjustments
    if (goal === 'Fat Loss') {
      targetCal -= 450; // Caloric deficit
    } else if (goal === 'Muscle Gain') {
      targetCal += 350; // Caloric surplus
    } else if (goal === 'Strength') {
      targetCal += 200;
    }

    // Macros
    // Protein: 2g per kg of bodyweight
    const targetProtein = Math.round(weight * 2.0);
    // Fats: 25% of total calories (9 kcal/g)
    const targetFats = Math.round((targetCal * 0.25) / 9);
    // Carbs: Rest of calories (4 kcal/g)
    const targetCarbs = Math.round((targetCal - (targetProtein * 4) - (targetFats * 9)) / 4);

    const updatedUser = {
      ...getUser(),
      fitnessGoal: goal,
      experienceLevel: experience,
      age: parseInt(age),
      height: parseInt(height),
      weight: parseFloat(weight),
      currentWeight: parseFloat(weight),
      startingWeight: parseFloat(weight),
      goalWeight: goal === 'Fat Loss' ? Math.round(weight * 0.9) : goal === 'Muscle Gain' ? Math.round(weight * 1.08) : weight,
      gender,
      activityLevel: activity,
      targetCal,
      targetProtein,
      targetCarbs,
      targetFats,
    };

    saveUser(updatedUser);
    
    // Add first weight history log
    addWeightLog(weight);

    onOnboardingComplete(updatedUser);
    navigate('/dashboard');
  };

  return (
    <div className="onboarding-page-container">
      <div className="onboarding-window glass-card">
        {/* Step Indicator */}
        <div className="onboarding-progress-container">
          <p className="step-count">Step {step} of {totalSteps}</p>
          <div className="onboarding-progress-bar">
            <div 
              className="onboarding-progress-fill" 
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        {step === 1 && (
          <div className="step-view animate-fade-in">
            <h2>Select Your Primary Goal</h2>
            <p className="step-desc">We will customize your daily target metrics and meal recommendations based on this.</p>
            
            <div className="goals-options-grid">
              <div 
                className={`goal-selector-card ${goal === 'Muscle Gain' ? 'selected' : ''}`}
                onClick={() => setGoal('Muscle Gain')}
              >
                <div className="icon-wrapper"><Flame className="goal-icon" /></div>
                <div>
                  <h3>Muscle Gain</h3>
                  <p>Build size, mass, and recover effectively</p>
                </div>
              </div>

              <div 
                className={`goal-selector-card ${goal === 'Fat Loss' ? 'selected' : ''}`}
                onClick={() => setGoal('Fat Loss')}
              >
                <div className="icon-wrapper"><Target className="goal-icon" /></div>
                <div>
                  <h3>Fat Loss</h3>
                  <p>Shred fat, lean out, and build endurance</p>
                </div>
              </div>

              <div 
                className={`goal-selector-card ${goal === 'Strength' ? 'selected' : ''}`}
                onClick={() => setGoal('Strength')}
              >
                <div className="icon-wrapper"><Dumbbell className="goal-icon" /></div>
                <div>
                  <h3>Strength</h3>
                  <p>Focus on heavy compounding and lifting power</p>
                </div>
              </div>

              <div 
                className={`goal-selector-card ${goal === 'General Fitness' ? 'selected' : ''}`}
                onClick={() => setGoal('General Fitness')}
              >
                <div className="icon-wrapper"><UserCheck className="goal-icon" /></div>
                <div>
                  <h3>General Fitness</h3>
                  <p>Build healthy active habits and stamina</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-view animate-fade-in">
            <h2>Select Your Experience Level</h2>
            <p className="step-desc">We adjust exercise volumes, reps, and instructions accordingly.</p>

            <div className="experience-options-grid">
              <div 
                className={`goal-selector-card ${experience === 'Beginner' ? 'selected' : ''}`}
                onClick={() => setExperience('Beginner')}
              >
                <div className="icon-badge">1</div>
                <div>
                  <h3>Beginner</h3>
                  <p>0 - 6 months lifting. Just starting out</p>
                </div>
              </div>

              <div 
                className={`goal-selector-card ${experience === 'Intermediate' ? 'selected' : ''}`}
                onClick={() => setExperience('Intermediate')}
              >
                <div className="icon-badge">2</div>
                <div>
                  <h3>Intermediate</h3>
                  <p>6 months - 2 years. Comfortable with main lifts</p>
                </div>
              </div>

              <div 
                className={`goal-selector-card ${experience === 'Advanced' ? 'selected' : ''}`}
                onClick={() => setExperience('Advanced')}
              >
                <div className="icon-badge">3</div>
                <div>
                  <h3>Advanced</h3>
                  <p>2+ years. Structured routines, high intensity</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-view animate-fade-in">
            <h2>Enter Your Details</h2>
            <p className="step-desc">Help us estimate your metabolic rates accurately.</p>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Age (years)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={age}
                  onChange={(e) => setAge(Math.max(1, e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Height (cm)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={height}
                  onChange={(e) => setHeight(Math.max(1, e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input 
                  type="number" 
                  step="0.1"
                  className="form-control" 
                  value={weight}
                  onChange={(e) => setWeight(Math.max(1, e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gender</label>
                <select 
                  className="form-control"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Activity Level</label>
              <select 
                className="form-control"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
              >
                <option value="Sedentary">Sedentary (Little to no exercise)</option>
                <option value="Moderately Active">Moderately Active (Exercise 3-4 days/week)</option>
                <option value="Very Active">Very Active (Exercise 6+ days/week, heavy lifting)</option>
              </select>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="onboarding-footer">
          {step > 1 ? (
            <button className="btn btn-secondary" onClick={prevStep}>Back</button>
          ) : (
            <div></div> // Spacer
          )}
          <button className="btn btn-primary" onClick={nextStep}>
            {step === totalSteps ? 'Finish Profile' : 'Continue'}
          </button>
        </div>
      </div>

      <style>{`
        .onboarding-page-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .onboarding-window {
          width: 100%;
          max-width: 580px;
        }

        .onboarding-progress-container {
          margin-bottom: 24px;
        }

        .step-count {
          font-size: 0.8rem;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
        }

        .step-view h2 {
          font-size: 1.8rem;
          margin-bottom: 6px;
        }

        .step-desc {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-bottom: 24px;
        }

        .goals-options-grid,
        .experience-options-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: var(--border-radius-sm);
          background: rgba(255, 255, 255, 0.05);
          color: var(--primary-neon);
        }

        .goal-selector-card.selected .icon-wrapper {
          background: var(--primary-neon);
          color: #000;
          box-shadow: 0 0 10px var(--primary-neon-glow);
        }

        .icon-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--border-glass-bright);
          color: var(--text-primary);
          font-weight: 700;
        }

        .goal-selector-card.selected .icon-badge {
          background: var(--primary-neon);
          color: #000;
        }

        .goal-selector-card h3 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .goal-selector-card p {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 480px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }

        .onboarding-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid var(--border-glass);
        }
      `}</style>
    </div>
  );
}

export default Onboarding;
