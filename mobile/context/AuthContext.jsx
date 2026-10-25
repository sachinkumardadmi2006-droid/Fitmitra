import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authService, profileService } from '../services';
import { clearUserCache } from '../services/queryClient';

const AuthContext = createContext({
  user: null,
  profile: null,
  points: 0,
  lifetimePoints: 0,
  isLoading: true,
  isAuthenticated: false,
  isOnboarded: false,
  emailVerified: false,
  requiresEmailVerification: false,
  refreshProfile: async () => {},
  logout: async () => {},
  retrySession: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadSession = useCallback(async () => {
    try {
      const token = await authService.getStoredToken();
      const localUser = await authService.getLocalUser();

      if (!token || !localUser) {
        setUser(null);
        setProfile(null);
        setIsOnboarded(false);
        await clearUserCache();
        return;
      }

      setUser(localUser);
      const onboarded = await authService.getOnboardedStatus();
      setIsOnboarded(onboarded);

      // Fetch live server profile once on mount/login
      try {
        const p = await profileService.getProfile();
        if (p) {
          setProfile(p);
          const hasBiometrics = Boolean(
            p?.heightCm && (p?.weight !== undefined || p?.weightKg !== undefined)
          );
          const hasPlan = Boolean((p?.selectedGoal || p?.goal) && p?.selectedWorkoutPlan);
          const serverOnboarded = Boolean(hasBiometrics && hasPlan);
          setIsOnboarded(serverOnboarded);
          await authService.setOnboardedStatus(serverOnboarded, false);

          // Sync emailVerified if server updated it
          if (p?.emailVerified && !localUser.emailVerified) {
            const updatedUser = { ...localUser, emailVerified: true };
            await authService.saveLocalUser(updatedUser);
            setUser(updatedUser);
          }
        }
      } catch (profErr) {
        // If 401 / session expired, unrecoverable authentication failure -> clear session
        if (profErr?.status === 401 || /session expired|unauthorized/i.test(String(profErr?.message || ''))) {
          await authService.logout().catch(() => {});
          await clearUserCache();
          setUser(null);
          setProfile(null);
          setIsOnboarded(false);
        } else {
          // Network / offline error: retain cached localUser and onboarded status
          console.warn('[AuthContext] Profile live fetch deferred (offline/network):', profErr?.message || profErr);
        }
      }
    } catch (e) {
      console.warn('Auth context loadSession error:', e);
      setUser(null);
      setProfile(null);
      setIsOnboarded(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Run initial session load ONCE on app startup
  useEffect(() => {
    let isMounted = true;
    authService.getStoredToken().then(() => {
      if (isMounted) {
        loadSession();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [loadSession]);

  const refreshProfile = useCallback(async () => {
    try {
      const p = await profileService.getProfile();
      if (p) {
        setProfile(p);
        const hasBiometrics = Boolean(
          p?.heightCm && (p?.weight !== undefined || p?.weightKg !== undefined)
        );
        const hasPlan = Boolean((p?.selectedGoal || p?.goal) && p?.selectedWorkoutPlan);
        const serverOnboarded = Boolean(hasBiometrics && hasPlan);
        setIsOnboarded(serverOnboarded);
        await authService.setOnboardedStatus(serverOnboarded, false);

        // Sync local user cache if emailVerified changed
        const local = await authService.getLocalUser();
        if (local && p?.emailVerified && !local.emailVerified) {
          const updatedUser = { ...local, emailVerified: true };
          await authService.saveLocalUser(updatedUser);
          setUser(updatedUser);
        }
      }
      return p;
    } catch (_) {
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (_) {}
    await clearUserCache();
    setUser(null);
    setProfile(null);
    setIsOnboarded(false);
  }, []);

  const emailVerified = Boolean(user?.emailVerified || profile?.emailVerified);
  const isGoogleUser = Boolean(
    user?.authProviders?.includes('GOOGLE') || user?.authProvider === 'GOOGLE'
  );
  const isPasswordUser = Boolean(
    user?.authProviders?.includes('PASSWORD') || (!isGoogleUser && user?.authProvider !== 'GOOGLE')
  );
  const requiresEmailVerification = Boolean(
    user && !emailVerified && isPasswordUser && !isGoogleUser
  );

  const value = useMemo(
    () => ({
      user,
      profile,
      points: profile?.points ?? 0,
      lifetimePoints: profile?.lifetimePoints ?? 0,
      isLoading,
      isAuthenticated: Boolean(user),
      isOnboarded,
      emailVerified,
      requiresEmailVerification,
      refreshProfile,
      logout,
      retrySession: loadSession,
    }),
    [
      user,
      profile,
      isLoading,
      isOnboarded,
      emailVerified,
      requiresEmailVerification,
      refreshProfile,
      logout,
      loadSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
