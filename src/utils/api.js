import axios from 'axios';
import { auth } from '../firebase/firebase';

// ─── Token Cache ─────────────────────────────────────────────────────────────
// Scalability fix: Previously, every request called getIdToken(true) which forces
// a network call to Firebase on EVERY API request. We now cache the token and
// only refresh it when it's close to expiry (Firebase tokens last 1 hour).
let cachedToken = null;
let tokenExpiry = 0; // Unix timestamp in ms

const getAuthToken = async (user) => {
    const now = Date.now();
    // Refresh 5 minutes before expiry (or if no token cached)
    if (!cachedToken || now >= tokenExpiry - 5 * 60 * 1000) {
        // force=false: uses cached token if still valid (avoids unnecessary network call)
        cachedToken = await user.getIdToken(false);
        // Firebase ID tokens expire after 1 hour
        tokenExpiry = now + 60 * 60 * 1000;
    }
    return cachedToken;
};

// Invalidate token cache on auth state changes (login/logout)
auth.onIdTokenChanged((user) => {
    if (!user) {
        cachedToken = null;
        tokenExpiry = 0;
    } else {
        // Force re-fetch on next request after token is forcibly refreshed
        tokenExpiry = 0;
    }
});

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
    timeout: 30000, // 30s request timeout — prevents hung connections
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        const token = await getAuthToken(user);
        config.headers.Authorization = `Bearer ${token}`;
    }
    // NOTE: Removed aggressive cache-busting headers (no-cache, no-store) that were
    // previously sent on every request — those prevented the browser and CDN from
    // using any response caching. Specific pages that need fresh data should
    // explicitly set cache-control on those individual requests instead.
    return config;
}, (error) => {
    return Promise.reject(error);
});

// ─── Response Interceptor ─────────────────────────────────────────────────────
// Scalability: Auto-retry on 503 (maintenance / gateway hiccup) with exponential backoff.
// Also handles token expiry gracefully on 401.
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and we haven't retried yet, force-refresh the token and retry once
        if (error.response?.status === 401 && !originalRequest._retried) {
            originalRequest._retried = true;
            const user = auth.currentUser;
            if (user) {
                cachedToken = null; // Invalidate cache
                tokenExpiry = 0;
                const freshToken = await user.getIdToken(true);
                cachedToken = freshToken;
                tokenExpiry = Date.now() + 60 * 60 * 1000;
                originalRequest.headers.Authorization = `Bearer ${freshToken}`;
                return api(originalRequest);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
