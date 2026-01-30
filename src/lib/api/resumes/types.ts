/**
 * Resumes domain types
 * Based on backend entity and request/response types
 */

export interface Resume {
	id: string;
	userId: string;
	title: string;
	isMain: boolean;
	isFeatured: boolean;
	filePath: string;
	fileName: string;
	fileSize: number;
	tags: string[];
	createdAt: string;
	updatedAt: string;
}

export interface CreateResumeRequest {
	title: string;
	file: File;
	tags?: string[];
	isMain?: boolean;
	isFeatured?: boolean;
}

export interface UpdateResumeRequest {
	title?: string;
	tags?: string[];
	isMain?: boolean;
	isFeatured?: boolean;
}

export interface Pagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface PaginatedResponse {
	resumes: Resume[];
	pagination: Pagination;
}

export interface ApiResponse<T> {
	data: T;
	message: string;
	success: boolean;
}

export interface GenerateResumeRequest {
	jobApplicationId?: string;
	jobDescription?: string;
	language?: string; // full language name (e.g., "english") or 2-letter code
}

export interface GenerateResumeResponse {
	jobId: string;
	status: 'pending';
	message: string;
}

export interface ResumeJobStatus {
	id: string;
	status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
	retryCount?: number;
	maxRetries?: number;
	createdAt: string;
	updatedAt: string;
	error?: string;
	errorType?: string;
	errorAt?: string;
	result?: {
		resumeId: string;
		filePath: string;
		fileSize: number;
	};
}

export interface ListResumesParams {
	page?: number;
	limit?: number;
	isMain?: boolean;
	isFeatured?: boolean;
}
