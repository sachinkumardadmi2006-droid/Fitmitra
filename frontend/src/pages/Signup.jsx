import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { requestOtp, verifyOtp } from '../utils/db';

function Signup({ onSignupSuccess }) {
  const navigate = useNavigate();

  // Views: 'form' (default), 'otp'
  const [view, setView] = useState('form');

  // Input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  // OTP states
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const otpInputsRef = useRef([]);

  // Common errors/loading states
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-focus and countdown for OTP timer
  useEffect(() => {
    let interval;
    if (view === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [view, timer]);

  // Check form validity
  const isFormValid = name.trim().length > 0 && 
                      email.trim().includes('@') && 
                      phone.trim().length === 10 && 
                      agreeTerms;

  // Handle requesting OTP on Sign Up
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!isFormValid) return;

    setError('');
    setLoading(true);
    try {
      // requestOtp parameter: phone, email, name, isSignup = true
      await requestOtp(phone, email, name, true);
      setView('otp');
      setTimer(30);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => {
        if (otpInputsRef.current[0]) otpInputsRef.current[0].focus();
      }, 100);
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit entry
  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputsRef.current[index + 1].focus();
    }
  };

  // Handle OTP backspace back-shifting
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        otpInputsRef.current[index - 1].focus();
      }
    }
  };

  // Handle OTP verification for Sign Up
  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setError('Please enter all 6 digits of the OTP.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const userData = await verifyOtp(phone, otpCode);
      onSignupSuccess(userData);
      navigate('/onboarding');
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP code
  const handleResendOtp = async () => {
    if (timer > 0) return;
    setError('');
    try {
      await requestOtp(phone, email, name, true);
      setTimer(30);
      setOtp(['', '', '', '', '', '']);
      if (otpInputsRef.current[0]) otpInputsRef.current[0].focus();
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    }
  };

  const isOtpComplete = otp.join('').length === 6;

  // Render OTP Verification View
  if (view === 'otp') {
    return (
      <div className="auth-viewport">
        <div className="mobile-view-wrapper">
          {/* OTP Verification Header */}
          <div className="mobile-header">
            <button className="back-btn" onClick={() => setView('form')} disabled={loading}>
              <ChevronLeft size={24} />
            </button>
            <span className="header-title">OTP Verification</span>
            <button 
              className={`header-action-btn ${isOtpComplete ? 'active' : ''}`}
              onClick={handleVerifyOtp}
              disabled={loading || !isOtpComplete}
            >
              {loading ? '...' : 'Verify'}
            </button>
          </div>

          <div className="otp-content">
            <div className="otp-title-section">
              <p className="otp-description">
                A 6-digit code has been sent to <span className="bold-detail">{phone}</span> and <span className="bold-detail">{email}</span>
              </p>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="otp-inputs-row">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="text"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  className="otp-box"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  ref={(el) => (otpInputsRef.current[idx] = el)}
                  disabled={loading}
                />
              ))}
            </div>

            <div className="timer-section">
              {timer > 0 ? (
                <p className="timer-text">Resend OTP in {timer}s</p>
              ) : (
                <button className="resend-link" onClick={handleResendOtp} disabled={loading}>
                  Resend OTP
                </button>
              )}
            </div>
          </div>
        </div>

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
            background: #FFFFFF;
            border-radius: 32px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 0 10px rgba(255, 255, 255, 0.05);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            color: #1a202c;
            font-family: 'Inter', sans-serif;
          }
          @media (max-width: 480px) {
            .auth-viewport {
              padding: 0;
            }
            .mobile-view-wrapper {
              max-width: 100%;
              border-radius: 0;
              min-height: 100vh;
            }
          }
          .mobile-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 56px;
            padding: 0 16px;
            border-bottom: 1px solid #E2E8F0;
            background: #FFFFFF;
          }
          .back-btn {
            background: none;
            border: none;
            color: #4A5568;
            cursor: pointer;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .header-title {
            font-size: 17px;
            font-weight: 600;
            color: #1A202C;
            font-family: 'Outfit', sans-serif;
          }
          .header-action-btn {
            background: none;
            border: none;
            color: #A0AEC0;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            padding: 4px 8px;
            transition: color 0.2s;
          }
          .header-action-btn.active {
            color: #3182CE;
          }
          .otp-content {
            padding: 24px;
            display: flex;
            flex-direction: column;
            flex: 1;
          }
          .otp-title-section {
            margin-bottom: 32px;
          }
          .otp-description {
            font-size: 15px;
            color: #4A5568;
            line-height: 1.5;
          }
          .bold-detail {
            font-weight: 600;
            color: #1A202C;
          }
          .error-banner {
            background: #FFF5F5;
            border: 1px solid #FEB2B2;
            color: #C53030;
            padding: 12px;
            border-radius: 8px;
            font-size: 13px;
            margin-bottom: 24px;
            line-height: 1.4;
          }
          .otp-inputs-row {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 32px;
          }
          .otp-box {
            width: 48px;
            height: 48px;
            border: 1px solid #CBD5E0;
            border-radius: 8px;
            font-size: 20px;
            font-weight: 700;
            text-align: center;
            color: #1A202C;
            background: #FFFFFF;
            transition: all 0.2s;
          }
          .otp-box:focus {
            border-color: #D4AF37;
            outline: none;
            box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.15);
          }
          .timer-section {
            display: flex;
            justify-content: center;
            margin-top: 16px;
          }
          .timer-text {
            font-size: 14px;
            color: #718096;
          }
          .resend-link {
            background: none;
            border: none;
            color: #3182CE;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: underline;
          }
        `}</style>
      </div>
    );
  }

  // Render Signup Form View
  return (
    <div className="auth-viewport">
      <div className="mobile-view-wrapper">
        {/* Header Bar */}
        <div className="mobile-header">
          <Link to="/login" className="back-btn">
            <ChevronLeft size={24} />
          </Link>
          <span className="header-title">Sign up</span>
          <button 
            className={`header-action-btn ${isFormValid ? 'active' : ''}`}
            onClick={handleRequestOtp}
            disabled={loading || !isFormValid}
          >
            {loading ? '...' : 'Get OTP'}
          </button>
        </div>

        {/* Content Container */}
        <div className="form-content">
          <h2 className="signup-title">Let's get you started!</h2>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleRequestOtp} className="signup-form">
            
            {/* NAME FIELD */}
            <div className={`form-field-wrapper ${focusedField === 'name' ? 'focused' : ''}`}>
              {name.length > 0 || focusedField === 'name' ? (
                <span className="field-label-small">Name</span>
              ) : null}
              <input
                type="text"
                placeholder={focusedField === 'name' ? '' : 'Name'}
                className="input-box"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField('')}
                disabled={loading}
              />
            </div>

            {/* EMAIL FIELD */}
            <div className={`form-field-wrapper ${focusedField === 'email' ? 'focused' : ''}`} style={{ marginTop: '16px' }}>
              {email.length > 0 || focusedField === 'email' ? (
                <span className="field-label-small">Email ID</span>
              ) : null}
              <input
                type="email"
                placeholder={focusedField === 'email' ? '' : 'Email ID'}
                className="input-box"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField('')}
                disabled={loading}
              />
            </div>

            {/* PHONE FIELD WITH FLAG */}
            <div className={`form-field-wrapper phone-layout ${focusedField === 'phone' ? 'focused' : ''}`} style={{ marginTop: '16px' }}>
              <span className="country-flag">🇮🇳</span>
              <input
                type="tel"
                placeholder="Phone number"
                className="input-box phone-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').substring(0, 10))}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField('')}
                maxLength="10"
                disabled={loading}
              />
            </div>

            {/* Terms Checkbox */}
            <div className="terms-checkbox-row" style={{ marginTop: '24px' }}>
              <input
                type="checkbox"
                id="terms"
                className="custom-checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="terms" className="checkbox-text-label">
                I have read and agree to the <a href="#terms" className="blue-link">Terms of Service</a> and <a href="#privacy" className="blue-link">Privacy Policy</a>.
              </label>
            </div>
          </form>

          {/* Footer redirection links */}
          <p className="already-user-footer">
            Already have an account? <Link to="/login" className="blue-link">Login</Link>
          </p>
        </div>
      </div>

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
          background: #FFFFFF;
          border-radius: 32px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 0 10px rgba(255, 255, 255, 0.05);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          color: #1a202c;
          font-family: 'Inter', sans-serif;
        }
        @media (max-width: 480px) {
          .auth-viewport {
            padding: 0;
          }
          .mobile-view-wrapper {
            max-width: 100%;
            border-radius: 0;
            min-height: 100vh;
          }
        }
        
        .mobile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 56px;
          padding: 0 16px;
          border-bottom: 1px solid #E2E8F0;
          background: #FFFFFF;
        }
        .back-btn {
          background: none;
          border: none;
          color: #4A5568;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .header-title {
          font-size: 17px;
          font-weight: 600;
          color: #1A202C;
          font-family: 'Outfit', sans-serif;
        }
        .header-action-btn {
          background: none;
          border: none;
          color: #A0AEC0;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 8px;
          transition: color 0.2s;
        }
        .header-action-btn.active {
          color: #3182CE;
        }

        .form-content {
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .signup-title {
          font-size: 20px;
          font-weight: 700;
          color: #1A202C;
          font-family: 'Outfit', sans-serif;
          margin-bottom: 24px;
        }

        .error-banner {
          background: #FFF5F5;
          border: 1px solid #FEB2B2;
          color: #C53030;
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 20px;
          line-height: 1.4;
        }

        .signup-form {
          display: flex;
          flex-direction: column;
        }

        .form-field-wrapper {
          display: flex;
          flex-direction: column;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          height: 56px;
          padding: 6px 16px;
          background: #FFFFFF;
          justify-content: center;
          transition: all 0.2s;
          position: relative;
        }

        .form-field-wrapper.focused {
          border-color: #D4AF37;
          box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.15);
        }

        .field-label-small {
          font-size: 11px;
          font-weight: 600;
          color: #D4AF37;
          line-height: 1;
          margin-bottom: 2px;
        }

        .input-box {
          border: none;
          background: transparent;
          font-size: 15px;
          color: #1A202C;
          width: 100%;
          padding: 0;
          margin-top: 1px;
        }

        .input-box:focus {
          outline: none;
        }

        .phone-layout {
          flex-direction: row;
          align-items: center;
          gap: 12px;
        }

        .country-flag {
          font-size: 20px;
          display: flex;
          align-items: center;
        }

        .phone-input {
          flex: 1;
          margin-top: 0;
        }

        .terms-checkbox-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .custom-checkbox {
          width: 18px;
          height: 18px;
          margin-top: 2px;
          cursor: pointer;
        }

        .checkbox-text-label {
          font-size: 13px;
          color: #4A5568;
          line-height: 1.55;
          cursor: pointer;
        }

        .blue-link {
          color: #3182CE;
          font-weight: 600;
        }

        .blue-link:hover {
          text-decoration: underline;
        }

        .already-user-footer {
          text-align: center;
          font-size: 14px;
          color: #4A5568;
          margin-top: auto;
          padding-top: 32px;
        }
      `}</style>
    </div>
  );
}

export default Signup;
