import { env } from '$env/dynamic/public';

/**
 * API Configuration
 * Requires PUBLIC_JOBS_API_URL to be set in environment variables
 * Uses $env/dynamic/public which is available at runtime and won't fail if variables don't exist
 */
const getJobsApiUrl = (): string => {
	// Access the env variables at runtime with fallback to development default
	const baseUrl = env.PUBLIC_JOBS_API_URL || 'http://localhost:3002';

	// Remove trailing slash if present
	const cleanUrl = baseUrl.replace(/\/$/, '');
	
	// Add /api/v1 prefix as all routes are under /api/v1
	return `${cleanUrl}/api/v1`;
};

const getAuthApiUrl = (): string => {
	// Access the env variables at runtime with fallback to development default
	const baseUrl = env.PUBLIC_AUTH_API_URL || 'http://localhost:3001';

	// Remove trailing slash if present
	const cleanUrl = baseUrl.replace(/\/$/, '');
	
	// Add /api/v1 prefix as all routes are under /api/v1
	return `${cleanUrl}/api/v1`;
};

// Use a getter to make it lazy-loaded (only evaluated when accessed, not at module load time)
// This ensures env is only checked when apiUrl is actually needed
export const config = {
	get jobsApiUrl() {
		return getJobsApiUrl();
	},
	get authApiUrl() {
		return getAuthApiUrl();
	}
};

