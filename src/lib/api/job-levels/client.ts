import { config } from '$lib/config';
import { createAuthenticatedClient } from '../utils';
import type { JobLevel, ApiResponse } from './types';

/**
 * Job Levels API Client
 * Handles all API calls to the job levels endpoints
 */
class JobLevelsApiClient {
	private client = createAuthenticatedClient(`${config.jobsApiUrl}/job-applications/job-levels`);

	/**
	 * Get a job level by ID
	 */
	async get(id: string): Promise<JobLevel> {
		const response = await this.client.get<ApiResponse<JobLevel>>(`/${id}`);
		return response.data.data;
	}

	/**
	 * List all job levels
	 */
	async list(): Promise<JobLevel[]> {
		const response = await this.client.get<ApiResponse<JobLevel[]>>('/');
		return response.data.data;
	}
}

// Export singleton instance
export const jobLevelsApi = new JobLevelsApiClient();
