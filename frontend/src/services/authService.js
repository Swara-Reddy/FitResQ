/**
 * FitResQ AWS Cognito Authentication Service
 * Implements OAuth 2.0 Authorization Code Grant with PKCE (RFC 7636).
 * Manages token lifecycle, claims parsing, session persistence, and logout without client secrets.
 */

export const getRedirectUri = () => {
  if (typeof window !== 'undefined' && window.location.hostname.includes('cloudfront.net')) {
    return `https://${window.location.hostname}`;
  }
  return (typeof import.meta !== 'undefined' && import.meta.env?.VITE_COGNITO_REDIRECT_URI) || 'http://localhost:3000/login';
};

export const COGNITO_CONFIG = {
  userPoolId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_COGNITO_USER_POOL_ID) || 'ap-south-1_7WbqGdro8',
  clientId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_COGNITO_CLIENT_ID) || '7d8h6cnruek38rjv6dlp2ggt4k',
  domain: (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_COGNITO_DOMAIN) ||
    'https://ap-south-17wbqgdro8.auth.ap-south-1.amazoncognito.com'
  ).replace(/\/$/, ''),
  get redirectUri() {
    return getRedirectUri();
  },
  region: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_COGNITO_REGION) || 'ap-south-1',
  scopes: 'email openid phone',
  authority: 'https://cognito-idp.ap-south-1.amazonaws.com/ap-south-1_7WbqGdro8',
};

const STORAGE_KEYS = {
  ID_TOKEN: 'fitresq_id_token',
  ACCESS_TOKEN: 'fitresq_access_token',
  REFRESH_TOKEN: 'fitresq_refresh_token',
  EXPIRES_AT: 'fitresq_token_expires_at',
  USER: 'fitresq_user',
  CODE_VERIFIER: 'fitresq_pkce_verifier',
  AUTH_STATE: 'fitresq_auth_state',
};

// Module-level locks ensure single-use authorization code is NEVER exchanged multiple times,
// even across React StrictMode remounts, component re-renders, or concurrent effects.
const activeExchanges = new Map(); // code -> Promise<Session>
const processedCodes = new Map();  // code -> Session

// --------------------------------------------------------------------------
// PKCE (Proof Key for Code Exchange) Utility Functions via Web Crypto API
// --------------------------------------------------------------------------

function generateRandomString(length = 64) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const array = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (dec) => charset[dec % charset.length]).join('');
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Generate PKCE Code Verifier & SHA-256 Code Challenge
 */
export async function generatePkce() {
  const verifier = generateRandomString(64);
  const hashed = await sha256(verifier);
  const challenge = base64UrlEncode(hashed);
  return { verifier, challenge };
}

/**
 * Decode JWT payload safely without external libraries
 */
export function parseJwt(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.warn('[authService.parseJwt] Failed to parse JWT payload:', err);
    return null;
  }
}

/**
 * Validates whether a token is a genuine, unexpired AWS Cognito JWT
 * issued by our User Pool for our App Client.
 */
export function isValidCognitoToken(token, expectedUse = null) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const payload = parseJwt(token);
  if (!payload || typeof payload !== 'object') return false;

  // 1. Verify expiration (Unix epoch in seconds)
  if (!payload.exp || typeof payload.exp !== 'number') return false;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (payload.exp <= nowInSeconds) return false;

  // 2. Verify Cognito issuer (must match our configured User Pool authority)
  const expectedIssuer = `https://cognito-idp.${COGNITO_CONFIG.region}.amazonaws.com/${COGNITO_CONFIG.userPoolId}`;
  if (payload.iss !== expectedIssuer) return false;

  // 3. Verify client ID / audience (must match our configured App Client)
  if (expectedUse === 'id' || payload.token_use === 'id') {
    if (payload.aud !== COGNITO_CONFIG.clientId) return false;
  } else if (expectedUse === 'access' || payload.token_use === 'access') {
    if (payload.client_id !== COGNITO_CONFIG.clientId) return false;
  } else {
    if (payload.aud !== COGNITO_CONFIG.clientId && payload.client_id !== COGNITO_CONFIG.clientId) {
      return false;
    }
  }

  // 4. Verify user identifier (sub)
  if (!payload.sub || typeof payload.sub !== 'string') return false;

  return true;
}

// --------------------------------------------------------------------------
// Auth Service Methods
// --------------------------------------------------------------------------

