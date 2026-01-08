/**
 * ML Service API Types
 */

export interface Recommendation {
	application_id: string;
	score: number;
	tier: 'S' | 'A' | 'B' | 'C';
	explanation: string;
	company_name: string;
	job_title: string;
	location?: string;
	company_metrics?: {
		response_rate?: number;
		average_response_time_days?: number;
		success_rate?: number;
		total_applications?: number;
	};
	user_metrics?: {
		previous_applications_to_company?: number;
		previous_success_with_company?: boolean;
	};
}

export interface RecommendationsResponse {
	recommendations: Recommendation[];
	count: number;
	source: 'cache' | 'fresh';
}

export interface UserMetrics {
	total_applications: number;
	accepted_count?: number;
	rejected_count?: number;
	pending_count?: number;
	success_rate: number;
	avg_response_time?: number;
	average_response_time_days?: number;
	fastest_response_days?: number;
	slowest_response_days?: number;
	avg_salary_range?: {
		min?: number;
		max?: number;
	};
	preferred_company_sizes?: string[];
	insights?: string[];
}

export interface CompanyMetrics {
	company_id: string;
	company_name?: string;
	normalized_name?: string;
	location?: string;
	response_rate?: number;
	average_response_time_days?: number;
	avg_response_time_days?: number;
	success_rate?: number;
	total_applications: number;
	company_size?: string;
}

export interface AnalyticsOverview {
	total_applications: number;
	success_rate: number;
	avg_response_time: number;
	avg_salary_range?: {
		min?: number;
		max?: number;
	};
	preferred_company_sizes?: string[];
	insights?: string[];
	// Optional fields that might be present
	user_metrics?: UserMetrics;
	top_companies?: CompanyMetrics[];
	recent_activity?: {
		date: string;
		applications_count: number;
	}[];
}

export interface GetRecommendationsParams {
	limit?: number;
	tier?: 'S' | 'A' | 'B' | 'C';
}

