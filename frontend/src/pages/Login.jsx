import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { loginUser, requestOtp, verifyOtp } from '../utils/db';

function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  
  // Views: 'phone' (default), 'email', 'otp'
  const [view, setView] = useState('phone');
  
  // Form values
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // OTP Verification state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const otpInputsRef = useRef([]);

  // Auto focus OTP countdown
  useEffect(() => {
    let interval;
    if (view === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [view, timer]);

  // Handle phone submission (Request OTP)
  const handlePhoneSubmit = async (e) => {
    if (e) e.preventDefault();
    if (phone.length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // Trigger request-otp on backend (isSignup = false)
      const res = await requestOtp(phone, '', '', false);
      // Store the email returned by the backend for displaying in verification screen
      setEmail(res.email || '');
      setView('otp');
      setTimer(30);
      setOtp(['', '', '', '', '', '']);
      // Focus first OTP field on transition
      setTimeout(() => {
        if (otpInputsRef.current[0]) otpInputsRef.current[0].focus();
      }, 100);
    } catch (err) {
      setError(err.message || 'User not found. Please Sign Up.');
    } finally {
      setLoading(false);
    }
  };

  // Handle standard email login
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const userData = await loginUser(email, password);
      onLoginSuccess(userData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
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

  // Handle verifying OTP code
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
      onLoginSuccess(userData);
      navigate('/dashboard');
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
      await requestOtp(phone, '', '', false);
      setTimer(30);
      setOtp(['', '', '', '', '', '']);
      if (otpInputsRef.current[0]) otpInputsRef.current[0].focus();
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    }
  };

  const isPhoneValid = phone.length === 10;
  const isOtpComplete = otp.join('').length === 6;

  // Render OTP Verification view
  if (view === 'otp') {
    return (
      <div className="auth-viewport">
        <div className="mobile-view-wrapper">
          {/* OTP Verification Header */}
          <div className="mobile-header">
            <button className="back-btn" onClick={() => setView('phone')} disabled={loading}>
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
                A 6-digit code has been sent to <span className="bold-detail">{phone}</span> and <span className="bold-detail">{email || 'sachinkumardadmi2006@gmail.com'}</span>
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

        {/* Local component styles */}
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

  // Render Phone / Email Login screens
  return (
    <div className="auth-viewport">
      <div className="mobile-view-wrapper">
        {/* Top Section - Golden Yellow Background with Logo */}
        <div className="top-branding-bar">
          <div className="logo-circle">
            {/* Custom high fidelity FitMitra logo */}
            <svg width="84" height="84" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F4D024" />
                  <stop offset="100%" stopColor="#D4AF37" />
                </linearGradient>
              </defs>
              {/* White circle background */}
              <circle cx="50" cy="50" r="48" fill="#FFFFFF" />
              
              {/* Left side: Stylized dumbbell fitness icon */}
              <g transform="translate(4, 0)">
                {/* Shield/Hexagon background on the left */}
                <polygon points="18,32 34,22 34,78 18,68 11,50" fill="url(#logo-grad)" />
                <polygon points="20,34 32,25 32,75 20,66 14,50" fill="#1A202C" />
                
                {/* Dumbbell icon inside polygon */}
                <rect x="20" y="47" width="12" height="6" rx="1" fill="#FFFFFF" />
                <rect x="16" y="38" width="4" height="24" rx="1.5" fill="url(#logo-grad)" />
                <rect x="13" y="42" width="3" height="16" rx="1" fill="#EFC31A" />
                <rect x="32" y="38" width="4" height="24" rx="1.5" fill="url(#logo-grad)" />
                <rect x="36" y="42" width="3" height="16" rx="1" fill="#EFC31A" />
              </g>
              
              {/* Right side: Branding Text */}
              <text x="46" y="46" fontFamily="'Outfit', sans-serif" fontSize="12.5" fontWeight="900" fill="#1A202C" letterSpacing="-0.5">FIT</text>
              <text x="46" y="58" fontFamily="'Outfit', sans-serif" fontSize="10.5" fontWeight="700" fill="#D4AF37" letterSpacing="0.2">MITRA</text>
              <text x="46" y="67" fontFamily="'Inter', sans-serif" fontSize="4.5" fontWeight="700" fill="#718096" letterSpacing="1">COACH</text>
            </svg>
          </div>
        </div>

        {/* Bottom Section - Overlapping Light Blue-Gray Form Card */}
        <div className="form-card-overlap">
          <h2>Login to FitMitra<br />Health & Fitness</h2>
          <p className="card-subtitle">Welcome back! Please enter your details.</p>

          {error && <div className="error-alert-box">{error}</div>}

          {view === 'phone' ? (
            /* PHONE LOGIN FORM */
            <form onSubmit={handlePhoneSubmit} className="interactive-form">
              <div className="phone-input-field">
                <span className="country-code">+91</span>
                <span className="field-divider"></span>
                <input
                  type="tel"
                  placeholder="Enter your phone"
                  className="phone-entry-box"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').substring(0, 10))}
                  maxLength="10"
                  disabled={loading}
                />
              </div>

              <button 
                type="submit" 
                className={`action-submit-btn ${isPhoneValid ? 'active' : ''}`}
                disabled={loading || !isPhoneValid}
              >
                {loading ? 'Requesting...' : 'Request OTP'}
              </button>

              <div className="or-divider-row">
                <span className="divider-line"></span>
                <span className="divider-text">OR</span>
                <span className="divider-line"></span>
              </div>

              <button 
                type="button" 
                className="switch-auth-link"
                onClick={() => { setView('email'); setError(''); }}
                disabled={loading}
              >
                Login using email
              </button>
            </form>
          ) : (
            /* EMAIL LOGIN FORM */
            <form onSubmit={handleEmailSubmit} className="interactive-form">
              <div className="standard-input-field">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="sachin@fitmitra.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="standard-input-field" style={{ marginTop: '16px' }}>
                <label>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <button 
                type="submit" 
                className="action-submit-btn active"
                disabled={loading}
                style={{ marginTop: '24px' }}
              >
                {loading ? 'Logging in...' : 'Log In'}
              </button>

              <div className="or-divider-row">
                <span className="divider-line"></span>
                <span className="divider-text">OR</span>
                <span className="divider-line"></span>
              </div>

              <button 
                type="button" 
                className="switch-auth-link"
                onClick={() => { setView('phone'); setError(''); }}
                disabled={loading}
              >
                Login using phone
              </button>
            </form>
          )}

          {/* Registration link */}
          <p className="signup-footer-text">
            Not registered yet? <Link to="/signup" className="blue-link">Sign up</Link>
          </p>

          {/* Legal policy disclaimer */}
          <div className="privacy-terms-row">
            By continuing, you agree to our <a href="#terms" className="legal-link">Terms of Service</a> and <a href="#privacy" className="legal-link">Privacy Policy</a>
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
        
        .top-branding-bar {
          background: linear-gradient(180deg, #F4D024 0%, #D4AF37 100%);
          height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        
        .logo-circle {
          width: 110px;
          height: 110px;
          background: #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .form-card-overlap {
          background: #F4F7FB;
          border-radius: 28px 28px 0 0;
          margin-top: -24px;
          flex: 1;
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 10;
        }

        .form-card-overlap h2 {
          font-size: 24px;
          font-weight: 700;
          line-height: 1.25;
          color: #1A202C;
          font-family: 'Outfit', sans-serif;
        }

        .card-subtitle {
          font-size: 14px;
          color: #718096;
          margin-top: 8px;
          margin-bottom: 24px;
        }

        .error-alert-box {
          background: #FFF5F5;
          border: 1px solid #FEB2B2;
          color: #C53030;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 16px;
          line-height: 1.4;
        }

        .interactive-form {
          display: flex;
          flex-direction: column;
        }

        .phone-input-field {
          display: flex;
          align-items: center;
          background: #FFFFFF;
          border: 1px solid #CBD5E0;
          border-radius: 12px;
          height: 52px;
          padding: 0 16px;
          transition: border-color 0.2s;
        }
        
        .phone-input-field:focus-within {
          border-color: #D4AF37;
          box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.15);
        }

        .country-code {
          font-size: 16px;
          font-weight: 700;
          color: #1A202C;
        }

        .field-divider {
          width: 1px;
          height: 20px;
          background: #CBD5E0;
          margin: 0 12px;
        }

        .phone-entry-box {
          border: none;
          flex: 1;
          font-size: 16px;
          color: #1A202C;
          background: transparent;
        }

        .phone-entry-box:focus {
          outline: none;
        }

        .standard-input-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .standard-input-field label {
          font-size: 13px;
          font-weight: 600;
          color: #4A5568;
        }

        .standard-input-field input {
          background: #FFFFFF;
          border: 1px solid #CBD5E0;
          border-radius: 12px;
          height: 48px;
          padding: 0 16px;
          font-size: 15px;
          color: #1A202C;
          transition: border-color 0.2s;
        }

        .standard-input-field input:focus {
          outline: none;
          border-color: #D4AF37;
          box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.15);
        }

        .action-submit-btn {
          margin-top: 16px;
          height: 50px;
          border-radius: 12px;
          border: none;
          background: #E2E8F0;
          color: #A0AEC0;
          font-size: 16px;
          font-weight: 600;
          cursor: not-allowed;
          transition: all 0.2s;
        }

        .action-submit-btn.active {
          background: #1A202C;
          color: #FFFFFF;
          cursor: pointer;
        }

        .action-submit-btn.active:hover {
          opacity: 0.95;
        }

        .or-divider-row {
          display: flex;
          align-items: center;
          margin: 20px 0;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: #E2E8F0;
        }

        .divider-text {
          font-size: 12px;
          font-weight: 600;
          color: #A0AEC0;
          padding: 0 12px;
        }

        .switch-auth-link {
          background: none;
          border: none;
          color: #3182CE;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.2s;
        }

        .switch-auth-link:hover {
          color: #2B6CB0;
          text-decoration: underline;
        }

        .signup-footer-text {
          text-align: center;
          font-size: 14px;
          color: #4A5568;
          margin-top: 32px;
        }

        .blue-link {
          color: #3182CE;
          font-weight: 600;
        }

        .blue-link:hover {
          text-decoration: underline;
        }

        .privacy-terms-row {
          text-align: center;
          font-size: 11px;
          color: #718096;
          line-height: 1.5;
          margin-top: auto;
          padding-top: 24px;
        }

        .legal-link {
          color: #3182CE;
          font-weight: 500;
        }

        .legal-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

export default Login;
