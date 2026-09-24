import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { signupUser } from '../utils/db';

function Signup({ onSignupSuccess }) {
  const navigate = useNavigate();

  // Input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  // Common errors/loading states
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check form validity
  const isFormValid = name.trim().length > 0 && 
                      email.trim().includes('@') && 
                      password.length > 0 && 
                      confirmPassword.length > 0 && 
                      agreeTerms;

  // Handle Sign Up Submission
  const handleSignup = async (e) => {
    if (e) e.preventDefault();
    if (!isFormValid) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const userData = await signupUser(name.trim(), email.trim(), password);
      if (onSignupSuccess) {
        onSignupSuccess(userData);
      }
      navigate('/onboarding');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            onClick={handleSignup}
            disabled={loading || !isFormValid}
          >
            {loading ? '...' : 'Sign up'}
          </button>
        </div>

        {/* Content Container */}
        <div className="form-content">
          <h2 className="signup-title">Let's get you started!</h2>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSignup} className="signup-form">
            
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

            {/* PASSWORD FIELD */}
            <div className={`form-field-wrapper ${focusedField === 'password' ? 'focused' : ''}`} style={{ marginTop: '16px' }}>
              {password.length > 0 || focusedField === 'password' ? (
                <span className="field-label-small">Password</span>
              ) : null}
              <input
                type="password"
                placeholder={focusedField === 'password' ? '' : 'Password'}
                className="input-box"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
                disabled={loading}
              />
            </div>

            {/* CONFIRM PASSWORD FIELD */}
            <div className={`form-field-wrapper ${focusedField === 'confirmPassword' ? 'focused' : ''}`} style={{ marginTop: '16px' }}>
              {confirmPassword.length > 0 || focusedField === 'confirmPassword' ? (
                <span className="field-label-small">Confirm Password</span>
              ) : null}
              <input
                type="password"
                placeholder={focusedField === 'confirmPassword' ? '' : 'Confirm Password'}
                className="input-box"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField('')}
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

            {/* SIGNUP BUTTON */}
            <button
              type="submit"
              className={`submit-btn ${isFormValid ? 'active' : ''}`}
              style={{ marginTop: '24px' }}
              disabled={loading || !isFormValid}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
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

        .submit-btn {
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

        .submit-btn.active {
          background: #1A202C;
          color: #FFFFFF;
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

