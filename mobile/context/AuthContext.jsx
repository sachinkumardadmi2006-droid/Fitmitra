import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authService } from '../services';
import { clearUserCache } from '../services/queryClient';
import { onDbUpdate } from '../utils/events';

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
  syncSession: () => {},
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
      setIsOnboarded(Boolean(onboarded || localUser?.isOnboarded));

      // Fetch live server session via GET /api/v1/users/me (single source of truth for emailVerified & isOnboarded)
      try {
        const meRes = await authService.getCurrentUser();
        const serverUser = meRes?.user || meRes?.data?.user;
        const serverProfile = meRes?.profile || meRes?.data?.profile;

        if (serverUser) {
          const mergedUser = { ...localUser, ...serverUser };
          setUser(mergedUser);
          await authService.saveLocalUser(mergedUser);

          const serverOnboarded = Boolean(serverUser.isOnboarded);
          setIsOnboarded(serverOnboarded);
          await authService.setOnboardedStatus(serverOnboarded, false);
        }

        if (serverProfile) {
          setProfile(serverProfile);
        }
      } catch (meErr) {
        // If 401 / session expired, unrecoverable authentication failure -> clear session
        if (meErr?.status === 401 || /session expired|unauthorized/i.test(String(meErr?.message || ''))) {
          await authService.logout().catch(() => {});
          await clearUserCache();
          setUser(null);
          setProfile(null);
          setIsOnboarded(false);
        } else {
          // Network / offline error: retain cached localUser and onboarded status
          console.warn('[AuthContext] GET /users/me deferred (offline/network):', meErr?.message || meErr);
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

  // Subscribe to DB updates across services to keep in-memory AuthContext synced
  useEffect(() => {
    const unsubscribe = onDbUpdate(async () => {
      try {
        const localUser = await authService.getLocalUser();
        const onboarded = await authService.getOnboardedStatus();
        if (localUser) {
          setUser(localUser);
          if (localUser.isOnboarded || onboarded) {
            setIsOnboarded(true);
          }
        }
      } catch (_) {}
    });
    return unsubscribe;
  }, []);

  const syncSession = useCallback(async (updatedUser, updatedProfile = null, forcedOnboarded = null) => {
    if (updatedUser) {
      setUser(updatedUser);
    }
    if (updatedProfile) {
      setProfile(updatedProfile);
    }
    if (forcedOnboarded !== null && forcedOnboarded !== undefined) {
      const ob = Boolean(forcedOnboarded);
      setIsOnboarded(ob);
      await authService.setOnboardedStatus(ob, false);
    } else if (updatedProfile) {
      const hasBio = Boolean(
        updatedProfile?.heightCm &&
        (updatedProfile?.weight !== undefined || updatedProfile?.weightKg !== undefined)
      );
      const hasP = Boolean(
        (updatedProfile?.selectedGoal || updatedProfile?.goal) &&
        updatedProfile?.selectedWorkoutPlan
      );
      const isOb = Boolean((hasBio && hasP) || updatedUser?.isOnboarded);
      setIsOnboarded(isOb);
      await authService.setOnboardedStatus(isOb, false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const meRes = await authService.getCurrentUser();
      const serverUser = meRes?.user || meRes?.data?.user;
      const serverProfile = meRes?.profile || meRes?.data?.profile;

      if (serverUser) {
        setUser((prev) => ({ ...prev, ...serverUser }));
        await authService.saveLocalUser(serverUser);
        const serverOnboarded = Boolean(serverUser.isOnboarded);
        setIsOnboarded(serverOnboarded);
        await authService.setOnboardedStatus(serverOnboarded, false);
      }

      if (serverProfile) {
        setProfile(serverProfile);
      }
      return serverProfile || meRes;
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
      syncSession,
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
      syncSession,
      logout,
      loadSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
