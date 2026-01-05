import axios, { type AxiosInstance } from 'axios';

/**
 * Simple token storage (can be replaced with cookies later)
 * For now, using localStorage
 */
const tokenStorage = {
	getAccessToken(): string | null {
		if (typeof window === 'undefined') return null;
		return localStorage.getItem('access_token');
	},
	setAccessToken(token: string): void {
		if (typeof window === 'undefined') return;
		localStorage.setItem('access_token', token);
	},
	clearTokens(): void {
		if (typeof window === 'undefined') return;
		localStorage.removeItem('access_token');
		localStorage.removeItem('refresh_token');
	},
};

/**
 * Creates an axios instance with automatic token injection
 * All requests will include the access token from localStorage if available
 */
export function createAuthenticatedClient(baseURL: string): AxiosInstance {
	const client = axios.create({
		baseURL,
		headers: {
			'Content-Type': 'application/json',
		},
	});

	// Add request interceptor to include access token in headers
	client.interceptors.request.use(
		(config) => {
			const token = tokenStorage.getAccessToken();
			if (token) {
				config.headers.Authorization = `Bearer ${token}`;
			}
			return config;
		},
		(error) => {
			return Promise.reject(error);
		}
	);

	return client;
}

