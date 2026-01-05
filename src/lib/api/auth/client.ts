import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { config } from '$lib/config';
import { tokenCookies } from './cookies';
import type {
	User,
	Profile,
	RegisterRequest,
	LoginRequest,
	AuthResponse,
	RefreshTokenRequest,
	LogoutRequest,
	ProfileUpdateRequest,
	ChangePasswordRequest,
	ApiResponse,
} from './types';

/**
 * Auth API Client
 * Handles all API calls to the auth domain endpoints
 * Manages token storage in localStorage and automatic token refresh
 */
class AuthApiClient {
	private client: AxiosInstance;
	private isRefreshing = false;
	private refreshSubscribers: Array<(token: string) => void> = [];

	constructor() {
		this.client = axios.create({
			baseURL: `${config.authApiUrl}/auth`,
			headers: {
				'Content-Type': 'application/json',
			},
		});

		// Add request interceptor to include access token in headers
		this.client.interceptors.request.use(
			(requestConfig) => {
				const token = tokenCookies.getAccessToken();
				if (token) {
					requestConfig.headers.Authorization = `Bearer ${token}`;
				}
				return requestConfig;
			},
			(error) => {
				return Promise.reject(error);
			}
		);

		// Add response interceptor to handle token refresh on 401
		this.client.interceptors.response.use(
			(response) => response,
			async (error: AxiosError) => {
				const originalRequest = error.config as any;

				// If error is 401 and we haven't tried to refresh yet
				if (error.response?.status === 401 && !originalRequest._retry) {
					if (this.isRefreshing) {
						// If already refreshing, wait for the new token
						return new Promise((resolve) => {
							this.refreshSubscribers.push((token: string) => {
								originalRequest.headers.Authorization = `Bearer ${token}`;
								resolve(this.client(originalRequest));
							});
						});
					}

					originalRequest._retry = true;
					this.isRefreshing = true;

					const refreshToken = tokenCookies.getRefreshToken();
					if (!refreshToken) {
						this.isRefreshing = false;
						tokenCookies.clearTokens();
						return Promise.reject(error);
					}

					try {
						const response = await axios.post<ApiResponse<AuthResponse>>(
							`${config.authApiUrl}/auth/refresh`,
							{ refresh_token: refreshToken }
						);

						const { access_token, refresh_token } = response.data.data;
						tokenCookies.setAccessToken(access_token);
						tokenCookies.setRefreshToken(refresh_token);

						// Notify all waiting requests
						this.refreshSubscribers.forEach((callback) => callback(access_token));
						this.refreshSubscribers = [];

						// Retry original request with new token
						originalRequest.headers.Authorization = `Bearer ${access_token}`;
						this.isRefreshing = false;
						return this.client(originalRequest);
					} catch (refreshError) {
						this.isRefreshing = false;
						this.refreshSubscribers = [];
						tokenCookies.clearTokens();
						return Promise.reject(refreshError);
					}
				}

				return Promise.reject(error);
			}
		);
	}

	/**
	 * Register a new user
	 */
	async register(data: RegisterRequest): Promise<AuthResponse> {
		const response = await this.client.post<ApiResponse<AuthResponse>>('/register', data);
		const authData = response.data.data;
		
		// Store tokens in localStorage
		tokenCookies.setAccessToken(authData.access_token);
		tokenCookies.setRefreshToken(authData.refresh_token);
		
		return authData;
	}

	/**
	 * Login user
	 */
	async login(data: LoginRequest): Promise<AuthResponse> {
		const response = await this.client.post<ApiResponse<AuthResponse>>('/login', data);
		const authData = response.data.data;
		
		// Store tokens in localStorage
		tokenCookies.setAccessToken(authData.access_token);
		tokenCookies.setRefreshToken(authData.refresh_token);
		
		return authData;
	}

	/**
	 * Refresh access token
	 */
	async refreshToken(refreshToken: string): Promise<AuthResponse> {
		const response = await this.client.post<ApiResponse<AuthResponse>>('/refresh', {
			refresh_token: refreshToken,
		});
		const authData = response.data.data;
		
		// Update tokens in localStorage
		tokenCookies.setAccessToken(authData.access_token);
		tokenCookies.setRefreshToken(authData.refresh_token);
		
		return authData;
	}

	/**
	 * Logout user
	 */
	async logout(refreshToken: string): Promise<void> {
		await this.client.post('/logout', { refresh_token: refreshToken });
		tokenCookies.clearTokens();
	}

	/**
	 * Logout from all devices
	 */
	async logoutAll(): Promise<void> {
		await this.client.post('/logout-all');
		tokenCookies.clearTokens();
	}

	/**
	 * Verify email address
	 */
	async verifyEmail(token: string): Promise<void> {
		await this.client.get('/verify-email', {
			params: { token },
		});
	}

	/**
	 * Get user profile
	 */
	async getProfile(): Promise<Profile> {
		const response = await this.client.get<ApiResponse<Profile>>('/profile');
		return response.data.data;
	}

	/**
	 * Update user profile
	 */
	async updateProfile(data: ProfileUpdateRequest): Promise<Profile> {
		const response = await this.client.put<ApiResponse<Profile>>('/profile', data);
		return response.data.data;
	}

	/**
	 * Change password
	 */
	async changePassword(data: ChangePasswordRequest): Promise<void> {
		await this.client.post('/change-password', data);
	}

	/**
	 * Check if user is authenticated
	 */
	isAuthenticated(): boolean {
		return tokenCookies.isAuthenticated();
	}

	/**
	 * Get current access token
	 */
	getAccessToken(): string | undefined {
		return tokenCookies.getAccessToken() || undefined;
	}

	/**
	 * Get current refresh token
	 */
	getRefreshToken(): string | undefined {
		return tokenCookies.getRefreshToken() || undefined;
	}
}

// Export singleton instance
export const authApi = new AuthApiClient();

