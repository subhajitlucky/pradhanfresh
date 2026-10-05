/**
 * Shared cookie policy for the refresh token.
 *
 * `secure: true` is correct in production but means the browser refuses to store
 * the cookie over plain http, which is how every local dev environment runs.
 * That made POST /api/auth/refresh-token return 401 "No refresh token found" on
 * localhost, silently breaking silent token refresh during development.
 *
 * In production we also allow the SPA to be served from a different origin than
 * the API, so sameSite is relaxed to 'none' there — that REQUIRES secure.
 */

const isProduction = () => process.env.NODE_ENV === 'production';

// Set by server.js from the FRONTEND_URL env var when present.
let frontendOrigin = process.env.FRONTEND_URL || null;

const setFrontendOrigin = (origin) => {
  frontendOrigin = origin || null;
};

const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

function refreshCookieOptions() {
  const prod = isProduction();
  const crossOrigin =
    prod &&
    frontendOrigin &&
    /^(https?):\/\//.test(frontendOrigin) &&
    new URL(frontendOrigin).host !== (process.env.API_HOST || '');

  return {
    httpOnly: true,
    secure: prod,
    // Same-origin in dev (localhost:5173 -> localhost:5000 is still
    // cross-origin, so 'lax' is the practical choice); 'none' when the SPA and
    // API are genuinely on different sites in production.
    sameSite: crossOrigin ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: REFRESH_MAX_AGE,
    ...(crossOrigin ? { domain: undefined } : {}),
  };
}

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, refreshCookieOptions());
};

const clearRefreshCookie = (res) => {
  res.clearCookie('refreshToken', { ...refreshCookieOptions(), maxAge: undefined });
};

module.exports = {
  setRefreshCookie,
  clearRefreshCookie,
  refreshCookieOptions,
  setFrontendOrigin,
  isProduction,
  REFRESH_MAX_AGE,
};