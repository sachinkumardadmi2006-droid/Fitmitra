import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, profileService } from '../services';
import { onDbUpdate } from '../utils/events';

const AuthContext = createContext({
  user: null,
  profile: null,
  points: 0,
  lifetimePoints: 0,
  isLoading: true,
  isAuthenticated: false,
  refreshProfile: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSession = useCallback(async () => {
    try {
      const localUser = await authService.getLocalUser();
      setUser(localUser);

      // Fetch live server profile (points, biometrics)
      try {
        const p = await profileService.getProfile();
        if (p) {
          setProfile(p);
        }
      } catch (_) {
        // Dev fallback or offline
      }
    } catch (e) {
      console.warn('Auth context loadSession error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
    const unsub = onDbUpdate(loadSession);
    return unsub;
  }, [loadSession]);

  const refreshProfile = async () => {
    try {
      const p = await profileService.getProfile();
      if (p) setProfile(p);
      return p;
    } catch (_) {
      return null;
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setProfile(null);
  };

  const points = profile?.points ?? 0;
  const lifetimePoints = profile?.lifetimePoints ?? 0;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        points,
        lifetimePoints,
        isLoading,
        isAuthenticated: !!user,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
