import { env } from '$env/dynamic/public';

/**
 * API Configuration
 * Requires PUBLIC_JOBS_API_URL to be set in environment variables
 * Uses $env/dynamic/public which is available at runtime and won't fail if variables don't exist
 */
const getJobsApiUrl = (): string => {
	// Access the env variables at runtime with fallback to development default
	const baseUrl = env.PUBLIC_JOBS_API_URL || 'http://localhost:3011';

	// Debug: Log the URL being used (only in development)
	if (import.meta.env.DEV) {
		console.log('[Config] PUBLIC_JOBS_API_URL from env:', env.PUBLIC_JOBS_API_URL);
		console.log('[Config] Using jobs API URL:', baseUrl);
	}

	// Remove trailing slash if present
	const cleanUrl = baseUrl.replace(/\/$/, '');

	// Add /api/v1 prefix as all routes are under /api/v1
	return `${cleanUrl}/api/v1`;
};

const getAuthApiUrl = (): string => {
	// Access the env variables at runtime with fallback to development default
	const baseUrl = env.PUBLIC_AUTH_API_URL || 'http://localhost:3010';

	// Debug: Log the URL being used (only in development)
	if (import.meta.env.DEV) {
		console.log('[Config] PUBLIC_AUTH_API_URL from env:', env.PUBLIC_AUTH_API_URL);
		console.log('[Config] Using auth API URL:', baseUrl);
	}

	// Remove trailing slash if present
	const cleanUrl = baseUrl.replace(/\/$/, '');

	// Add /api/v1 prefix as all routes are under /api/v1
	return `${cleanUrl}/api/v1`;
};

const getMlApiUrl = (): string => {
	// Access the env variables at runtime with fallback to development default
	const baseUrl = env.PUBLIC_ML_API_URL || 'http://localhost:3020';

	// Debug: Log the URL being used (only in development)
	if (import.meta.env.DEV) {
		console.log('[Config] PUBLIC_ML_API_URL from env:', env.PUBLIC_ML_API_URL);
		console.log('[Config] Using ML API URL:', baseUrl);
	}

	// Remove trailing slash if present
	const cleanUrl = baseUrl.replace(/\/$/, '');

	// ML service uses /api/v1 prefix
	return `${cleanUrl}/api/v1`;
};

const getResumeServiceUrl = (): string => {
	const baseUrl = env.PUBLIC_RESUME_SERVICE_URL || 'http://localhost:8001';
	if (import.meta.env.DEV) {
		console.log('[Config] Using resume service URL:', baseUrl);
	}
	return baseUrl.replace(/\/$/, '');
};

const getAiServiceUrl = (): string => {
	const baseUrl = env.PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';
	if (import.meta.env.DEV) {
		console.log('[Config] Using AI service URL:', baseUrl);
	}
	return baseUrl.replace(/\/$/, '');
};

const getResumeWorkerUrl = (): string => {
	const baseUrl = env.PUBLIC_RESUME_WORKER_URL || 'http://localhost:8002';
	if (import.meta.env.DEV) {
		console.log('[Config] Using resume worker URL:', baseUrl);
	}
	return baseUrl.replace(/\/$/, '');
};

// Use a getter to make it lazy-loaded (only evaluated when accessed, not at module load time)
// This ensures env is only checked when apiUrl is actually needed
export const config = {
	get jobsApiUrl() {
		return getJobsApiUrl();
	},
	get authApiUrl() {
		return getAuthApiUrl();
	},
	get mlApiUrl() {
		return getMlApiUrl();
	},
	get resumeServiceUrl() {
		return getResumeServiceUrl();
	},
	get aiServiceUrl() {
		return getAiServiceUrl();
	},
	get resumeWorkerUrl() {
		return getResumeWorkerUrl();
	}
};
