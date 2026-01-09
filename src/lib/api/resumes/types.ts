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
	jobId?: string;
	jobDescription?: string;
	title?: string;
	preferences?: Record<string, any>;
}

export interface GenerateResumeResponse {
	jobId: string;
	status: 'pending';
	message: string;
}

export interface ListResumesParams {
	page?: number;
	limit?: number;
	isMain?: boolean;
	isFeatured?: boolean;
}
