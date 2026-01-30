import { config } from '$lib/config';
import { createAuthenticatedClient } from '../utils';
import type {
	Resume,
	CreateResumeRequest,
	UpdateResumeRequest,
	ApiResponse,
	PaginatedResponse,
	ListResumesParams,
	GenerateResumeRequest,
	GenerateResumeResponse
} from './types';

/**
 * Resumes API Client
 * Handles all API calls to the resumes endpoints
 */
class ResumesApiClient {
	private client = createAuthenticatedClient(`${config.jobsApiUrl}/resumes`);

	/**
	 * Create a new resume with file upload
	 */
	async create(data: CreateResumeRequest): Promise<Resume> {
		const formData = new FormData();
		formData.append('title', data.title);
		formData.append('file', data.file);
		if (data.isMain !== undefined) formData.append('isMain', data.isMain.toString());
		if (data.isFeatured !== undefined) formData.append('isFeatured', data.isFeatured.toString());
		if (data.tags) {
			data.tags.forEach((tag) => formData.append('tags', tag));
		}

		// Use the dedicated upload endpoint which expects multipart/form-data
		const response = await this.client.post<ApiResponse<any>>('/upload', formData);
		const d = response.data?.data;
		// Normalize different backend shapes
		if (d && d.id) return d as Resume;
		if (Array.isArray(d) && d.length > 0) return d[0] as Resume;
		if (d && Array.isArray(d.resumes) && d.resumes.length > 0) return d.resumes[0] as Resume;
		throw new Error('Invalid response from resume upload');
	}

	/**
	 * Get a resume by ID
	 */
	async get(id: string): Promise<Resume> {
		const response = await this.client.get<ApiResponse<Resume>>(`/${id}`);
		return response.data.data;
	}

	/**
	 * Update a resume (metadata only, not file)
	 */
	async update(id: string, data: UpdateResumeRequest): Promise<Resume> {
		const response = await this.client.put<ApiResponse<Resume>>(`/${id}`, data);
		return response.data.data;
	}

	/**
	 * Delete a resume
	 */
	async delete(id: string): Promise<void> {
		await this.client.delete<ApiResponse<null>>(`/${id}`);
	}

	/**
	 * List resumes with filters and pagination
	 */
	async list(params?: ListResumesParams): Promise<PaginatedResponse> {
		const queryParams = new URLSearchParams();
		if (params?.page) queryParams.append('page', params.page.toString());
		if (params?.limit) queryParams.append('limit', params.limit.toString());
		if (params?.isMain !== undefined) queryParams.append('isMain', params.isMain.toString());
		if (params?.isFeatured !== undefined)
			queryParams.append('isFeatured', params.isFeatured.toString());

		const queryString = queryParams.toString();
		const url = queryString ? `/?${queryString}` : '/';
		const response = await this.client.get<ApiResponse<any>>(url);
		// Backend may return either { data: [] } or { data: { resumes: [...], pagination: {...} } }
		const returned = response.data?.data;
		if (Array.isArray(returned)) {
			// normalize to PaginatedResponse
			return {
				resumes: returned,
				pagination: {
					page: params?.page ?? 1,
					limit: params?.limit ?? returned.length,
					total: returned.length,
					totalPages: 1
				}
			};
		}
		// If backend already returned paginated shape
		if (returned && typeof returned === 'object') {
			if (returned.resumes) return returned as PaginatedResponse;
			// older shape: { items, pagination }
			if (returned.items && Array.isArray(returned.items)) {
				return {
					resumes: returned.items,
					pagination: returned.pagination ?? {
						page: params?.page ?? 1,
						limit: params?.limit ?? returned.items.length,
						total: returned.items.length,
						totalPages: 1
					}
				};
			}
		}
		// Fallback: empty list
		return {
			resumes: [],
			pagination: { page: 1, limit: 0, total: 0, totalPages: 0 }
		};
	}

	/**
	 * Download a resume file
	 */
	async download(id: string): Promise<Blob> {
		const response = await this.client.get<Blob>(`/${id}/download`, {
			responseType: 'blob'
		});
		return response.data;
	}

	/**
	 * Set a resume as main
	 */
	async setAsMain(id: string): Promise<Resume> {
		const response = await this.client.patch<ApiResponse<Resume>>(`/${id}/set-main`, {});
		return response.data.data;
	}

	/**
	 * Set a resume as featured
	 */
	async setAsFeatured(id: string): Promise<Resume> {
		const response = await this.client.patch<ApiResponse<Resume>>(`/${id}/set-featured`, {});
		return response.data.data;
	}

	/**
	 * Generate a new resume using AI
	 * Returns a job ID that can be used to track progress
	 */
	async generate(data: GenerateResumeRequest): Promise<GenerateResumeResponse> {
		// Normalize language codes to full names when possible
		const mapped = { ...data } as any;
		if (data.language) {
			const l = data.language.toLowerCase();
			const map: Record<string, string> = {
				en: 'english',
				pt: 'portuguese',
				es: 'spanish',
				fr: 'french',
				de: 'german'
			};
			if (map[l]) mapped.language = map[l];
			else mapped.language = data.language; // assume already full name
		}

		const response = await this.client.post<ApiResponse<GenerateResumeResponse>>(
			'/generate',
			mapped
		);
		return response.data.data;
	}

	/**
	 * Get the status of a resume generation job
	 */
	async getJobStatus(jobId: string): Promise<import('./types').ResumeJobStatus> {
		const response = await this.client.get<ApiResponse<import('./types').ResumeJobStatus>>(
			`/jobs/${jobId}`
		);
		return response.data.data;
	}
}

// Export singleton instance
export const resumesApi = new ResumesApiClient();
