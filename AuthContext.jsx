import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';
import { Preferences } from '@capacitor/preferences';

const USER_CACHE_KEY = 'routenet_cached_user';
const EXPLICIT_LOGOUT_KEY = 'routenet_explicit_logout';

async function saveCachedUser(user) {
  try {
    await Preferences.set({ key: USER_CACHE_KEY, value: JSON.stringify(user) });
  } catch (e) {}
}

async function loadCachedUser() {
  try {
    const { value } = await Preferences.get({ key: USER_CACHE_KEY });
    return value ? JSON.parse(value) : null;
  } catch (e) {
    return null;
  }
}

async function clearCachedUser() {
  try {
    await Preferences.remove({ key: USER_CACHE_KEY });
  } catch (e) {}
}

// Wraps any promise with a timeout so network hangs don't freeze the app
function withTimeout(promise, ms = 8000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), ms)
    ),
  ]);
}

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  const getRedirectUrl = useCallback(() => window.location.href, []);

  const checkUserAuth = useCallback(async () => {
    try {
      setIsLoadingAuth(true);

      const { value: explicitLogout } = await Preferences.get({ key: EXPLICIT_LOGOUT_KEY });
      if (explicitLogout === '1') {
        setUser(null);
        setIsAuthenticated(false);
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
        setIsLoadingAuth(false);
        return;
      }

      const currentUser = await withTimeout(base44.auth.me(), 8000);

      await Preferences.remove({ key: EXPLICIT_LOGOUT_KEY });
      await saveCachedUser(currentUser);

      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
      setIsLoadingAuth(false);
    } catch (error) {
      const { value: explicitLogout } = await Preferences.get({ key: EXPLICIT_LOGOUT_KEY });
      const cachedUser = explicitLogout === '1' ? null : await loadCachedUser();

      if (cachedUser) {
        console.log('[AuthContext] Network error — using cached user for offline boot');
        setUser(cachedUser);
        setIsAuthenticated(true);
        setAuthError(null);
        setIsLoadingAuth(false);
        return;
      }

      setUser(null);
      setIsAuthenticated(false);
      setIsLoadingAuth(false);

      if (error?.status === 401 || error?.status === 403) {
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      } else {
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      }
    }
  }, []);

  const checkAppState = useCallback(async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      const appClient = createAxiosClient({
        baseURL: `${appParams.serverUrl}/api/apps/public`,
        headers: { 'X-App-Id': appParams.appId },
        token: appParams.token,
        interceptResponses: true
      });

      const publicSettings = await withTimeout(
        appClient.get(`/prod/public-settings/by-id/${appParams.appId}`),
        8000
      );
      setAppPublicSettings(publicSettings);

      const { value: explicitLogout } = await Preferences.get({ key: EXPLICIT_LOGOUT_KEY });

      if (appParams.token && explicitLogout !== '1') {
        await checkUserAuth();
      } else {
        const cachedUser = explicitLogout === '1' ? null : await loadCachedUser();

        if (cachedUser) {
          console.log('[AuthContext] No token — using cached user');
          setUser(cachedUser);
          setIsAuthenticated(true);
          setAuthError(null);
          setIsLoadingPublicSettings(false);
          setIsLoadingAuth(false);
          return;
        }

        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      }

      setIsLoadingPublicSettings(false);
    } catch (appError) {
      const { value: explicitLogout } = await Preferences.get({ key: EXPLICIT_LOGOUT_KEY });
      const cachedUser = explicitLogout === '1' ? null : await loadCachedUser();

      if (cachedUser) {
        console.log('[AuthContext] Network failed — using cached user for offline boot');
        setAppPublicSettings(null);
        setUser(cachedUser);
        setIsAuthenticated(true);
        setAuthError(null);
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
        return;
      }

      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({ type: 'auth_required', message: 'Authentication required' });
    }
  }, [checkUserAuth]);

  useEffect(() => {
    checkAppState();
  }, [checkAppState]);

  const navigateToLogin = useCallback(() => {
    base44.auth.redirectToLogin(getRedirectUrl());
  }, [getRedirectUrl]);

  const logout = useCallback(async (shouldRedirect = true) => {
    try {
      await Preferences.set({ key: EXPLICIT_LOGOUT_KEY, value: '1' });
    } catch (e) {}

    await clearCachedUser();

    try {
      localStorage.removeItem('base44_access_token');
      localStorage.removeItem('base44_token');
    } catch (e) {}

    setUser(null);
    setIsAuthenticated(false);
    setAuthError({ type: 'auth_required', message: 'Authentication required' });

    if (shouldRedirect) {
      base44.auth.logout(getRedirectUrl());
    } else {
      await base44.auth.logout();
    }
  }, [getRedirectUrl]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        logout,
        navigateToLogin,
        checkAppState
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
