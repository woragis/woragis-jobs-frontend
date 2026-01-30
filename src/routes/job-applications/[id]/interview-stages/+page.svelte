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
				return 'bg-green-100 text-green-700';
			case 'failed':
				return 'bg-red-100 text-red-700';
			case 'cancelled':
				return 'bg-yellow-100 text-yellow-700';
			default:
				return 'bg-blue-100 text-blue-700';
		}
	}

	function getStageTypeDisplay(type: string): string {
		return type.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
	}
</script>

<div class="container mx-auto max-w-4xl px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<nav class="mb-4 flex items-center gap-2 text-sm text-gray-600">
			<a href="/job-applications" class="text-blue-600 hover:text-blue-700 transition-colors">
				Job Applications
			</a>
			<span>/</span>
			{#if jobApplication}
				<span class="text-gray-900">{jobApplication.companyName} - {jobApplication.jobTitle}</span>
			{/if}
		</nav>
		
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Interview Stages</h1>
				{#if jobApplication}
					<p class="mt-2 text-lg text-gray-600">{jobApplication.companyName} — {jobApplication.jobTitle}</p>
				{/if}
			</div>
			<button
				on:click={() => (showCreateForm = !showCreateForm)}
				class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors font-medium"
			>
				{showCreateForm ? '✕ Cancel' : '+ Add Stage'}
			</button>
		</div>
	</div>

	<!-- Error Message -->
	{#if error}
		<div class="mb-6 rounded-lg bg-red-50 p-4 text-red-800 border border-red-200">
			<p>{error}</p>
		</div>
	{/if}

	<!-- Loading State -->
	{#if isLoading}
		<div class="text-center py-12">
			<div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
			<p class="mt-4 text-gray-600">Loading interview stages...</p>
		</div>
	{:else}
		<!-- Create Form -->
		{#if showCreateForm}
			<div class="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h2 class="mb-6 text-xl font-semibold text-gray-900">New Interview Stage</h2>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 mb-6">
					<div>
						<label for="stage-type" class="block text-sm font-medium text-gray-700 mb-2">
							Stage Type <span class="text-red-500">*</span>
						</label>
						<p class="text-xs text-gray-500 mb-2">What type of interview is this?</p>
						<select 
							id="stage-type" 
							bind:value={selectedStageType} 
							disabled={isCreating}
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						>
							{#each stageTypeOptions as type}
								<option value={type}>{getStageTypeDisplay(type)}</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="scheduled-date" class="block text-sm font-medium text-gray-700 mb-2">
							Scheduled Date & Time
						</label>
						<p class="text-xs text-gray-500 mb-2">When is the interview scheduled?</p>
						<input
							id="scheduled-date"
							type="datetime-local"
							bind:value={scheduledDate}
							disabled={isCreating}
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label for="interviewer-name" class="block text-sm font-medium text-gray-700 mb-2">
							Interviewer Name
						</label>
						<p class="text-xs text-gray-500 mb-2">Name of the person conducting the interview</p>
						<input
							id="interviewer-name"
							type="text"
							placeholder="e.g., John Smith"
							bind:value={interviewerName}
							disabled={isCreating}
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label for="interviewer-email" class="block text-sm font-medium text-gray-700 mb-2">
							Interviewer Email
						</label>
						<p class="text-xs text-gray-500 mb-2">Email for follow-up communication</p>
						<input
							id="interviewer-email"
							type="email"
							placeholder="e.g., john@company.com"
							bind:value={interviewerEmail}
							disabled={isCreating}
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>
				</div>

				<div class="mb-6">
					<label for="location" class="block text-sm font-medium text-gray-700 mb-2">
						Location
					</label>
					<p class="text-xs text-gray-500 mb-2">Office location, address, or video call platform</p>
					<input
						id="location"
						type="text"
						placeholder="e.g., NYC Office, Video Call, or 123 Main St"
						bind:value={location}
						disabled={isCreating}
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					/>
				</div>

				<div class="mb-6">
					<label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
						Notes
					</label>
					<p class="text-xs text-gray-500 mb-2">Preparation tips, topics to review, or other reminders</p>
					<textarea
						id="notes"
						placeholder="Any additional notes about this stage..."
						bind:value={notes}
						disabled={isCreating}
						rows="3"
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					></textarea>
				</div>

				<div class="flex gap-3">
					<button 
						on:click={handleCreateStage} 
						disabled={isCreating} 
						class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isCreating ? '⏳ Creating...' : 'Create Stage'}
					</button>
					<button 
						on:click={resetForm} 
						disabled={isCreating} 
						class="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
					>
						Cancel
					</button>
				</div>
			</div>
		{/if}

		<!-- Stages List -->
		{#if stages.length === 0}
			<div class="rounded-lg border border-gray-200 bg-white p-12 text-center">
				<p class="text-lg text-gray-600">No interview stages recorded yet.</p>
				<p class="mt-2 text-gray-500">Click "Add Stage" to start tracking your interview process.</p>
			</div>
		{:else}
			<div class="space-y-4">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">Interview Timeline</h2>
				{#each stages as stage, index (stage.id)}
					<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
						<!-- Stage Header -->
						<div class="mb-4 pb-4 border-b border-gray-100">
							<div class="flex items-start justify-between gap-4">
								<div class="flex items-start gap-3 flex-1">
									<div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-semibold text-sm flex-shrink-0">
										{index + 1}
									</div>
									<div>
										<h3 class="text-lg font-semibold text-gray-900">{getStageTypeDisplay(stage.stageType)}</h3>
										<p class="mt-1 text-sm text-gray-600">
											{#if stage.scheduledDate}
												📅 {formatDate(stage.scheduledDate)} at {formatTime(stage.scheduledDate)}
											{:else}
												<span class="text-gray-500 italic">No date scheduled</span>
											{/if}
										</p>
									</div>
								</div>
								<div class="flex-shrink-0">
									<span class="inline-flex rounded-full px-3 py-1 text-sm font-medium {getOutcomeBadgeClass(stage.outcome)}">
										{stage.outcome.charAt(0).toUpperCase() + stage.outcome.slice(1)}
									</span>
								</div>
							</div>
						</div>

						<!-- Stage Details -->
						<div class="mb-4 space-y-2 text-sm">
							{#if stage.interviewerName}
								<p class="text-gray-700">
									<span class="font-medium">👤 Interviewer:</span> {stage.interviewerName}
									{#if stage.interviewerEmail}
										(<a href="mailto:{stage.interviewerEmail}" class="text-blue-600 hover:text-blue-700 underline">{stage.interviewerEmail}</a>)
									{/if}
								</p>
							{/if}
							{#if stage.location}
								<p class="text-gray-700"><span class="font-medium">📍 Location:</span> {stage.location}</p>
							{/if}
							{#if stage.notes}
								<p class="text-gray-700"><span class="font-medium">📝 Notes:</span> {stage.notes}</p>
							{/if}
							{#if stage.feedback}
								<p class="text-gray-700"><span class="font-medium">💬 Feedback:</span> {stage.feedback}</p>
							{/if}
							{#if stage.completedDate}
								<p class="text-gray-600 text-xs"><span class="font-medium">✓ Completed:</span> {formatDate(stage.completedDate)}</p>
							{/if}
						</div>

						<!-- Stage Actions -->
						<div class="flex gap-2 pt-2">
							<a 
								href="/job-applications/{jobApplication?.id}/interview-stages/{stage.id}/edit" 
								class="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium"
							>
								✏️ Edit
							</a>
							<button
								on:click={() => handleDeleteStage(stage.id)}
								class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100 transition-colors font-medium"
							>
								🗑️ Delete
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>
<style lang="postcss">
	/* Tailwind styles are applied via classes in the template */
</style>
