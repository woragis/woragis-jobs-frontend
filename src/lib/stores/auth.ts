import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { authApi, tokenCookies, type User, type Profile } from '$lib/api/auth';

/**
 * Auth Store
 * Manages authentication state across the application
 */

interface AuthState {
	user: User | null;
	profile: Profile | null;
	isAuthenticated: boolean;
	isLoading: boolean;
}

const createAuthStore = () => {
	const { subscribe, set, update } = writable<AuthState>({
		user: null,
		profile: null,
		isAuthenticated: false,
		isLoading: true,
	});

	/**
	 * Initialize auth state from localStorage
	 * Should be called on app load
	 */
	async function init() {
		if (!browser) {
			update((state) => ({ ...state, isLoading: false }));
			return;
		}

		const hasToken = tokenCookies.isAuthenticated();
		if (!hasToken) {
			update((state) => ({ ...state, isLoading: false }));
			return;
		}

		try {
			// Try to get profile to verify token is valid
			const profile = await authApi.getProfile();
			// Profile may include user data in the response
			const user = profile.user || null;
			update((state) => ({
				...state,
				user,
				profile,
				isAuthenticated: true,
				isLoading: false,
			}));
		} catch (error) {
			// Token is invalid, clear it
			tokenCookies.clearTokens();
			update((state) => ({
				...state,
				user: null,
				profile: null,
				isAuthenticated: false,
				isLoading: false,
			}));
		}
	}

	/**
	 * Set user after successful login/register
	 */
	function setUser(user: User, profile?: Profile | null) {
		update((state) => ({
			...state,
			user,
			profile: profile || null,
			isAuthenticated: true,
			isLoading: false,
		}));
	}

	/**
	 * Set profile
	 */
	function setProfile(profile: Profile) {
		update((state) => ({
			...state,
			profile,
		}));
	}

	/**
	 * Clear auth state (logout)
	 */
	function clear() {
		tokenCookies.clearTokens();
		update((state) => ({
			...state,
			user: null,
			profile: null,
			isAuthenticated: false,
			isLoading: false,
		}));
	}

	/**
	 * Refresh profile data
	 */
	async function refreshProfile() {
		if (!browser) return;

		try {
			const profile = await authApi.getProfile();
			setProfile(profile);
		} catch (error) {
			// If refresh fails, user might be logged out
			clear();
		}
	}

	return {
		subscribe,
		init,
		setUser,
		setProfile,
		clear,
		refreshProfile,
	};
};

export const authStore = createAuthStore();

/**
 * Derived stores for convenience
 */
export const isAuthenticated = derived(authStore, ($auth) => $auth.isAuthenticated);
export const currentUser = derived(authStore, ($auth) => $auth.user);
export const currentProfile = derived(authStore, ($auth) => $auth.profile);
export const authLoading = derived(authStore, ($auth) => $auth.isLoading);

