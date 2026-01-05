import { browser } from '$app/environment';

/**
 * Token Cookie Management
 * Handles storage and retrieval of authentication tokens
 * Uses localStorage for now (can be upgraded to httpOnly cookies via API)
 */
class TokenCookies {
	private readonly ACCESS_TOKEN_KEY = 'access_token';
	private readonly REFRESH_TOKEN_KEY = 'refresh_token';

	/**
	 * Get access token from storage
	 */
	getAccessToken(): string | null {
		if (!browser) return null;
		return localStorage.getItem(this.ACCESS_TOKEN_KEY);
	}

	/**
	 * Get refresh token from storage
	 */
	getRefreshToken(): string | null {
		if (!browser) return null;
		return localStorage.getItem(this.REFRESH_TOKEN_KEY);
	}

	/**
	 * Set access token in storage
	 */
	setAccessToken(token: string): void {
		if (!browser) return;
		localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
	}

	/**
	 * Set refresh token in storage
	 */
	setRefreshToken(token: string): void {
		if (!browser) return;
		localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
	}

	/**
	 * Clear all tokens from storage
	 */
	clearTokens(): void {
		if (!browser) return;
		localStorage.removeItem(this.ACCESS_TOKEN_KEY);
		localStorage.removeItem(this.REFRESH_TOKEN_KEY);
	}

	/**
	 * Check if user is authenticated (has access token)
	 */
	isAuthenticated(): boolean {
		return this.getAccessToken() !== null;
	}
}

export const tokenCookies = new TokenCookies();

