import axios, { type AxiosInstance } from 'axios';
import { tokenCookies } from './auth/cookies';

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
			const token = tokenCookies.getAccessToken();
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

