<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { subscribeToResumeGeneration, type ResumeGenerationEvent } from '$lib/api/resumes/sse';
	import { config } from '$lib/config';

	export let jobId: string;
	export let onComplete: (resumeId: string) => void;
	export let onError: (error: string) => void;

	let event: ResumeGenerationEvent = {
		status: 'pending',
		progress: 10,
		message: 'Starting resume generation...'
	};

	let unsubscribe: (() => void) | null = null;
	let isRetrying = false;
	let isCancelling = false;

	async function handleRetry() {
		isRetrying = true;
		try {
			const response = await fetch(`${config.jobsApiUrl}/resumes/jobs/${jobId}/retry`, {
				method: 'POST',
				credentials: 'include'
			});
			if (!response.ok) throw new Error('Failed to retry job');
			
			// Reset event and restart polling
			event = { status: 'pending', progress: 10, message: 'Retrying resume generation...' };
			unsubscribe?.();
			unsubscribe = subscribeToResumeGeneration(jobId, {
				onUpdate: (evt) => (event = evt),
				onComplete: (resumeId) => {
					event = { ...event, status: 'completed', progress: 100, message: 'Resume generated!' };
					onComplete(resumeId);
				},
				onError: (error) => {
					event = { ...event, status: 'failed', message: 'Generation failed', error: error.message };
					onError(error.message);
				}
			});
		} catch (err: any) {
			onError(err.message || 'Failed to retry job');
		} finally {
			isRetrying = false;
		}
	}

	async function handleCancel() {
		isCancelling = true;
		try {
			const response = await fetch(`${config.jobsApiUrl}/resumes/jobs/${jobId}/cancel`, {
				method: 'POST',
				credentials: 'include'
			});
			if (!response.ok) throw new Error('Failed to cancel job');
			
			event = { ...event, status: 'cancelled', message: 'Job cancelled by user' };
			unsubscribe?.();
		} catch (err: any) {
			onError(err.message || 'Failed to cancel job');
		} finally {
			isCancelling = false;
		}
	}

	onMount(() => {
		// Subscribe to polling updates
		unsubscribe = subscribeToResumeGeneration(jobId, {
			onUpdate: (evt) => {
				event = evt;
			},
			onComplete: (resumeId) => {
				event = { ...event, status: 'completed', progress: 100, message: 'Resume generated!' };
				onComplete(resumeId);
			},
			onError: (error) => {
				event = { 
					...event, 
					status: 'failed', 
					message: 'Generation failed', 
					error: error.message 
				};
				onError(error.message);
			}
		});
	});

	onDestroy(() => {
		unsubscribe?.();
	});
</script>

<div class="progress-container">
	<div class="progress-header">
		<h3>Generating Your Resume</h3>
		{#if event.status === 'completed'}
			<span class="status-badge success">✓ Complete</span>
		{:else if event.status === 'failed' || event.status === 'cancelled'}
			<span class="status-badge error">✗ {event.status === 'cancelled' ? 'Cancelled' : 'Failed'}</span>
		{:else}
			<span class="status-badge processing">⟳ {event.status === 'processing' ? 'Processing' : 'Queued'}</span>
		{/if}
	</div>

	<div class="progress-message">
		{event.message || 'Preparing...'}
	</div>

	<div class="progress-bar">
		<div 
			class="progress-fill" 
			class:complete={event.status === 'completed'}
			class:error={event.status === 'failed' || event.status === 'cancelled'}
			style="width: {event.progress || 0}%"
		></div>
	</div>

	{#if event.progress !== undefined && event.status !== 'failed' && event.status !== 'cancelled'}
		<div class="progress-percent">{Math.round(event.progress)}%</div>
	{/if}

	{#if event.error}
		<div class="error-message">
			{event.error}
		</div>
	{/if}

	{#if event.status === 'failed' || event.status === 'cancelled'}
		<div class="action-buttons">
			<button 
				on:click={handleRetry} 
				disabled={isRetrying || isCancelling}
				class="retry-btn"
			>
				{isRetrying ? '⟳ Retrying...' : '↻ Retry'}
			</button>
			<button 
				on:click={handleCancel} 
				disabled={isRetrying || isCancelling || event.status === 'cancelled'}
				class="cancel-btn"
			>
				{isCancelling ? '⏹ Cancelling...' : '✕ Cancel'}
			</button>
		</div>
	{/if}
</div>

<style>
	.progress-container {
		background: white;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		max-width: 600px;
		margin: 0 auto;
	}

	.progress-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}

	.progress-header h3 {
		margin: 0;
		font-size: 20px;
		font-weight: 600;
		color: #1a1a1a;
	}

	.status-badge {
		padding: 4px 12px;
		border-radius: 16px;
		font-size: 14px;
		font-weight: 500;
	}

	.status-badge.success {
		background: #d4edda;
		color: #155724;
	}

	.status-badge.error {
		background: #f8d7da;
		color: #721c24;
	}

	.status-badge.processing {
		background: #d1ecf1;
		color: #0c5460;
		animation: pulse 2s infinite;
	}

	.progress-message {
		font-size: 16px;
		color: #555;
		margin-bottom: 16px;
		min-height: 24px;
	}

	.progress-bar {
		width: 100%;
		height: 12px;
		background: #e9ecef;
		border-radius: 6px;
		overflow: hidden;
		margin-bottom: 8px;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #0066cc, #0052a3);
		transition: width 0.5s ease;
		border-radius: 6px;
	}

	.progress-fill.complete {
		background: linear-gradient(90deg, #28a745, #218838);
	}

	.progress-fill.error {
		background: linear-gradient(90deg, #dc3545, #c82333);
	}

	.progress-percent {
		text-align: right;
		font-size: 14px;
		color: #666;
		font-weight: 500;
	}

	.error-message {
		background: #f8d7da;
		color: #721c24;
		padding: 12px 16px;
		border-radius: 8px;
		border-left: 4px solid #dc3545;
		font-size: 14px;
		margin-top: 16px;
	}

	.action-buttons {
		display: flex;
		gap: 12px;
		margin-top: 20px;
		justify-content: flex-end;
	}

	.retry-btn,
	.cancel-btn {
		padding: 8px 16px;
		border-radius: 6px;
		border: none;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.retry-btn {
		background: #28a745;
		color: white;
	}

	.retry-btn:hover:not(:disabled) {
		background: #218838;
		box-shadow: 0 2px 6px rgba(40, 167, 69, 0.3);
	}

	.cancel-btn {
		background: #6c757d;
		color: white;
	}

	.cancel-btn:hover:not(:disabled) {
		background: #5a6268;
		box-shadow: 0 2px 6px rgba(108, 117, 125, 0.3);
	}

	.retry-btn:disabled,
	.cancel-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error-message {
		margin-top: 16px;
		padding: 12px;
		background: #f8d7da;
		border: 1px solid #f5c6cb;
		border-radius: 6px;
		color: #721c24;
		font-size: 14px;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}
</style>
