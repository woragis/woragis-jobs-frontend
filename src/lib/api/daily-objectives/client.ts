import { config } from '$lib/config';
import { createAuthenticatedClient } from '../utils';
import type {
	DailyObjective,
	DailyProgress,
	CreateObjectiveRequest,
	ApiResponse,
	HistoryPreset,
	DailyProgressResponse
} from './types';

/**
 * Daily Objectives API Client
 * Handles all API calls to the daily objectives endpoints
 */
class DailyObjectivesApiClient {
	private client = createAuthenticatedClient(`${config.jobsApiUrl}/job-applications`);

	/**
	 * Create user's daily objectives
	 */
	async createObjective(req: CreateObjectiveRequest): Promise<DailyObjective> {
		const response = await this.client.post<ApiResponse<DailyObjective>>('/daily-objectives', req);
		return response.data.data;
	}

	/**
	 * Get user's current daily objectives
	 */
	async getObjective(): Promise<DailyObjective> {
		const response = await this.client.get<ApiResponse<DailyObjective>>('/daily-objectives');
		return response.data.data;
	}

	/**
	 * Update user's daily objectives
	 */
	async updateObjective(req: CreateObjectiveRequest): Promise<DailyObjective> {
		const response = await this.client.patch<ApiResponse<DailyObjective>>('/daily-objectives', req);
		return response.data.data;
	}

	/**
	 * Get today's progress against objectives
	 */
	async getTodayProgress(): Promise<DailyProgress> {
		const response = await this.client.get<ApiResponse<DailyProgress>>('/daily-progress/today');
		return response.data.data;
	}

	/**
	 * Get historical progress for a preset or date range
	 * @param preset - '7days', '30days', or '90days'
	 * @param from - Optional ISO 8601 date (YYYY-MM-DD) to override preset
	 * @param to - Optional ISO 8601 date (YYYY-MM-DD) to override preset
	 */
	async getHistoricalProgress(
		preset?: HistoryPreset,
		from?: string,
		to?: string
	): Promise<DailyProgress[]> {
		const params = new URLSearchParams();

		if (from && to) {
			params.append('from', from);
			params.append('to', to);
		} else if (preset) {
			params.append('preset', preset);
		} else {
			params.append('preset', '7days'); // default to 7 days
		}

		const queryString = params.toString();
		const response = await this.client.get<ApiResponse<DailyProgressResponse>>(
			`/daily-progress/history?${queryString}`
		);

		// The response.data.data.data contains the array since DailyProgressResponse has a 'data' field
		if (Array.isArray(response.data.data.data)) {
			return response.data.data.data;
		}
		return response.data.data as any;
	}
}

// Export singleton instance
export const dailyObjectivesApi = new DailyObjectivesApiClient();
