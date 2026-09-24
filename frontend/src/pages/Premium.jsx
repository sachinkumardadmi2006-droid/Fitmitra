import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Check, ShieldCheck, X } from 'lucide-react';
import { getUser, saveUser } from '../utils/db';

const PLANS = [
  {
    id: 'monthly',
    icon: '🔥',
    title: 'MONTHLY',
    price: '₹49',
    period: '/ month',
    rawPrice: 49,
    badge: null,
    features: [
      'All workout levels',
      'Diet plans',
      'Progress tracking',
    ],
  },
  {
    id: '3months',
    icon: '⭐',
    title: '3 MONTHS',
    price: '₹99',
    period: '',
    rawPrice: 99,
    badge: 'BEST VALUE',
    features: [
      'All workout levels',
      'Diet plans',
      'Progress tracking',
      'Premium exercises',
    ],
  },
  {
    id: '6months',
    icon: '💎',
    title: '6 MONTHS',
    price: '₹149',
    period: '',
    rawPrice: 149,
    badge: null,
    features: [
      'All workout levels',
      'Diet plans',
      'Progress tracking',
      'Premium exercises',
    ],
  },
  {
    id: 'yearly',
    icon: '👑',
    title: 'YEARLY',
    price: '₹249',
    period: '/ year',
    rawPrice: 249,
    badge: null,
    features: [
      'All workout levels',
      'Diet plans',
      'Progress tracking',
      'Premium exercises',
      'VIP Support',
    ],
  },
];

