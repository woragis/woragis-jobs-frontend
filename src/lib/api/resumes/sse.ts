/**
 * Server-Sent Events (SSE) utilities for real-time resume generation updates
 */

export interface ResumeGenerationEvent {
	status: 'pending' | 'processing' | 'completed' | 'failed';
	step?: string;
	progress?: number;
	message?: string;
	downloadUrl?: string;
	error?: string;
}

export interface SSEOptions {
	onUpdate: (event: ResumeGenerationEvent) => void;
	onError?: (error: Error) => void;
	onComplete?: (downloadUrl: string) => void;
}

/**
 * Creates an SSE connection to track resume generation progress
 * @param jobId - The resume job ID to track
 * @param options - Callbacks for handling updates
 * @returns A function to close the connection
 */
export function subscribeToResumeGeneration(jobId: string, options: SSEOptions): () => void {
	const apiUrl = import.meta.env.VITE_JOBS_API_URL || 'http://localhost:4000';
	const eventSource = new EventSource(`${apiUrl}/api/v1/resumes/jobs/${jobId}/stream`, {
		withCredentials: true
	});

	eventSource.onmessage = (event) => {
		try {
			const data: ResumeGenerationEvent = JSON.parse(event.data);
			options.onUpdate(data);

			if (data.status === 'completed' && data.downloadUrl) {
				options.onComplete?.(data.downloadUrl);
				eventSource.close();
			} else if (data.status === 'failed') {
				options.onError?.(new Error(data.error || 'Resume generation failed'));
				eventSource.close();
			}
		} catch (err) {
			console.error('Failed to parse SSE message:', err);
		}
	};

	eventSource.onerror = (error) => {
		console.error('SSE connection error:', error);
		options.onError?.(new Error('Connection to server lost'));
		eventSource.close();
	};

	// Return cleanup function
	return () => {
		eventSource.close();
	};
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
