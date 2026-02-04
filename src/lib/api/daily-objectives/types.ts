/**
 * Daily Objectives domain types
 */

export interface DailyObjective {
	id: string;
	userId: string;
	totalTarget: number;
	juniorTarget: number;
	plenoTarget: number;
	seniorTarget: number;
	createdAt: string;
	updatedAt: string;
}

export interface DailyStats {
	date: string; // ISO 8601 date string (YYYY-MM-DD)
	totalCount: number;
	juniorCount: number;
	plenoCount: number;
	seniorCount: number;
}

export interface DailyProgress {
	date: string; // ISO 8601 date string (YYYY-MM-DD)
	totalCount: number;
	juniorCount: number;
	plenoCount: number;
	seniorCount: number;
	totalTarget: number;
	juniorTarget: number;
	plenoTarget: number;
	seniorTarget: number;
	totalProgress: number; // 0-100
	juniorProgress: number; // 0-100
	plenoProgress: number; // 0-100
	seniorProgress: number; // 0-100
}

export interface DailyProgressResponse {
	data: DailyProgress[];
}

export interface CreateObjectiveRequest {
	totalTarget: number;
	juniorTarget: number;
	plenoTarget: number;
	seniorTarget: number;
}

export interface ApiResponse<T> {
	success: boolean;
	data: T;
}

export type HistoryPreset = '7days' | '30days' | '90days';
