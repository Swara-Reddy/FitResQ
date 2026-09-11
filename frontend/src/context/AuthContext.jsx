import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService, { parseJwt } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Synchronous session restore on initial evaluation to eliminate redirect flicker on refresh
  const [sessionState, setSessionState] = useState(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const hasCode = Boolean(searchParams.get('code'));
      const hasError = Boolean(searchParams.get('error'));

      // If URL contains OAuth callback parameters, start in callback-loading mode
      if (hasCode) {
        return {
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: true,
          authError: null,
          isCallback: true,
        };
      }

      if (hasError) {
        const error = searchParams.get('error');
        const errorDesc = searchParams.get('error_description');
        let formattedError = errorDesc || error;
        if (error === 'redirect_mismatch') {
          formattedError =
            'Cognito redirect_mismatch: The callback URL "http://localhost:3000/login" is not registered in the AWS Cognito User Pool Client settings. Please add http://localhost:3000/login to "Allowed callback URLs" and "Allowed sign-out URLs" in the AWS Console.';
        }
        return {
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
          authError: formattedError,
          isCallback: false,
        };
      }

      // Restore active session from localStorage
      const session = authService.getSession();
      if (session && session.isAuthenticated) {
        return {
          user: session.user,
          tokens: session.tokens,
          isAuthenticated: true,
          isLoading: false,
          authError: null,
          isCallback: false,
        };
      }
    } catch (err) {
      console.warn('[AuthContext] Session initialization error:', err);
    }

    return {
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      authError: null,
      isCallback: false,
    };
  });

  const { user, tokens, isAuthenticated, isLoading, authError, isCallback } = sessionState;

  // Process incoming OAuth callback (?code=... or ?error=...) on mount
  useEffect(() => {
    let isMounted = true;

    const processOAuthCallback = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDesc = searchParams.get('error_description');

      // Handle OAuth error return from Cognito
      if (error) {
        console.warn('[AuthContext] Cognito authorization error returned:', error, errorDesc);
        let message = errorDesc || error;
        if (error === 'redirect_mismatch') {
          message =
            'Cognito redirect_mismatch: The callback URL "http://localhost:3000/login" is not registered in the AWS Cognito User Pool Client settings. Please add http://localhost:3000/login to "Allowed callback URLs" and "Allowed sign-out URLs" in the AWS Console.';
        }
        if (isMounted) {
          setSessionState((prev) => ({
            ...prev,
            authError: message,
            isLoading: false,
            isCallback: false,
          }));
        }
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      // Handle Authorization Code exchange
      if (code) {
        try {
          if (isMounted) {
            setSessionState((prev) => ({ ...prev, isLoading: true, isCallback: true }));
          }

          const session = await authService.exchangeCodeForTokens(code, state);
          if (isMounted && session) {
            setSessionState({
              user: session.user,
              tokens: session.tokens,
              isAuthenticated: true,
              isLoading: false,
              authError: null,
              isCallback: false,
            });
          }
        } catch (exchangeErr) {
          console.error('[AuthContext] Token exchange error:', exchangeErr.message);
          // Check if session was actually established (e.g., concurrent StrictMode exchange succeeded)
          const fallbackSession = authService.getSession();
          if (isMounted) {
            if (fallbackSession && fallbackSession.isAuthenticated) {
              setSessionState({
                user: fallbackSession.user,
                tokens: fallbackSession.tokens,
                isAuthenticated: true,
                isLoading: false,
                authError: null,
                isCallback: false,
              });
            } else {
              setSessionState((prev) => ({
                ...prev,
                authError: exchangeErr.message || 'Failed to complete Cognito sign in.',
                isLoading: false,
                isCallback: false,
              }));
            }
          }
        } finally {
          // Clean query string from URL bar so code cannot be resubmitted
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        return;
      }

      // Check if an exchange is currently in progress (e.g. from concurrent mount)
      if (authService.hasActiveExchange()) {
        try {
          const session = await authService.waitForActiveExchange();
          if (isMounted && session) {
            setSessionState({
              user: session.user,
              tokens: session.tokens,
              isAuthenticated: true,
              isLoading: false,
              authError: null,
              isCallback: false,
            });
            return;
          }
        } catch (e) {}
      }

      // Check if session was already established
      const current = authService.getSession();
      if (current && current.isAuthenticated) {
        if (isMounted) {
          setSessionState({
            user: current.user,
            tokens: current.tokens,
            isAuthenticated: true,
            isLoading: false,
            authError: null,
            isCallback: false,
          });
        }
        return;
      }

      // Check if existing session needs token refresh
      if (current && current.isExpired && current.tokens?.refreshToken) {
        try {
          const refreshed = await authService.refreshSession();
          if (isMounted && refreshed) {
            setSessionState({
              user: refreshed.user,
              tokens: refreshed.tokens,
              isAuthenticated: true,
              isLoading: false,
              authError: null,
              isCallback: false,
            });
          }
        } catch (refreshErr) {
          console.warn('[AuthContext] Automatic token refresh failed:', refreshErr);
        }
      }
    };

    processOAuthCallback();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Triggers redirection to AWS Cognito Managed Login with RFC 7636 PKCE
   */
  const login = useCallback(async () => {
    try {
      setSessionState((prev) => ({ ...prev, isLoading: true, authError: null }));
      const authorizeUrl = await authService.buildAuthorizeUrl();
      window.location.href = authorizeUrl;
    } catch (err) {
      console.error('[AuthContext.login] Error constructing authorize URL:', err);
      setSessionState((prev) => ({
        ...prev,
        authError: 'Could not connect to Cognito Login. Please try again.',
        isLoading: false,
      }));
    }
  }, []);

  /**
   * Triggers redirection to AWS Cognito Managed Signup with RFC 7636 PKCE
   */
  const signup = useCallback(async () => {
    try {
      setSessionState((prev) => ({ ...prev, isLoading: true, authError: null }));
      const signupUrl = await authService.buildSignupUrl();
      window.location.href = signupUrl;
    } catch (err) {
      console.error('[AuthContext.signup] Error constructing signup URL:', err);
      setSessionState((prev) => ({
        ...prev,
        authError: 'Could not connect to Cognito Signup. Please try again.',
        isLoading: false,
      }));
    }
  }, []);

  /**
   * Complete Cognito Logout
   * 1. Revokes active tokens with Cognito backend (RFC 7009)
   * 2. Clears all stored tokens and session state from localStorage and sessionStorage
   * 3. Sends signout request to Cognito logout endpoint
   * 4. Navigates cleanly to /login so the FitResQ login page is displayed
   */
  const logout = useCallback(async () => {
    const refreshToken = authService.getRefreshToken();
    const accessToken = authService.getAccessToken();
    const tokenToRevoke = refreshToken || accessToken;

    if (tokenToRevoke) {
      try {
        await authService.revokeTokens(tokenToRevoke);
      } catch (err) {
        console.warn('[AuthContext.logout] Token revocation error:', err);
      }
    }

    authService.clearSession();
    setSessionState({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      authError: null,
      isCallback: false,
    });

    // Notify Cognito domain in background to clear hosted cookies
    try {
      const logoutUrl = authService.buildLogoutUrl();
      fetch(logoutUrl, { method: 'GET', mode: 'no-cors', credentials: 'omit', keepalive: true }).catch(() => {});
    } catch (e) {}

    // Cleanly redirect to /login
    window.location.href = '/login';
  }, []);

  const clearAuthError = useCallback(() => {
    setSessionState((prev) => ({ ...prev, authError: null }));
  }, []);

  const value = {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    isCallback,
    authError,
    login,
    signup,
    logout,
    clearAuthError,
    getIdToken: authService.getIdToken,
    getAccessToken: authService.getAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
