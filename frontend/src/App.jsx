import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getUser, saveUser } from './utils/db';
import Layout from './layouts/Layout';

// Pages import
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Workouts from './pages/Workouts';
import WorkoutDetails from './pages/WorkoutDetails';
import Nutrition from './pages/Nutrition';
import Programs from './pages/Programs';
import Progress from './pages/Progress';
import Profile from './pages/Profile';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserSession = () => {
    const sessionUser = getUser();
    // In our client-side prototype, a user is considered logged in if we have
    // their session initialized in DB (defaults to Sachin on guest access, or custom on signup)
    if (localStorage.getItem('fitmitra_user')) {
      setUser(sessionUser);
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserSession();
    window.addEventListener('fitmitra_db_update', fetchUserSession);
    return () => window.removeEventListener('fitmitra_db_update', fetchUserSession);
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleSignupSuccess = (newUser) => {
    setUser(newUser);
  };

  const handleOnboardingComplete = (onboardedUser) => {
    setUser(onboardedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('fitmitra_user');
    localStorage.removeItem('fitmitra_workout_history');
    localStorage.removeItem('fitmitra_nutrition_logs');
    localStorage.removeItem('fitmitra_weight_history');
    setUser(null);
    // Force direct window event to refresh components
    window.dispatchEvent(new Event('fitmitra_db_update'));
  };

  // Protected Route wrapper component
  const ProtectedRoute = ({ children }) => {
    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading session...</div>;
    return user ? children : <Navigate to="/login" replace />;
  };

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          {/* Public Landing Page - Redirect to login page first */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Authentication Routes */}
          <Route 
            path="/login" 
            element={<Login onLoginSuccess={handleLoginSuccess} />} 
          />
          <Route 
            path="/signup" 
            element={<Signup onSignupSuccess={handleSignupSuccess} />} 
          />

          {/* Onboarding Wizard */}
          <Route 
            path="/onboarding" 
            element={
              <ProtectedRoute>
                <Onboarding user={user} onOnboardingComplete={handleOnboardingComplete} />
              </ProtectedRoute>
            } 
          />

          {/* Dashboard Workspace */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          {/* Workouts Catalogue */}
          <Route 
            path="/workouts" 
            element={
              <ProtectedRoute>
                <Workouts />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/workouts/:workoutId" 
            element={
              <ProtectedRoute>
                <WorkoutDetails />
              </ProtectedRoute>
            } 
          />

          {/* Nutrition & Diet log */}
          <Route 
            path="/nutrition" 
            element={
              <ProtectedRoute>
                <Nutrition />
              </ProtectedRoute>
            } 
          />

          {/* Training Programs */}
          <Route 
            path="/programs" 
            element={
              <ProtectedRoute>
                <Programs />
              </ProtectedRoute>
            } 
          />

          {/* Weight & Exercises Progress logs */}
          <Route 
            path="/progress" 
            element={
              <ProtectedRoute>
                <Progress />
              </ProtectedRoute>
            } 
          />

          {/* User Profile settings */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
