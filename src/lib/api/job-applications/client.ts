import { config } from '$lib/config';
import { createAuthenticatedClient } from '../utils';
import type {
	JobApplication,
	CreateJobApplicationRequest,
	UpdateJobApplicationRequest,
	UpdateJobApplicationStatusRequest,
	ListJobApplicationsParams,
	PaginatedResponse,
	ApiResponse
} from './types';

/**
 * Job Applications API Client
 * Handles all API calls to the job applications endpoints
 */
class JobApplicationsApiClient {
	private client = createAuthenticatedClient(`${config.jobsApiUrl}/job-applications`);

	/**
	 * Create a new job application
	 */
	async create(data: CreateJobApplicationRequest): Promise<JobApplication> {
		const response = await this.client.post<ApiResponse<JobApplication>>('/', data);
		return response.data.data;
	}

	/**
	 * Get a job application by ID
	 */
	async get(id: string): Promise<JobApplication> {
		const response = await this.client.get<ApiResponse<JobApplication>>(`/${id}`);
		return response.data.data;
	}

	/**
	 * Update a job application
	 */
	async update(id: string, data: UpdateJobApplicationRequest): Promise<JobApplication> {
		const response = await this.client.patch<ApiResponse<JobApplication>>(`/${id}`, data);
		return response.data.data;
	}

	/**
	 * Update job application status
	 */
	async updateStatus(id: string, data: UpdateJobApplicationStatusRequest): Promise<JobApplication> {
		const response = await this.client.patch<ApiResponse<JobApplication>>(`/${id}/status`, data);
		return response.data.data;
	}

	/**
	 * Delete a job application
	 */
	async delete(id: string): Promise<void> {
		await this.client.delete<ApiResponse<null>>(`/${id}`);
	}

	/**
	 * List job applications with filters and pagination
	 */
	async list(params?: ListJobApplicationsParams): Promise<PaginatedResponse<JobApplication>> {
		const queryParams = new URLSearchParams();
		if (params?.page) queryParams.append('page', params.page.toString());
		if (params?.limit) queryParams.append('limit', params.limit.toString());
		if (params?.website) queryParams.append('website', params.website);
		if (params?.status) queryParams.append('status', params.status);
		if (params?.resumeId) queryParams.append('resumeId', params.resumeId);
		if (params?.interestLevel) queryParams.append('interestLevel', params.interestLevel);
		if (params?.source) queryParams.append('source', params.source);
		if (params?.applicationMethod)
			queryParams.append('applicationMethod', params.applicationMethod);
		if (params?.language) queryParams.append('language', params.language);

		const queryString = queryParams.toString();
		const url = queryString ? `/?${queryString}` : '/';
		const response = await this.client.get<ApiResponse<PaginatedResponse<JobApplication>>>(url);
		return response.data.data;
	}
}

// Export singleton instance
export const jobApplicationsApi = new JobApplicationsApiClient();
