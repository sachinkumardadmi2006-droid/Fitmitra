import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Trash2, CheckCircle2, Star } from 'lucide-react';
import { getUser, saveUser, initDb } from '../utils/db';
import { t } from '../utils/i18n';

function Profile({ onLogout }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Form states
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('Muscle Gain');
  const [experience, setExperience] = useState('Intermediate');
  const [activity, setActivity] = useState('Moderately Active');
  const [language, setLanguage] = useState('en');
  
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Payment Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const loadProfileData = () => {
    const u = getUser();
    setUser(u);
    if (!u) return;
    setName(u.name || '');
    setAge(u.age || '');
    setHeight(u.height || '');
    setWeight(u.weight || '');
    setGoal(u.fitnessGoal || 'Muscle Gain');
    setExperience(u.experienceLevel || 'Intermediate');
    setActivity(u.activityLevel || 'Moderately Active');
    setLanguage(u.language || 'en');
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!name || !height || !weight) return;

    const updated = {
      ...user,
      name,
      age: parseInt(age),
      height: parseInt(height),
      weight: parseFloat(weight),
      currentWeight: parseFloat(weight),
      fitnessGoal: goal,
      experienceLevel: experience,
      activityLevel: activity,
      language: language
    };

    saveUser(updated);
    setUser(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTogglePremium = () => {
    if (user.isPremium) {
      const updated = {
        ...user,
        isPremium: false
      };
      saveUser(updated);
      setUser(updated);
    } else {
      setShowPaymentModal(true);
    }
  };

  const handleProceedPayment = (e) => {
    e.preventDefault();
    setPaymentProcessing(true);

    setTimeout(() => {
      setPaymentProcessing(false);
      setPaymentSuccess(true);

      setTimeout(() => {
        const updated = {
          ...user,
          isPremium: true
        };
        saveUser(updated);
        setUser(updated);
        
        setShowPaymentModal(false);
        setPaymentSuccess(false);
        setUpiId('');
        setCardNumber('');
        setCardExpiry('');
        setCardCvv('');
        setCardName('');
      }, 1500);
    }, 2000);
  };

  const handleResetData = () => {
    if (confirm("Are you sure you want to reset all workout logs, weights, and food data to defaults? This cannot be undone.")) {
      initDb(true); // force reset
      loadProfileData();
      alert("Database reset to initial demo values!");
      navigate('/dashboard');
    }
  };

  if (!user) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading profile...</div>;

  const currentLang = user.language || 'en';

  const getFitnessGoalLabel = (g) => {
    if (currentLang === 'kn') {
      if (g === 'Muscle Gain') return 'ಸ್ನಾಯು ಹೆಚ್ಚಳ (Muscle Gain)';
      if (g === 'Fat Loss') return 'ಕೊಬ್ಬು ಕಡಿತ (Fat Loss)';
      if (g === 'Strength') return 'ದೈಹಿಕ ಶಕ್ತಿ (Strength)';
      if (g === 'General Fitness') return 'ಸಾಮಾನ್ಯ ಫಿಟ್‌ನೆಸ್ (General Fitness)';
    }
    return g;
  };

  const getExperienceLabel = (exp) => {
    if (currentLang === 'kn') {
      if (exp === 'Beginner') return 'ಆರಂಭಿಕ (Beginner)';
      if (exp === 'Intermediate') return 'ಮಧ್ಯಂತರ (Intermediate)';
      if (exp === 'Advanced') return 'ಮುಂದುವರಿದ (Advanced)';
    }
    return exp;
  };

  return (
    <div className="profile-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title text-gradient">{t('profile', currentLang)}</h1>
          <p className="page-subtitle">{t('editProfile', currentLang)}</p>
        </div>
      </div>

      <div className="profile-split-grid">
        {/* Left Column: Profile form */}
        <div className="profile-details-column">
          <div className="glass-card profile-form-card">
            <div className="profile-hero-badge">
              <div className="profile-avatar-large">
                {name ? name[0].toUpperCase() : 'U'}
              </div>
              <div>
                <h2>{name}</h2>
                <p className="sub">{getExperienceLabel(experience)} • {getFitnessGoalLabel(goal)}</p>
              </div>
            </div>

            {saveSuccess && (
              <div className="success-banner animate-fade-in">
                <CheckCircle2 size={16} /> {t('profileSaved', currentLang)}
              </div>
            )}

            <form onSubmit={handleSaveProfile}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">{t('fullName', currentLang)}</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('age', currentLang)}</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('height', currentLang)}</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('weightKg', currentLang)}</label>
                  <input 
                    type="number" 
                    step="0.1"
                    className="form-control" 
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid" style={{ marginTop: '12px' }}>
                <div className="form-group">
                  <label className="form-label">{t('fitnessGoal', currentLang)}</label>
                  <select 
                    className="form-control"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                  >
                    <option value="Muscle Gain">{currentLang === 'kn' ? 'ಸ್ನಾಯು ಹೆಚ್ಚಳ (Muscle Gain)' : 'Muscle Gain'}</option>
                    <option value="Fat Loss">{currentLang === 'kn' ? 'ಕೊಬ್ಬು ಕಡಿತ (Fat Loss)' : 'Fat Loss'}</option>
                    <option value="Strength">{currentLang === 'kn' ? 'ದೈಹಿಕ ಶಕ್ತಿ (Strength)' : 'Strength'}</option>
                    <option value="General Fitness">{currentLang === 'kn' ? 'ಸಾಮಾನ್ಯ ಫಿಟ್‌ನೆಸ್ (General Fitness)' : 'General Fitness'}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('experienceLevel', currentLang)}</label>
                  <select 
                    className="form-control"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                  >
                    <option value="Beginner">{currentLang === 'kn' ? 'ಆರಂಭಿಕ (Beginner)' : 'Beginner'}</option>
                    <option value="Intermediate">{currentLang === 'kn' ? 'ಮಧ್ಯಂತರ (Intermediate)' : 'Intermediate'}</option>
                    <option value="Advanced">{currentLang === 'kn' ? 'ಮುಂದುವರಿದ (Advanced)' : 'Advanced'}</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label">{t('activityLevel', currentLang)}</label>
                <select 
                  className="form-control"
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                >
                  <option value="Sedentary">{currentLang === 'kn' ? 'Sedentary (ಯಾವುದೇ ವ್ಯಾಯಾಮ ಇಲ್ಲ)' : 'Sedentary (Little to no exercise)'}</option>
                  <option value="Moderately Active">{currentLang === 'kn' ? 'Moderately Active (ವಾರಕ್ಕೆ 3-4 ದಿನ ವ್ಯಾಯಾಮ)' : 'Moderately Active (Exercise 3-4 days/week)'}</option>
                  <option value="Very Active">{currentLang === 'kn' ? 'Very Active (ವಾರಕ್ಕೆ 6+ ದಿನ ವ್ಯಾಯಾಮ)' : 'Very Active (Exercise 6+ days/week, heavy lifting)'}</option>
                </select>
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label">{t('language', currentLang)}</label>
                <select 
                  className="form-control"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="kn">ಕನ್ನಡ (Kannada)</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '16px' }}>
                {t('saveChanges', currentLang)}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Premium & Settings */}
        <div className="profile-settings-column">
          {/* Subscription widget */}
          <div className="glass-card subscription-card" style={{ marginBottom: '24px' }}>
            <div className="card-header-icon">
              <Star size={22} className="star-icon" />
              <h3>Upgrade to Premium</h3>
            </div>
            
            <p className="desc">
              Unlock advanced training, custom diets, progress analytics, and our premium AI workout adjusters.
            </p>

            <div className="pricing-flex">
              <div className="price-item">
                <span className="duration">Monthly Plan</span>
                <strong>$9.99 / mo</strong>
              </div>
              <div className="price-item-divider"></div>
              <div className="price-item">
                <span className="duration">Annual Plan</span>
                <strong>$59.99 / yr</strong>
              </div>
            </div>

            <button 
              onClick={handleTogglePremium} 
              className={`btn btn-block ${user.isPremium ? 'btn-danger' : 'btn-cyan glow-cyan'}`}
            >
              {user.isPremium ? 'CANCEL PREMIUM ACCESS' : 'UPGRADE TO FITMITRA PRO'}
            </button>
          </div>

          {/* Database management and logout */}
          <div className="glass-card settings-card">
            <h3>App Control Panel</h3>
            <p className="desc">Perform systems maintenance, reset state, or log out of this companion.</p>

            <div className="settings-buttons">
              <button onClick={handleResetData} className="btn btn-secondary btn-block reset-btn">
                <Trash2 size={16} /> RESET LOCAL DATABASE
              </button>
              
              <button onClick={onLogout} className="btn btn-danger btn-block">
                <LogOut size={16} /> LOG OUT SESSION
              </button>
            </div>
          </div>
      </div>
    </div>

      {/* Payment Upgrade Modal */}
      {showPaymentModal && (
        <div className="payment-modal-backdrop">
          <div className="payment-modal-content glass-card animate-fade-in">
            <button className="payment-modal-close" onClick={() => setShowPaymentModal(false)}>×</button>
            
            {paymentSuccess ? (
              <div className="payment-success-state text-center">
                <div className="success-checkmark-wrapper">
                  <CheckCircle2 size={64} className="success-checkmark-icon" />
                </div>
                <h2>{currentLang === 'kn' ? 'ಪಾವತಿ ಯಶಸ್ವಿಯಾಗಿದೆ! 🎉' : 'Payment Successful! 🎉'}</h2>
                <p>{currentLang === 'kn' ? 'ಫಿಟ್‌ಮಿತ್ರ ಪ್ರೊ ಗೆ ಸುಸ್ವಾಗತ!' : 'Welcome to FitMitra Pro!'}</p>
                <p className="sub">{currentLang === 'kn' ? 'ನಿಮ್ಮ ಪ್ರೊ ಪ್ರವೇಶ ಸಕ್ರಿಯಗೊಂಡಿದೆ.' : 'Your Pro features are now fully unlocked.'}</p>
              </div>
            ) : paymentProcessing ? (
              <div className="payment-processing-state text-center">
                <div className="payment-spinner"></div>
                <h2>{currentLang === 'kn' ? 'ಸುರಕ್ಷಿತ ಪಾವತಿ ಪ್ರಕ್ರಿಯೆ...' : 'Secure Payment processing...'}</h2>
                <p>{currentLang === 'kn' ? 'ದಯವಿಟ್ಟು ನಿರೀಕ್ಷಿಸಿ, ನಿಮ್ಮ ವಹಿವಾಟನ್ನು ಅಧಿಕೃತಗೊಳಿಸಲಾಗುತ್ತಿದೆ.' : 'Please wait, authorizing transaction securely with bank gateways.'}</p>
              </div>
            ) : (
              <div>
                <div className="payment-modal-header">
                  <h3>{currentLang === 'kn' ? 'ಫಿಟ್‌ಮಿತ್ರ ಪ್ರೊ ಸುರಕ್ಷಿತ ಪಾವತಿ' : 'FitMitra Pro Secure Checkout'}</h3>
                  <p className="desc">{currentLang === 'kn' ? 'ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ರದ್ದುಗೊಳಿಸಬಹುದಾದ ಪ್ರೊ ವೈಶಿಷ್ಟ್ಯಗಳನ್ನು ಅನ್ಲಾಕ್ ಮಾಡಿ' : 'Unlock advanced workouts, diets, and AI recommendations'}</p>
                </div>

                <form onSubmit={handleProceedPayment}>
                  {/* Plan Selector Grid */}
                  <div className="payment-plan-selector-grid">
                    <div 
                      className={`payment-plan-card ${selectedPlan === 'monthly' ? 'selected' : ''}`}
                      onClick={() => setSelectedPlan('monthly')}
                    >
                      <input 
                        type="radio" 
                        name="plan" 
                        checked={selectedPlan === 'monthly'} 
                        onChange={() => setSelectedPlan('monthly')} 
                        id="plan-monthly"
                      />
                      <div className="details">
                        <strong>{currentLang === 'kn' ? 'ಮಾಸಿಕ ಯೋಜನೆ' : 'Monthly Plan'}</strong>
                        <span>{currentLang === 'kn' ? '₹799 / ತಿಂಗಳಿಗೆ' : '₹799 / month'}</span>
                      </div>
                    </div>

                    <div 
                      className={`payment-plan-card ${selectedPlan === 'annual' ? 'selected' : ''}`}
                      onClick={() => setSelectedPlan('annual')}
                    >
                      <input 
                        type="radio" 
                        name="plan" 
                        checked={selectedPlan === 'annual'} 
                        onChange={() => setSelectedPlan('annual')} 
                        id="plan-annual"
                      />
                      <div className="details">
                        <strong>{currentLang === 'kn' ? 'ವಾರ್ಷಿಕ ಯೋಜನೆ (ಉಳಿತಾಯ 45%)' : 'Annual Plan (Save 45%)'}</strong>
                        <span>{currentLang === 'kn' ? '₹4,999 / ವರ್ಷಕ್ಕೆ' : '₹4,999 / year'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Selector Tabs */}
                  <div className="payment-methods-tabs">
                    <button 
                      type="button"
                      className={`method-tab ${paymentMethod === 'upi' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('upi')}
                    >
                      UPI
                    </button>
                    <button 
                      type="button"
                      className={`method-tab ${paymentMethod === 'card' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('card')}
                    >
                      {currentLang === 'kn' ? 'ಕಾರ್ಡ್ ಪಾವತಿ' : 'Card'}
                    </button>
                    <button 
                      type="button"
                      className={`method-tab ${paymentMethod === 'netbanking' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('netbanking')}
                    >
                      {currentLang === 'kn' ? 'ನೆಟ್ ಬ್ಯಾಂಕಿಂಗ್' : 'Netbanking'}
                    </button>
                  </div>

                  {/* Payment Inputs based on selected method */}
                  <div className="payment-method-fields-container">
                    {paymentMethod === 'upi' && (
                      <div className="form-group">
                        <label className="form-label">{currentLang === 'kn' ? 'ಯುಪಿಐ ಐಡಿ ನಮೂದಿಸಿ' : 'Enter UPI ID'}</label>
                        <input 
                          type="text" 
                          required
                          className="form-control" 
                          placeholder="username@okaxis or username@upi" 
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                        />
                        <span className="field-note">{currentLang === 'kn' ? 'ಪಾವತಿ ವಿನಂತಿಯನ್ನು ನಿಮ್ಮ ಯುಪಿಐ ಆಪ್ ನಲ್ಲಿ ದೃಢೀಕರಿಸಿ.' : 'A payment request will be sent to your UPI app.'}</span>
                      </div>
                    )}

                    {paymentMethod === 'card' && (
                      <div className="card-fields-grid">
                        <div className="form-group span-2">
                          <label className="form-label">{currentLang === 'kn' ? 'ಕಾರ್ಡ್ ಸಂಖ್ಯೆ' : 'Card Number'}</label>
                          <input 
                            type="text" 
                            required
                            className="form-control" 
                            placeholder="4111 2222 3333 4444" 
                            maxLength="19"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">{currentLang === 'kn' ? 'ಅಂತಿಮ ದಿನಾಂಕ' : 'Expiry'}</label>
                          <input 
                            type="text" 
                            required
                            className="form-control" 
                            placeholder="MM/YY" 
                            maxLength="5"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">CVV</label>
                          <input 
                            type="password" 
                            required
                            className="form-control" 
                            placeholder="***" 
                            maxLength="3"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                          />
                        </div>
                        <div className="form-group span-2">
                          <label className="form-label">{currentLang === 'kn' ? 'ಕಾರ್ಡ್‌ದಾರರ ಹೆಸರು' : 'Cardholder Name'}</label>
                          <input 
                            type="text" 
                            required
                            className="form-control" 
                            placeholder="Sachin Kumar" 
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'netbanking' && (
                      <div className="form-group">
                        <label className="form-label">{currentLang === 'kn' ? 'ಬ್ಯಾಂಕ್ ಆಯ್ಕೆಮಾಡಿ' : 'Select Bank'}</label>
                        <select className="form-control">
                          <option>State Bank of India (SBI)</option>
                          <option>HDFC Bank</option>
                          <option>ICICI Bank</option>
                          <option>Axis Bank</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <button type="submit" className="btn btn-primary btn-block btn-payment-action glow-cyan">
                    {currentLang === 'kn' ? 'ಸುರಕ್ಷಿತ ಪಾವತಿ ಮಾಡಿ' : 'PROCEED TO SECURE PAYMENT'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .profile-split-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        @media (min-width: 1024px) {
          .profile-split-grid {
            grid-template-columns: 1.2fr 1fr;
          }
        }

        .profile-form-card {
          text-align: left;
        }

        .profile-hero-badge {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          border-bottom: 1px solid var(--border-glass);
          padding-bottom: 20px;
        }

        .profile-avatar-large {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--secondary-cyan), var(--primary-neon));
          color: #000;
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 15px rgba(0, 240, 255, 0.3);
        }

        .profile-hero-badge h2 {
          font-size: 1.4rem;
        }

        .profile-hero-badge .sub {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .success-banner {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid #10b981;
          color: #10b981;
          padding: 10px 14px;
          border-radius: var(--border-radius-sm);
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
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

        /* Upgrade and premium cards */
        .subscription-card {
          border-left: 4px solid var(--secondary-cyan);
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.02) 0%, rgba(13, 18, 34, 0.7) 100%);
          text-align: left;
        }

        .card-header-icon {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .star-icon {
          color: var(--secondary-cyan);
          filter: drop-shadow(0 0 8px var(--secondary-cyan-glow));
        }

        .desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.4;
          margin-bottom: 20px;
        }

        .pricing-flex {
          display: flex;
          justify-content: space-around;
          align-items: center;
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border-glass);
          padding: 14px;
          border-radius: var(--border-radius-md);
          margin-bottom: 20px;
        }

        .price-item {
          text-align: center;
        }

        .price-item .duration {
          font-size: 0.75rem;
          color: var(--text-muted);
          display: block;
        }

        .price-item strong {
          font-family: var(--font-heading);
          font-size: 1.15rem;
          color: var(--text-primary);
        }

        .price-item-divider {
          width: 1px;
          height: 30px;
          background: var(--border-glass);
        }

        /* Settings card controls */
        .settings-card {
          text-align: left;
        }

        .settings-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .reset-btn {
          border-color: rgba(244, 63, 94, 0.3);
          background: rgba(244, 63, 94, 0.03);
          color: var(--text-primary);
        }

        .reset-btn:hover {
          background: var(--accent-rose);
          border-color: var(--accent-rose);
          color: #000;
        }

        /* Payment modal styling */
        .payment-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(4, 7, 20, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }

        .payment-modal-content {
          width: 100%;
          max-width: 500px;
          position: relative;
          padding: 28px;
          border: 1px solid var(--border-glass-bright);
        }

        .payment-modal-close {
          position: absolute;
          top: 14px;
          right: 18px;
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 1.8rem;
          cursor: pointer;
          transition: color 0.2s;
        }

        .payment-modal-close:hover {
          color: var(--accent-rose);
        }

        .payment-modal-header {
          margin-bottom: 20px;
        }

        .payment-modal-header h3 {
          font-size: 1.3rem;
          color: var(--secondary-cyan);
          text-shadow: 0 0 10px rgba(0, 240, 255, 0.2);
          margin-bottom: 4px;
        }

        .payment-plan-selector-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 20px;
        }

        @media (max-width: 480px) {
          .payment-plan-selector-grid {
            grid-template-columns: 1fr;
          }
        }

        .payment-plan-card {
          border: 1px solid var(--border-glass);
          border-radius: var(--border-radius-md);
          padding: 12px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: rgba(255,255,255,0.01);
        }

        .payment-plan-card:hover {
          background: rgba(255,255,255,0.03);
          border-color: rgba(0, 240, 255, 0.3);
        }

        .payment-plan-card.selected {
          border-color: var(--secondary-cyan);
          background: rgba(0, 240, 255, 0.05);
          box-shadow: 0 0 12px rgba(0, 240, 255, 0.1);
        }

        .payment-plan-card .details {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .payment-plan-card .details strong {
          font-size: 0.85rem;
          color: var(--text-primary);
        }

        .payment-plan-card .details span {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        .payment-methods-tabs {
          display: flex;
          border-bottom: 1px solid var(--border-glass);
          margin-bottom: 16px;
        }

        .method-tab {
          flex: 1;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.85rem;
          padding: 8px 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .method-tab:hover {
          color: var(--text-primary);
        }

        .method-tab.active {
          color: var(--secondary-cyan);
          border-bottom-color: var(--secondary-cyan);
        }

        .payment-method-fields-container {
          min-height: 120px;
          margin-bottom: 20px;
        }

        .card-fields-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          text-align: left;
        }

        .card-fields-grid .span-2 {
          grid-column: span 2;
        }

        .field-note {
          font-size: 0.7rem;
          color: var(--text-muted);
          margin-top: 4px;
          display: block;
          text-align: left;
        }

        .btn-payment-action {
          padding: 12px;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        /* Loading Spinner */
        .payment-processing-state {
          padding: 40px 20px;
        }

        .payment-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(0, 240, 255, 0.1);
          border-radius: 50%;
          border-top-color: var(--secondary-cyan);
          animation: spin 1s ease-in-out infinite;
          margin: 0 auto 24px;
          box-shadow: 0 0 15px rgba(0, 240, 255, 0.2);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Payment success */
        .payment-success-state {
          padding: 40px 20px;
        }

        .success-checkmark-wrapper {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.1);
          border: 2px solid #10b981;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
          animation: pulse 1.5s infinite;
        }

        .success-checkmark-icon {
          color: #10b981;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

export default Profile;
