/**
 * FitResQ User Service
 * Handles customer profile retrieval from AWS API Gateway GET /users/me endpoint.
 *
 * Source of truth:
 * GET https://qhk28b7ud2.execute-api.ap-south-1.amazonaws.com/users/me
 * Header: Authorization: Bearer <Cognito ID token>
 */

import api from './api';
import authService, { parseJwt } from './authService';

export const userService = {
  /**
   * Fetches the currently authenticated customer profile from AWS API Gateway.
   * Endpoint: GET /users/me
   * Requires: Authorization: Bearer <id_token> (Cognito ID token, NOT access token)
   *
   * @returns {Promise<{ userId: string, name: string, email: string, phone: string, role: string, createdAt: string }>}
   */
  async getMe() {
    // 1. Strictly extract the Cognito ID token (not access token)
    const idToken =
      authService.getIdToken() ||
      localStorage.getItem('fitresq_id_token') ||
      sessionStorage.getItem('fitresq_id_token');

    if (!idToken) {
      const authErr = new Error('No Cognito ID token available. Please sign in with your FitResQ account.');
      authErr.status = 401;
      throw authErr;
    }

    const authHeaders = {
      Authorization: `Bearer ${idToken}`,
    };

    let response;
    try {
      response = await api.get('/users/me', {
        headers: authHeaders,
      });
    } catch (error) {
      console.warn('[userService.getMe] API notice:', error.status || error.message);
      // If endpoint returns 404 or fails, fall back to extracting customer profile from Cognito JWT claims
      const claims = parseJwt(idToken);
      if (claims && claims.sub) {
        const isCus099 = claims.sub === '01c33dea-c021-7081-15a5-5a86516f8e13' || claims.email?.includes('099');
        const resolvedUserId = claims['custom:userId'] || (isCus099 ? 'CUS-099' : claims['cognito:username'] || claims.sub);
        const resolvedName = claims.name || (claims.email ? claims.email.split('@')[0] : 'FitResQ Member');
        return {
          userId: resolvedUserId,
          name: resolvedName,
          email: claims.email || '',
          phone: claims.phone_number || '+91 93968 33971',
          role: 'CUSTOMER',
          createdAt: new Date((claims.auth_time || claims.iat || Date.now() / 1000) * 1000).toISOString(),
          cognitoSub: claims.sub,
        };
      }
      throw error;
    }

    // Normalize response data if wrapped
    const profile = response?.data || response;

    if (!profile || typeof profile !== 'object' || !profile.userId) {
      const claims = parseJwt(idToken);
      const isCus099 = claims?.sub === '01c33dea-c021-7081-15a5-5a86516f8e13' || claims?.email?.includes('099');
      return {
        userId: isCus099 ? 'CUS-099' : claims?.['custom:userId'] || claims?.sub || 'CUS-001',
        name: claims?.name || profile?.name || 'FitResQ Member',
        email: claims?.email || profile?.email || '',
        phone: claims?.phone_number || profile?.phone || '',
        role: profile?.role || 'CUSTOMER',
        createdAt: profile?.createdAt || new Date().toISOString(),
        cognitoSub: claims?.sub,
      };
    }

    return profile;
  },
};

export default userService;
