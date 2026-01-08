import axios, { type AxiosInstance } from 'axios';
import { tokenCookies } from './auth/cookies';

/**
 * CSRF token storage - stored in memory from response headers
 * This is more reliable than cookies in HTTP development environments
 */
let csrfToken: string | null = null;

/**
 * Gets CSRF token from memory storage
 */
function getCSRFToken(): string | null {
	return csrfToken;
}

/**
 * Sets CSRF token in memory storage
 */
function setCSRFToken(token: string): void {
	csrfToken = token;
}

/**
 * Clears CSRF token from memory storage
 */
function clearCSRFToken(): void {
	csrfToken = null;
}

/**
 * Creates an axios instance with automatic token injection
 * All requests will include the access token and CSRF token if available
 */
export function createAuthenticatedClient(baseURL: string): AxiosInstance {
	const client = axios.create({
		baseURL,
		// Do not set a default Content-Type here so that browser can
		// automatically set the correct header for FormData requests
		withCredentials: true // Required for CORS with credentials
	});

	// Add request interceptor to include access token and CSRF token in headers
	client.interceptors.request.use(
		(config) => {
			// Add access token
			const token = tokenCookies.getAccessToken();
			if (token) {
				config.headers.Authorization = `Bearer ${token}`;
			}

			// Add CSRF token for state-changing requests (POST, PUT, PATCH, DELETE)
			const method = config.method?.toUpperCase();
			if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
				const token = getCSRFToken();
				if (token) {
					config.headers['X-CSRF-Token'] = token;
				} else {
					console.warn('CSRF token not found for', method, 'request to', config.url);
				}
			}

			// Ensure correct Content-Type for JSON requests, but allow
			// the browser/axios to set multipart boundaries for FormData.
			const isFormData = config.data instanceof FormData;
			if (isFormData) {
				// Remove Content-Type so the browser can set the multipart boundary
				if (config.headers && config.headers['Content-Type']) {
					delete config.headers['Content-Type'];
				}
			} else {
				if (!config.headers['Content-Type']) {
					config.headers['Content-Type'] = 'application/json';
				}
			}

			return config;
		},
		(error) => {
			return Promise.reject(error);
		}
	);

	// Response interceptor to extract CSRF token from response headers
	client.interceptors.response.use(
		(response) => {
			// Extract CSRF token from response header (primary method)
			// The backend sets X-CSRF-Token header on GET requests
			const token = response.headers['x-csrf-token'];
			if (token) {
				setCSRFToken(token);
			}
			return response;
		},
		(error) => {
			// On 403 CSRF errors, clear the token so it can be refreshed
			if (error.response?.status === 403) {
				const errorMsg = error.response?.data?.error;
				if (errorMsg && (errorMsg.includes('CSRF') || errorMsg.includes('csrf'))) {
					clearCSRFToken();
				}
			}
			return Promise.reject(error);
		}
	);

	return client;
}
