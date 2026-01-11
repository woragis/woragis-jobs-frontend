/**
 * Polling utilities for resume generation updates
 */

import { resumesApi } from './client';
import type { ResumeJobStatus } from './types';

export interface ResumeGenerationEvent {
	status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
	step?: string;
	progress?: number;
	message?: string;
	downloadUrl?: string;
	error?: string;
}

export interface PollingOptions {
	onUpdate: (event: ResumeGenerationEvent) => void;
	onError?: (error: Error) => void;
	onComplete?: (resumeId: string) => void;
	interval?: number; // Polling interval in ms, default 2000
}

/**
 * Polls the job status endpoint to track resume generation progress
 * @param jobId - The resume job ID to track
 * @param options - Callbacks for handling updates
 * @returns A function to stop polling
 */
export function subscribeToResumeGeneration(jobId: string, options: PollingOptions): () => void {
	let intervalId: number | null = null;
	let isActive = true;
	const pollInterval = options.interval || 2000;

	const poll = async () => {
		if (!isActive) return;

		try {
			const jobStatus: ResumeJobStatus = await resumesApi.getJobStatus(jobId);
			
			const progress = calculateProgress(jobStatus.status);
			const event: ResumeGenerationEvent = {
				status: jobStatus.status,
				progress,
				message: getStatusMessage(jobStatus.status),
				error: jobStatus.error
			};

			options.onUpdate(event);

			if (jobStatus.status === 'completed') {
				isActive = false;
				if (intervalId) clearInterval(intervalId);
				if (jobStatus.result?.resumeId) {
					options.onComplete?.(jobStatus.result.resumeId);
				}
			} else if (jobStatus.status === 'failed') {
				isActive = false;
				if (intervalId) clearInterval(intervalId);
				options.onError?.(new Error(jobStatus.error || 'Resume generation failed'));
			} else if (jobStatus.status === 'cancelled') {
				isActive = false;
				if (intervalId) clearInterval(intervalId);
				options.onError?.(new Error('Resume generation was cancelled'));
			}
		} catch (err) {
			console.error('Failed to poll job status:', err);
			options.onError?.(err instanceof Error ? err : new Error('Failed to check job status'));
			isActive = false;
			if (intervalId) clearInterval(intervalId);
		}
	};

	// Start polling immediately
	poll();
	
	// Then poll at intervals
	intervalId = window.setInterval(poll, pollInterval);

	// Return cleanup function
	return () => {
		isActive = false;
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}
	};
}

function calculateProgress(status: string): number {
	switch (status) {
		case 'pending':
			return 10;
		case 'processing':
			return 50;
		case 'completed':
			return 100;
		case 'failed':
		case 'cancelled':
			return 0;
		default:
			return 0;
	}
}

function getStatusMessage(status: string): string {
	switch (status) {
		case 'pending':
			return 'Job queued, waiting to start...';
		case 'processing':
			return 'AI is generating your tailored resume...';
		case 'completed':
			return 'Resume generated successfully!';
		case 'failed':
			return 'Resume generation failed';
		case 'cancelled':
			return 'Resume generation was cancelled';
		default:
			return 'Processing...';
	}
}

/**
 * Generates a user-friendly message based on the current step
 */
export function getStepMessage(step?: string): string {
	const messages: Record<string, string> = {
		fetching_data: 'Gathering your profile data...',
		posts_db: 'Fetching your technical writings and posts...',
		management_db: 'Retrieving your projects and experiences...',
		ai_service: 'AI is analyzing the job requirements...',
		ai_generating: 'Generating tailored resume content...',
		resume_service: 'Creating your professional PDF...',
		saving: 'Saving your resume...',
		completed: 'Resume generated successfully!'
	};

	return step ? messages[step] || 'Processing...' : 'Initializing...';
}