export const authService = {
  /**
   * Constructs the Cognito Managed Login /oauth2/authorize URL with PKCE parameters
   */
  async buildAuthorizeUrl() {
    const { verifier, challenge } = await generatePkce();
    const state = generateRandomString(32);

    sessionStorage.setItem(`${STORAGE_KEYS.CODE_VERIFIER}_${state}`, verifier);
    sessionStorage.setItem(`${STORAGE_KEYS.AUTH_STATE}_${state}`, state);
    sessionStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, verifier);
    sessionStorage.setItem(STORAGE_KEYS.AUTH_STATE, state);
    try {
      localStorage.setItem(`${STORAGE_KEYS.CODE_VERIFIER}_${state}`, verifier);
      localStorage.setItem(`${STORAGE_KEYS.AUTH_STATE}_${state}`, state);
      localStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, verifier);
      localStorage.setItem(STORAGE_KEYS.AUTH_STATE, state);
    } catch (e) {}

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: COGNITO_CONFIG.clientId,
      redirect_uri: COGNITO_CONFIG.redirectUri,
      scope: COGNITO_CONFIG.scopes,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state: state,
    });

    return `${COGNITO_CONFIG.domain}/oauth2/authorize?${params.toString()}`;
  },

  /**
   * Constructs the Cognito Managed Signup /signup URL with PKCE parameters
   */
  async buildSignupUrl() {
    const { verifier, challenge } = await generatePkce();
    const state = generateRandomString(32);

    sessionStorage.setItem(`${STORAGE_KEYS.CODE_VERIFIER}_${state}`, verifier);
    sessionStorage.setItem(`${STORAGE_KEYS.AUTH_STATE}_${state}`, state);
    sessionStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, verifier);
    sessionStorage.setItem(STORAGE_KEYS.AUTH_STATE, state);
    try {
      localStorage.setItem(`${STORAGE_KEYS.CODE_VERIFIER}_${state}`, verifier);
      localStorage.setItem(`${STORAGE_KEYS.AUTH_STATE}_${state}`, state);
      localStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, verifier);
      localStorage.setItem(STORAGE_KEYS.AUTH_STATE, state);
    } catch (e) {}

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: COGNITO_CONFIG.clientId,
      redirect_uri: COGNITO_CONFIG.redirectUri,
      scope: COGNITO_CONFIG.scopes,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state: state,
    });

    return `${COGNITO_CONFIG.domain}/signup?${params.toString()}`;
  },

  /**
   * Exchanges authorization code for tokens using Cognito /oauth2/token.
   * Strictly guarantees single execution per authorization code to prevent invalid_grant errors.
   */
  async exchangeCodeForTokens(code, stateParam) {
    if (!code) {
      throw new Error('No authorization code provided for token exchange.');
    }

    // 1. If this exact code was already successfully exchanged, return cached session
    if (processedCodes.has(code)) {
      return processedCodes.get(code);
    }

    // 2. If an exchange for this exact code is already in flight (e.g. React StrictMode concurrent mount),
    // wait for and return the result of that in-flight exchange instead of making a duplicate HTTP request!
    if (activeExchanges.has(code)) {
      return await activeExchanges.get(code);
    }

    // 3. Initiate single-use token exchange with AWS Cognito
    const exchangePromise = (async () => {
      // Look up verifier by state first, then fall back to default key
      let storedVerifier = null;
      if (stateParam) {
        storedVerifier =
          sessionStorage.getItem(`${STORAGE_KEYS.CODE_VERIFIER}_${stateParam}`) ||
          localStorage.getItem(`${STORAGE_KEYS.CODE_VERIFIER}_${stateParam}`);
      }
      if (!storedVerifier) {
        storedVerifier =
          sessionStorage.getItem(STORAGE_KEYS.CODE_VERIFIER) ||
          localStorage.getItem(STORAGE_KEYS.CODE_VERIFIER);
      }

      const storedState =
        (stateParam &&
          (sessionStorage.getItem(`${STORAGE_KEYS.AUTH_STATE}_${stateParam}`) ||
            localStorage.getItem(`${STORAGE_KEYS.AUTH_STATE}_${stateParam}`))) ||
        sessionStorage.getItem(STORAGE_KEYS.AUTH_STATE) ||
        localStorage.getItem(STORAGE_KEYS.AUTH_STATE);

      if (storedState && stateParam && storedState !== stateParam) {
        console.warn('[authService] State parameter mismatch. Possible CSRF attempt.');
      }

      if (!storedVerifier) {
        // Fallback: Check if an authenticated session already exists
        const existingSession = this.getSession();
        if (existingSession && existingSession.isAuthenticated) {
          return existingSession;
        }
        throw new Error('Missing PKCE code verifier in session. Please initiate sign in again.');
      }

      const bodyParams = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: COGNITO_CONFIG.clientId,
        code: code,
        redirect_uri: COGNITO_CONFIG.redirectUri,
        code_verifier: storedVerifier,
      });

      const response = await fetch(`${COGNITO_CONFIG.domain}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
        } catch (e) {
          errorJson = { error: errorText };
        }

        const errCode = errorJson.error || '';
        const errDesc = errorJson.error_description || '';

        // If Cognito responded with invalid_grant, check if session was already established
        if (errCode === 'invalid_grant') {
          const existingSession = this.getSession();
          if (existingSession && existingSession.isAuthenticated) {
            return existingSession;
          }
          throw new Error(
            'The sign-in authorization code has expired or was already redeemed. Please click "Sign In with FitResQ Account" to sign in again.'
          );
        }

        throw new Error(errDesc || errCode || 'Failed to exchange authorization code for tokens');
      }

      const tokenData = await response.json();
      const session = this.saveSession(tokenData);
      processedCodes.set(code, session);

      // Clean up temporary PKCE keys from storage
      if (stateParam) {
        sessionStorage.removeItem(`${STORAGE_KEYS.CODE_VERIFIER}_${stateParam}`);
        sessionStorage.removeItem(`${STORAGE_KEYS.AUTH_STATE}_${stateParam}`);
        try {
          localStorage.removeItem(`${STORAGE_KEYS.CODE_VERIFIER}_${stateParam}`);
          localStorage.removeItem(`${STORAGE_KEYS.AUTH_STATE}_${stateParam}`);
        } catch (e) {}
      }
      sessionStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
      sessionStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
      try {
        localStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
        localStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
      } catch (e) {}

      return session;
    })();

    activeExchanges.set(code, exchangePromise);

    try {
      return await exchangePromise;
    } finally {
      activeExchanges.delete(code);
    }
  },

  /**
   * Save session tokens and extract user profile attributes
   */
  saveSession(tokenData) {
    const { id_token, access_token, refresh_token, expires_in } = tokenData;

    const expiresAt = Date.now() + (expires_in ? Number(expires_in) * 1000 : 3600 * 1000);

    if (id_token) {
      localStorage.setItem(STORAGE_KEYS.ID_TOKEN, id_token);
      localStorage.setItem('fitresq_token', id_token);
      try {
        sessionStorage.setItem(STORAGE_KEYS.ID_TOKEN, id_token);
        sessionStorage.setItem('fitresq_token', id_token);
      } catch (e) {}
    }
    if (access_token) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
      try {
        sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
      } catch (e) {}
    }
    if (refresh_token) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
      try {
        sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
      } catch (e) {}
    }
    localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, String(expiresAt));
    try {
      sessionStorage.setItem(STORAGE_KEYS.EXPIRES_AT, String(expiresAt));
    } catch (e) {}

    const claims = parseJwt(id_token || access_token);
    const user = {
      id: claims?.sub || claims?.['cognito:username'] || 'authenticated-user',
      sub: claims?.sub,
      email: claims?.email || '',
      emailVerified: Boolean(claims?.email_verified),
      name: claims?.name || (claims?.email ? claims.email.split('@')[0] : 'FitResQ Member'),
      username: claims?.['cognito:username'] || claims?.username || (claims?.email ? claims.email.split('@')[0] : 'customer'),
      phoneNumber: claims?.phone_number || '',
      claims: claims,
    };

    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    try {
      sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (e) {}

    return {
      user,
      tokens: {
        idToken: id_token,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
      },
    };
  },

  /**
   * Retrieves active session from localStorage only if genuine and unexpired
   */
  getSession() {
    const idToken = localStorage.getItem(STORAGE_KEYS.ID_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ID_TOKEN);
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (!idToken && !accessToken) {
      return null;
    }

    // Validate tokens strictly against AWS Cognito User Pool and App Client parameters
    const isIdValid = idToken ? isValidCognitoToken(idToken, 'id') : false;
    const isAccessValid = accessToken ? isValidCognitoToken(accessToken, 'access') : false;

    // A real valid session requires at least one genuine, unexpired Cognito token
    if (!isIdValid && !isAccessValid) {
      if (refreshToken) {
        return {
          isAuthenticated: false,
          isExpired: true,
          user: null,
          tokens: {
            idToken: null,
            accessToken: null,
            refreshToken,
            expiresAt: 0,
          },
        };
      }
      // Stale, fake, expired, or invalid tokens detected - purge immediately
      this.clearSession();
      return null;
    }

    const primaryToken = isIdValid ? idToken : accessToken;
    const claims = parseJwt(primaryToken);
    const expiresAt = (claims?.exp || 0) * 1000;

    let user = null;
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch (e) {
        user = null;
      }
    }

    if (!user || user.sub !== claims?.sub) {
      user = {
        id: claims?.sub || 'authenticated-user',
        sub: claims?.sub,
        email: claims?.email || '',
        emailVerified: Boolean(claims?.email_verified),
        name: claims?.name || (claims?.email ? claims.email.split('@')[0] : 'FitResQ Member'),
        username: claims?.['cognito:username'] || claims?.username || (claims?.email ? claims.email.split('@')[0] : 'customer'),
        phoneNumber: claims?.phone_number || '',
        claims: claims,
      };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }

    return {
      isAuthenticated: true,
      isExpired: false,
      user,
      tokens: {
        idToken,
        accessToken,
        refreshToken,
        expiresAt,
      },
    };
  },

  /**
   * Refreshes access and ID tokens using stored refresh token
   */
  async refreshSession() {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) {
      this.clearSession();
      return null;
    }

    try {
      const bodyParams = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: COGNITO_CONFIG.clientId,
        refresh_token: refreshToken,
      });

      const response = await fetch(`${COGNITO_CONFIG.domain}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });

      if (!response.ok) {
        console.warn('[authService.refreshSession] Refresh failed, clearing session.');
        this.clearSession();
        return null;
      }

      const tokenData = await response.json();
      return this.saveSession({
        ...tokenData,
        refresh_token: tokenData.refresh_token || refreshToken,
      });
    } catch (err) {
      console.warn('[authService.refreshSession] Network error during refresh:', err);
      return null;
    }
  },

  /**
   * Revokes token at AWS Cognito /oauth2/revoke endpoint (RFC 7009)
   */
  async revokeTokens(token) {
    if (!token) return;
    try {
      const bodyParams = new URLSearchParams({
        client_id: COGNITO_CONFIG.clientId,
        token: token,
      });

      await fetch(`${COGNITO_CONFIG.domain}/oauth2/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });
    } catch (err) {
      console.warn('[authService.revokeTokens] Network error during token revocation:', err);
    }
  },

  /**
   * Clears all authentication state from localStorage and sessionStorage
   */
  clearSession() {
    localStorage.removeItem(STORAGE_KEYS.ID_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem('fitresq_token');
    try {
      sessionStorage.removeItem(STORAGE_KEYS.ID_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
      sessionStorage.removeItem(STORAGE_KEYS.USER);
      sessionStorage.removeItem('fitresq_token');
      sessionStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
      sessionStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
    } catch (e) {}
    processedCodes.clear();
    activeExchanges.clear();
  },

  /**
   * Check if an authorization code exchange is currently in flight
   */
  hasActiveExchange() {
    return activeExchanges.size > 0;
  },

  /**
   * Wait for any currently in-flight authorization code exchange to settle
   */
  async waitForActiveExchange() {
    if (activeExchanges.size === 0) return null;
    const [promise] = activeExchanges.values();
    try {
      return await promise;
    } catch (e) {
      return null;
    }
  },

  /**
   * Returns Cognito logout URL
   */
  buildLogoutUrl() {
    const redirectUri = getRedirectUri();
    const params = new URLSearchParams({
      client_id: COGNITO_CONFIG.clientId,
      logout_uri: redirectUri,
    });
    return `${COGNITO_CONFIG.domain}/logout?${params.toString()}`;
  },

  /**
   * Quick getters
   */
  getIdToken() {
    return localStorage.getItem(STORAGE_KEYS.ID_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ID_TOKEN);
  },

  getAccessToken() {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  getRefreshToken() {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  getUser() {
    const u = localStorage.getItem(STORAGE_KEYS.USER) || sessionStorage.getItem(STORAGE_KEYS.USER);
    if (!u) return null;
    try {
      return JSON.parse(u);
    } catch (e) {
      return null;
    }
  },

  isAuthenticated() {
    const session = this.getSession();
    return Boolean(session && session.isAuthenticated);
  },
};

export default authService;
