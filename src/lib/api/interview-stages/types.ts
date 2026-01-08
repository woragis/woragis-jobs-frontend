/**
 * Interview Stages domain types
 * Based on backend entity and request/response types
 */

export type StageType =
	| 'phone-screen'
	| 'technical'
	| 'behavioral'
	| 'system-design'
	| 'final'
	| 'hr'
	| 'manager'
	| 'panel'
	| 'other';

export type StageOutcome = 'pending' | 'passed' | 'failed' | 'cancelled';

export interface InterviewStage {
	id: string;
	jobApplicationId: string;
	stageType: StageType;
	scheduledDate?: string | undefined;
	completedDate?: string | null;
	interviewerName?: string;
	interviewerEmail?: string;
	location?: string;
	notes?: string;
	feedback?: string;
	outcome: StageOutcome;
	createdAt: string;
	updatedAt: string;
}

export interface CreateInterviewStageRequest {
	stageType: StageType;
	scheduledDate?: string;
	interviewerName?: string;
	interviewerEmail?: string;
	location?: string;
	notes?: string;
}

export interface UpdateInterviewStageRequest {
	stageType?: StageType;
	scheduledDate?: string;
	completedDate?: string;
	interviewerName?: string;
	interviewerEmail?: string;
	location?: string;
	notes?: string;
	feedback?: string;
	outcome?: StageOutcome;
}

export interface ApiResponse<T> {
	data: T;
	message: string;
	success: boolean;
}

export interface ListInterviewStagesParams {
	jobApplicationId: string;
	page?: number;
	limit?: number;
}
