/**
 * Job Applications domain types
 * Based on backend entity and request/response types
 */

export type ApplicationStatus =
	| 'pending'
	| 'processing'
	| 'applied'
	| 'contacted'
	| 'rejected'
	| 'accepted'
	| 'failed';

export type InterestLevel = 'low' | 'medium' | 'high' | 'very-high';

export interface JobApplication {
	id: string;
	userId: string;
	companyName: string;
	location?: string;
	jobTitle: string;
	jobUrl: string;
	website: string;
	appliedAt?: string | null;
	coverLetter?: string;
	linkedInContact: boolean;
	status: ApplicationStatus;
	errorMessage?: string;
	resumeId?: string | null;
	salaryMin?: number | null;
	salaryMax?: number | null;
	salaryCurrency?: string;
	jobDescription?: string;
	deadline?: string | null;
	interestLevel?: InterestLevel;
	notes?: string;
	tags?: string[];
	followUpDate?: string | null;
	responseReceivedAt?: string | null;
	rejectionReason?: string;
	interviewCount: number;
	nextInterviewDate?: string | null;
	source?: string;
	applicationMethod?: string;
	language?: string;
	createdAt: string;
	updatedAt: string;
	resume?: Resume | null;
}

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

export interface CreateJobApplicationRequest {
	companyName: string;
	location?: string;
	jobTitle: string;
	jobUrl: string;
	website: string;
	interestLevel?: InterestLevel;
	tags?: string[];
	followUpDate?: string;
	notes?: string;
}

export interface UpdateJobApplicationRequest {
	resumeId?: string;
	salaryMin?: number;
	salaryMax?: number;
	salaryCurrency?: string;
	jobDescription?: string;
	coverLetter?: string;
	deadline?: string;
	interestLevel?: InterestLevel;
	notes?: string;
	tags?: string[];
	followUpDate?: string;
	responseReceivedAt?: string;
	rejectionReason?: string;
	nextInterviewDate?: string;
	source?: string;
	applicationMethod?: string;
	language?: string;
}

export interface UpdateJobApplicationStatusRequest {
	status: ApplicationStatus;
}

export interface ListJobApplicationsParams {
	page?: number;
	limit?: number;
	website?: string;
	status?: ApplicationStatus;
	resumeId?: string;
	interestLevel?: InterestLevel;
	source?: string;
	applicationMethod?: string;
	language?: string;
	appliedDateFrom?: string;
	appliedDateTo?: string;
	tags?: string[];
}

export interface PaginatedResponse<T> {
	applications: T[];
	total: number;
	limit: number;
	offset: number;
}

export interface ApiResponse<T> {
	success: boolean;
	message?: string;
	data: T;
}

