import { config } from '$lib/config';
import { createAuthenticatedClient } from '../utils';
import type {
	InterviewStage,
	CreateInterviewStageRequest,
	UpdateInterviewStageRequest,
	ApiResponse,
	ListInterviewStagesParams
} from './types';

/**
 * Interview Stages API Client
 * Handles all API calls to the interview stages endpoints
 */
class InterviewStagesApiClient {
	private client = createAuthenticatedClient(`${config.jobsApiUrl}/job-applications`);

	/**
	 * Create a new interview stage
	 */
	async create(
		jobApplicationId: string,
		data: CreateInterviewStageRequest
	): Promise<InterviewStage> {
		const response = await this.client.post<ApiResponse<InterviewStage>>(
			`/${jobApplicationId}/interview-stages`,
			data
		);
		// Normalize response: some backends return { data: { stages: [...] } }
		const d: any = response.data.data;
		if (Array.isArray(d)) return d[0];
		if (d && Array.isArray(d.stages)) return d.stages[0];
		return d as InterviewStage;
	}

	/**
	 * Get an interview stage by ID
	 */
	async get(jobApplicationId: string, stageId: string): Promise<InterviewStage> {
		const response = await this.client.get<ApiResponse<InterviewStage>>(
			`/${jobApplicationId}/interview-stages/${stageId}`
		);
		return response.data.data;
	}

	/**
	 * Update an interview stage
	 */
	async update(
		jobApplicationId: string,
		stageId: string,
		data: UpdateInterviewStageRequest
	): Promise<InterviewStage> {
		const response = await this.client.put<ApiResponse<InterviewStage>>(
			`/${jobApplicationId}/interview-stages/${stageId}`,
			data
		);
		return response.data.data;
	}

	/**
	 * Delete an interview stage
	 */
	async delete(jobApplicationId: string, stageId: string): Promise<void> {
		await this.client.delete<ApiResponse<null>>(`/${jobApplicationId}/interview-stages/${stageId}`);
	}

	/**
	 * List interview stages for a job application
	 */
	async list(params: ListInterviewStagesParams): Promise<InterviewStage[]> {
		const queryParams = new URLSearchParams();
		if (params.page) queryParams.append('page', params.page.toString());
		if (params.limit) queryParams.append('limit', params.limit.toString());

		const queryString = queryParams.toString();
		const url = queryString
			? `/${params.jobApplicationId}/interview-stages?${queryString}`
			: `/${params.jobApplicationId}/interview-stages`;

		const response = await this.client.get<ApiResponse<any>>(url);
		const d = response.data.data;
		// backend may return an array directly, or an object like { count, stages: [...] }
		if (Array.isArray(d)) return d as InterviewStage[];
		if (d && Array.isArray(d.stages)) return d.stages as InterviewStage[];
		if (d && Array.isArray(d.data)) return d.data as InterviewStage[];
		return [];
	}
}

// Export singleton instance
export const interviewStagesApi = new InterviewStagesApiClient();
