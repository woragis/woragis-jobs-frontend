/**
 * Job Levels domain types
 */

export interface JobLevel {
	id: string;
	name: string;
	seniority: 'entry' | 'junior' | 'mid' | 'pleno' | 'senior';
	intensity: 'low' | 'medium' | 'high';
	createdAt: string;
}

export interface ApiResponse<T> {
	success: boolean;
	data: T;
}