function Premium() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const handleOpenPlanModal = (plan) => {
    setSelectedPlan(plan);
    setModalVisible(true);
  };

  const handleProcessPayment = () => {
    if (!selectedPlan) return;
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      setModalVisible(false);

      const updatedUser = {
        ...(user || {}),
        isPremium: true,
        premiumPlan: selectedPlan.id,
        premiumPurchasedAt: new Date().toISOString(),
      };
      saveUser(updatedUser);
      setUser(updatedUser);
      alert(`🎉 Welcome to FitMitra Premium!\nYou have activated the ${selectedPlan.title} plan.`);
      navigate('/dashboard');
    }, 1200);
  };

  return (
    <div className="auth-viewport">
      <div className="mobile-view-wrapper">
        {/* Header Bar */}
        <div className="mobile-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ChevronLeft size={24} />
          </button>
          <span className="header-title">FitMitra Premium</span>
          <div style={{ width: 24 }} />
        </div>

        {/* Main Content */}
        <div className="premium-content">
          {/* Hero Header */}
          <div className="hero-section">
            <div className="hero-emoji">💪</div>
            <h1 className="hero-title">UNLOCK YOUR POTENTIAL</h1>
            <p className="hero-subtitle">Train smarter. Get stronger.</p>
          </div>

          {/* Pricing Cards */}
          <div className="plans-list">
            {PLANS.map((plan) => {
              const isBestValue = plan.badge === 'BEST VALUE';
              return (
                <div
                  key={plan.id}
                  className={`plan-card ${isBestValue ? 'best-value' : ''}`}
                >
                  <div className="plan-card-header">
                    <div className="plan-title-group">
                      <span className="plan-icon">{plan.icon}</span>
                      <span className="plan-name">{plan.title}</span>
                    </div>
                    {isBestValue && <span className="best-value-badge">BEST VALUE</span>}
                  </div>

                  <div className="plan-price-row">
                    <span className="price-val">{plan.price}</span>
                    {plan.period && <span className="price-period">{plan.period}</span>}
                  </div>

                  <ul className="features-list">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="feature-item">
                        <Check size={16} className="check-icon" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`get-plan-btn ${isBestValue ? 'highlight' : ''}`}
                    onClick={() => handleOpenPlanModal(plan)}
                  >
                    Get {plan.price} Plan
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer badge */}
          <div className="footer-payments">
            <div className="secure-head">
              <ShieldCheck size={18} color="#ccff00" />
              <span>Secure payments</span>
            </div>
            <p className="methods-text">UPI • Cards • Net Banking</p>
          </div>
        </div>
      </div>

      {/* CONFIRM YOUR PLAN MODAL */}
      {modalVisible && selectedPlan && (
        <div className="modal-overlay">
          <div className="modal-card">
            <button className="modal-close" onClick={() => !paying && setModalVisible(false)}>
              <X size={20} />
            </button>

            <h3 className="confirm-modal-header">Confirm Your Plan</h3>

            <div className="confirm-modal-body">
              <span className="confirm-brand">FitMitra Premium</span>
              <h2 className="confirm-plan-title">{selectedPlan.title}</h2>
              <div className="confirm-price-tag">{selectedPlan.price}</div>

              <div className="confirm-checklist">
                {selectedPlan.features.map((feat, idx) => (
                  <div key={idx} className="confirm-check-item">
                    <Check size={16} className="check-icon" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <button
                className="confirm-pay-btn"
                onClick={handleProcessPayment}
                disabled={paying}
              >
                {paying ? 'Processing...' : `Pay ${selectedPlan.price}`}
              </button>

              <div className="modal-secure-row">
                <ShieldCheck size={15} color="#4A5568" />
                <span>Secure payment</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .auth-viewport {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: radial-gradient(circle at top right, rgba(204, 255, 0, 0.08), transparent 45%), #060913;
          padding: 20px;
        }
        .mobile-view-wrapper {
          width: 100%;
          max-width: 412px;
          min-height: 720px;
          background: #060913;
          border-radius: 32px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 0 10px rgba(255, 255, 255, 0.05);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          color: #f8fafc;
          font-family: 'Inter', sans-serif;
        }
        @media (max-width: 480px) {
          .auth-viewport { padding: 0; }
          .mobile-view-wrapper { max-width: 100%; border-radius: 0; min-height: 100vh; }
        }
        .mobile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 56px;
          padding: 0 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: #060913;
        }
        .back-btn {
          background: none;
          border: none;
          color: #f8fafc;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .header-title {
          font-size: 18px;
          font-weight: 700;
          color: #f8fafc;
          font-family: 'Outfit', sans-serif;
        }
        .premium-content {
          padding: 24px 20px;
          overflow-y: auto;
          flex: 1;
        }
        .hero-section {
          text-align: center;
          margin-bottom: 24px;
        }
        .hero-emoji {
          font-size: 36px;
          margin-bottom: 8px;
        }
        .hero-title {
          font-size: 20px;
          font-weight: 900;
          color: #f8fafc;
          letter-spacing: 0.5px;
          font-family: 'Outfit', sans-serif;
        }
        .hero-subtitle {
          font-size: 14px;
          color: #94a3b8;
          margin-top: 4px;
        }
        .plans-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 28px;
        }
        .plan-card {
          background: #0d1222;
          border-radius: 20px;
          border: 1.5px solid rgba(255, 255, 255, 0.15);
          padding: 20px;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s;
        }
        .plan-card.best-value {
          border-color: #ccff00;
          background: rgba(204, 255, 0, 0.04);
          box-shadow: 0 0 20px rgba(204, 255, 0, 0.15);
        }
        .plan-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .plan-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .plan-icon {
          font-size: 20px;
        }
        .plan-name {
          font-size: 16px;
          font-weight: 800;
          color: #f8fafc;
          font-family: 'Outfit', sans-serif;
        }
        .best-value-badge {
          background: #ccff00;
          color: #000000;
          font-size: 10px;
          font-weight: 900;
          padding: 4px 10px;
          border-radius: 12px;
          letter-spacing: 0.5px;
        }
        .plan-price-row {
          margin-bottom: 16px;
          display: flex;
          align-items: baseline;
        }
        .price-val {
          font-size: 28px;
          font-weight: 900;
          color: #f8fafc;
        }
        .price-period {
          font-size: 14px;
          color: #94a3b8;
          margin-left: 4px;
        }
        .features-list {
          list-style: none;
          padding: 0;
          margin: 0 0 20px 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .feature-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: #94a3b8;
        }
        .check-icon {
          color: #ccff00;
          flex-shrink: 0;
        }
        .get-plan-btn {
          height: 48px;
          border-radius: 14px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: #f8fafc;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .get-plan-btn.highlight {
          background: #ccff00;
          color: #000000;
          font-weight: 800;
        }
        .footer-payments {
          text-align: center;
          padding-vertical: 12px;
        }
        .secure-head {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 700;
          color: #f8fafc;
        }
        .methods-text {
          font-size: 13px;
          color: #94a3b8;
          margin-top: 4px;
        }
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 1000;
        }
        .modal-card {
          width: 100%;
          max-width: 360px;
          background: #FFFFFF;
          border-radius: 24px;
          padding: 24px;
          position: relative;
          color: #1A202C;
          text-align: center;
        }
        .modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          color: #4A5568;
          cursor: pointer;
        }
        .confirm-modal-header {
          font-size: 18px;
          font-weight: 800;
          color: #1A202C;
          font-family: 'Outfit', sans-serif;
          margin-bottom: 16px;
        }
        .confirm-brand {
          font-size: 14px;
          color: #4A5568;
        }
        .confirm-plan-title {
          font-size: 20px;
          font-weight: 800;
          color: #1A202C;
          margin: 4px 0 0 0;
        }
        .confirm-price-tag {
          font-size: 32px;
          font-weight: 900;
          color: #1A202C;
          margin: 16px 0;
        }
        .confirm-checklist {
          background: #F8FAFC;
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
          text-align: left;
        }
        .confirm-check-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #1A202C;
        }
        .confirm-pay-btn {
          width: 100%;
          height: 52px;
          background: #1A202C;
          color: #FFFFFF;
          border: none;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          margin-bottom: 16px;
        }
        .modal-secure-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 13px;
          color: #4A5568;
        }
      `}</style>
    </div>
  );
}

export default Premium;
