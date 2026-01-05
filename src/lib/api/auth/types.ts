/**
 * Auth domain types
 * Based on backend entity and request/response types
 */

export interface User {
	id: string;
	username: string;
	email: string;
	first_name: string;
	last_name: string;
	role: string;
	is_active: boolean;
	is_verified: boolean;
	last_login?: string | null;
	created_at: string;
	updated_at: string;
	profile?: Profile | null;
}

export interface Profile {
	id: string;
	user_id: string;
	avatar?: string;
	bio?: string;
	date_of_birth?: string | null;
	gender?: string;
	phone?: string;
	location?: string;
	website?: string;
	social_links?: string;
	preferences?: string;
	created_at: string;
	updated_at: string;
	user?: User | null;
}

export interface RegisterRequest {
	username: string;
	email: string;
	password: string;
	first_name: string;
	last_name: string;
}

export interface LoginRequest {
	email?: string;
	username?: string;
	password: string;
}

export interface AuthResponse {
	user: User;
	access_token: string;
	refresh_token: string;
	expires_at: number;
}

export interface RefreshTokenRequest {
	refresh_token: string;
}

export interface LogoutRequest {
	refresh_token: string;
}

export interface ProfileUpdateRequest {
	avatar?: string;
	bio?: string;
	date_of_birth?: string | null;
	gender?: string;
	phone?: string;
	location?: string;
	website?: string;
	social_links?: string;
	preferences?: string;
}

export interface ChangePasswordRequest {
	current_password: string;
	new_password: string;
}

export interface ApiResponse<T> {
	success: boolean;
	message?: string;
	data: T;
}

