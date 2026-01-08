<script lang="ts">
	import { page } from '$app/stores';
	import { jobApplicationsApi, type JobApplication } from '$lib/api/job-applications';
	import { interviewStagesApi, type InterviewStage, type StageType } from '$lib/api/interview-stages';
	import { onMount } from 'svelte';
	import { config } from '$lib/config';

	let jobApplication: JobApplication | null = null;
	let stages: InterviewStage[] = [];
	let isLoading = true;
	let error: string | null = null;
	let isCreating = false;

	// Form state
	let showCreateForm = false;
	let selectedStageType: StageType = 'phone-screen';
	let scheduledDate = '';
	let interviewerName = '';
	let interviewerEmail = '';
	let location = '';
	let notes = '';

	const stageTypeOptions: StageType[] = [
		'phone-screen',
		'technical',
		'behavioral',
		'system-design',
		'final',
		'hr',
		'manager',
		'panel',
		'other',
	];

	onMount(async () => {
		const id = $page.params.id;
		if (!id) {
			error = 'Job application ID is required';
			return;
		}

		// Ensure CSRF token is available for subsequent create/delete requests.
		try {
			await fetch(`${config.jobsApiUrl}/csrf-token`, {
				method: 'GET',
				credentials: 'include',
			});
		} catch (err: any) {
			console.debug('CSRF token fetch completed (may have errors, but token should be set)');
		}

		await loadData(id);
	});

	async function loadData(id: string) {
		isLoading = true;
		error = null;
		try {
			jobApplication = await jobApplicationsApi.get(id);
			stages = await interviewStagesApi.list({ jobApplicationId: id });
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load data';
		} finally {
			isLoading = false;
		}
	}

	async function handleCreateStage() {
		if (!jobApplication) return;

		isCreating = true;
		error = null;

		try {
			const newStage = await interviewStagesApi.create(jobApplication.id, {
				stageType: selectedStageType,
				scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
				interviewerName: interviewerName || undefined,
				interviewerEmail: interviewerEmail || undefined,
				location: location || undefined,
				notes: notes || undefined,
			});

			stages = [...stages, newStage];
			resetForm();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create interview stage';
		} finally {
			isCreating = false;
		}
	}

	async function handleDeleteStage(stageId: string) {
		if (!jobApplication) return;
		if (!confirm('Are you sure you want to delete this interview stage?')) return;

		try {
			await interviewStagesApi.delete(jobApplication.id, stageId);
			stages = stages.filter((s) => s.id !== stageId);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete interview stage';
		}
	}

	function resetForm() {
		showCreateForm = false;
		selectedStageType = 'phone-screen';
		scheduledDate = '';
		interviewerName = '';
		interviewerEmail = '';
		location = '';
		notes = '';
	}

	function formatDate(dateString: string | undefined) {
		if (!dateString) return 'Not set';
		return new Date(dateString).toLocaleDateString();
	}

	function formatTime(dateString: string | undefined) {
		if (!dateString) return '';
		return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	function getOutcomeBadgeClass(outcome: string): string {
		switch (outcome) {
			case 'passed':
				return 'badge-success';
			case 'failed':
				return 'badge-danger';
			case 'cancelled':
				return 'badge-warning';
			default:
				return 'badge-info';
		}
	}

	function getStageTypeDisplay(type: string): string {
		return type.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
	}
</script>

<div class="interview-stages-container">
	<div class="header">
		{#if jobApplication}
			<div class="breadcrumb">
				<a href="/job-applications">Job Applications</a>
				<span>/</span>
				<span>{jobApplication.companyName} - {jobApplication.jobTitle}</span>
			</div>
			<h1>Interview Stages</h1>
			<p class="subtitle">{jobApplication.companyName} - {jobApplication.jobTitle}</p>
		{/if}
	</div>

	{#if error}
		<div class="alert alert-error">
			<p>{error}</p>
		</div>
	{/if}

	{#if isLoading}
		<div class="loading">Loading interview stages...</div>
	{:else}
		<div class="create-stage-btn">
			<button
				on:click={() => (showCreateForm = !showCreateForm)}
				class="btn btn-primary"
			>
				{showCreateForm ? 'Cancel' : 'Add Interview Stage'}
			</button>
		</div>

		{#if showCreateForm}
			<div class="create-form">
				<h2>New Interview Stage</h2>

				<div class="form-group">
					<label for="stage-type">Stage Type</label>
					<select id="stage-type" bind:value={selectedStageType} disabled={isCreating}>
						{#each stageTypeOptions as type}
							<option value={type}>{getStageTypeDisplay(type)}</option>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label for="scheduled-date">Scheduled Date & Time</label>
					<input
						id="scheduled-date"
						type="datetime-local"
						bind:value={scheduledDate}
						disabled={isCreating}
					/>
				</div>

				<div class="form-group">
					<label for="interviewer-name">Interviewer Name</label>
					<input
						id="interviewer-name"
						type="text"
						placeholder="e.g., John Smith"
						bind:value={interviewerName}
						disabled={isCreating}
					/>
				</div>

				<div class="form-group">
					<label for="interviewer-email">Interviewer Email</label>
					<input
						id="interviewer-email"
						type="email"
						placeholder="e.g., john@company.com"
						bind:value={interviewerEmail}
						disabled={isCreating}
					/>
				</div>

				<div class="form-group">
					<label for="location">Location</label>
					<input
						id="location"
						type="text"
						placeholder="e.g., NYC Office, Video Call, or 123 Main St"
						bind:value={location}
						disabled={isCreating}
					/>
				</div>

				<div class="form-group">
					<label for="notes">Notes</label>
					<textarea
						id="notes"
						placeholder="Any additional notes about this stage..."
						bind:value={notes}
						disabled={isCreating}
						rows="3"
					></textarea>
				</div>

				<div class="form-actions">
					<button on:click={handleCreateStage} disabled={isCreating} class="btn btn-primary">
						{isCreating ? 'Creating...' : 'Create Stage'}
					</button>
					<button on:click={resetForm} disabled={isCreating} class="btn btn-secondary">
						Cancel
					</button>
				</div>
			</div>
		{/if}

		{#if stages.length === 0}
			<div class="empty-state">
				<p>No interview stages yet.</p>
				<p>Click "Add Interview Stage" to track your interview process.</p>
			</div>
		{:else}
			<div class="stages-timeline">
				<h2>Interview Timeline</h2>
				{#each stages as stage, index (stage.id)}
					<div class="stage-card">
						<div class="stage-header">
							<div class="stage-number">{index + 1}</div>
							<div class="stage-info">
								<h3>{getStageTypeDisplay(stage.stageType)}</h3>
								<p class="date">
									{formatDate(stage.scheduledDate)}
									{#if stage.scheduledDate}
										at {formatTime(stage.scheduledDate)}
									{/if}
								</p>
							</div>
							<div class="stage-status">
								<span class="badge {getOutcomeBadgeClass(stage.outcome)}">
									{stage.outcome.charAt(0).toUpperCase() + stage.outcome.slice(1)}
								</span>
							</div>
						</div>

						<div class="stage-details">
							{#if stage.interviewerName}
								<p><strong>Interviewer:</strong> {stage.interviewerName}</p>
							{/if}
							{#if stage.interviewerEmail}
								<p><strong>Email:</strong> <a href="mailto:{stage.interviewerEmail}">{stage.interviewerEmail}</a></p>
							{/if}
							{#if stage.location}
								<p><strong>Location:</strong> {stage.location}</p>
							{/if}
							{#if stage.notes}
								<p><strong>Notes:</strong> {stage.notes}</p>
							{/if}
							{#if stage.feedback}
								<p><strong>Feedback:</strong> {stage.feedback}</p>
							{/if}
							{#if stage.completedDate}
								<p><strong>Completed:</strong> {formatDate(stage.completedDate)}</p>
							{/if}
						</div>

						<div class="stage-actions">
							<a href="/job-applications/{jobApplication?.id}/interview-stages/{stage.id}/edit" class="btn btn-small btn-primary">
								Edit
							</a>
							<button
								on:click={() => handleDeleteStage(stage.id)}
								class="btn btn-small btn-danger"
							>
								Delete
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.interview-stages-container {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem;
	}

	.header {
		margin-bottom: 2rem;
	}

	.breadcrumb {
		font-size: 0.9rem;
		color: #666;
		margin-bottom: 1rem;
	}

	.breadcrumb a {
		color: #007bff;
		text-decoration: none;
	}

	.breadcrumb a:hover {
		text-decoration: underline;
	}

	h1 {
		font-size: 2rem;
		margin: 0 0 0.5rem 0;
		color: #333;
	}

	.subtitle {
		color: #666;
		font-size: 1.1rem;
		margin: 0;
	}

	.alert {
		padding: 1rem;
		border-radius: 4px;
		margin-bottom: 2rem;
	}

	.alert-error {
		background-color: #fee;
		border: 1px solid #fcc;
		color: #c33;
	}

	.loading,
	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: #666;
		font-size: 1.1rem;
	}

	.create-stage-btn {
		margin-bottom: 2rem;
	}

	.create-form {
		background: #f5f5f5;
		padding: 2rem;
		border-radius: 8px;
		margin-bottom: 2rem;
		border: 1px solid #ddd;
	}

	.create-form h2 {
		margin-top: 0;
		color: #333;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #333;
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 1rem;
		font-family: inherit;
	}

	.form-group input:disabled,
	.form-group select:disabled,
	.form-group textarea:disabled {
		background-color: #eee;
		cursor: not-allowed;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		margin-top: 2rem;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
		font-weight: 600;
		text-decoration: none;
		display: inline-block;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn:not(:disabled):hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.btn-primary {
		background-color: #007bff;
		color: white;
	}

	.btn-secondary {
		background-color: #6c757d;
		color: white;
	}

	.btn-danger {
		background-color: #dc3545;
		color: white;
	}

	.btn-small {
		padding: 0.5rem 1rem;
		font-size: 0.9rem;
	}

	.stages-timeline {
		margin-top: 3rem;
	}

	.stages-timeline h2 {
		color: #333;
		margin-bottom: 1.5rem;
	}

	.stage-card {
		background: white;
		border: 1px solid #ddd;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		transition: all 0.2s;
	}

	.stage-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.stage-header {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #eee;
	}

	.stage-number {
		width: 40px;
		height: 40px;
		background-color: #007bff;
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		font-size: 1.1rem;
		flex-shrink: 0;
	}

	.stage-info {
		flex-grow: 1;
	}

	.stage-info h3 {
		margin: 0 0 0.25rem 0;
		font-size: 1.25rem;
		color: #333;
	}

	.stage-info .date {
		margin: 0;
		color: #666;
		font-size: 0.9rem;
	}

	.stage-status {
		display: flex;
		align-items: center;
	}

	.badge {
		display: inline-block;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		font-size: 0.9rem;
		font-weight: 600;
	}

	.badge-success {
		background-color: #d4edda;
		color: #155724;
	}

	.badge-danger {
		background-color: #f8d7da;
		color: #721c24;
	}

	.badge-warning {
		background-color: #fff3cd;
		color: #856404;
	}

	.badge-info {
		background-color: #d1ecf1;
		color: #0c5460;
	}

	.stage-details {
		margin-bottom: 1rem;
		color: #555;
	}

	.stage-details p {
		margin: 0.5rem 0;
	}

	.stage-details a {
		color: #007bff;
		text-decoration: none;
	}

	.stage-details a:hover {
		text-decoration: underline;
	}

	.stage-actions {
		display: flex;
		gap: 0.5rem;
	}

	@media (max-width: 768px) {
		.interview-stages-container {
			padding: 1rem;
		}

		.stage-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.stage-status {
			width: 100%;
		}

		.stage-actions {
			flex-direction: column;
		}

		.btn-small {
			width: 100%;
		}
	}
</style>
