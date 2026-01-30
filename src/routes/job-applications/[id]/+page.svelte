<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { jobApplicationsApi, type JobApplication, type ApplicationStatus } from '$lib/api/job-applications';
	import { resumesApi, type Resume } from '$lib/api/resumes';
	import { goto } from '$app/navigation';
	import { config } from '$lib/config';

	let application: JobApplication | null = null;
	let loading = true;
	let error: string | null = null;
	let editing = false;
	let statusUpdate: ApplicationStatus | '' = '';
	let resumes: Resume[] = [];
	let selectedResumeId: string | null = null;
	let savingResume = false;
	let generatingCoverLetter = false;
	let coverLetterResult: string | null = null;

	const statusOptions: ApplicationStatus[] = [
		'pending',
		'processing',
		'applied',
		'contacted',
		'rejected',
		'accepted',
		'failed'
	];

	async function loadApplication() {
		loading = true;
		error = null;
		try {
			const id = $page.params.id;
		if (!id) {
			error = 'Application ID is required';
			loading = false;
			return;
		}
		application = await jobApplicationsApi.get(id);
			statusUpdate = application.status;
			selectedResumeId = application.resumeId || null;
		} catch (err: any) {
			error = err.response?.data?.message || err.message || 'Failed to load job application';
			console.error('Error loading application:', err);
		} finally {
			loading = false;
		}
	}

	async function loadResumes() {
		try {
			const response = await resumesApi.list({ limit: 100 });
			resumes = response.resumes;
		} catch (err) {
			console.error('Failed to load resumes:', err);
		}
	}

	async function updateResumeSelection() {
		if (!application || !selectedResumeId) return;

		savingResume = true;
		error = null;

		try {
			application = await jobApplicationsApi.update(application.id, {
				resumeId: selectedResumeId,
			});
		} catch (err: any) {
			error = err.response?.data?.message || err.message || 'Failed to update resume';
			console.error('Error updating resume:', err);
		} finally {
			savingResume = false;
		}
	}

	async function updateStatus() {
		if (!application || !statusUpdate || statusUpdate === application.status) return;

		try {
			application = await jobApplicationsApi.updateStatus(application.id, {
				status: statusUpdate as ApplicationStatus
			});
			editing = false;
		} catch (err: any) {
			error = err.response?.data?.message || err.message || 'Failed to update status';
			console.error('Error updating status:', err);
		}
	}

	async function deleteApplication() {
		if (!application || !confirm('Are you sure you want to delete this application?')) return;

		try {
			await jobApplicationsApi.delete(application.id);
			goto('/job-applications');
		} catch (err: any) {
			error = err.response?.data?.message || err.message || 'Failed to delete application';
			console.error('Error deleting application:', err);
		}
	}

	async function handleGenerateCoverLetter() {
		if (!application) return;
		
		generatingCoverLetter = true;
		error = null;
		
		try {
			const response = await fetch(`${config.jobsApiUrl}/job-applications/${application.id}/generate-cover-letter`, {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				}
			});
			
			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.data?.message || 'Failed to generate cover letter');
			}
			
			const result = await response.json();
			coverLetterResult = result.data?.cover_letter || result.data || 'Cover letter generated';
		} catch (err: any) {
			error = err.message || 'Failed to generate cover letter';
			console.error('Cover letter generation error:', err);
		} finally {
			generatingCoverLetter = false;
		}
	}

	function getStatusColor(status: ApplicationStatus): string {
		const colors: Record<ApplicationStatus, string> = {
			pending: 'bg-yellow-100 text-yellow-800',
			processing: 'bg-blue-100 text-blue-800',
			applied: 'bg-green-100 text-green-800',
			contacted: 'bg-purple-100 text-purple-800',
			rejected: 'bg-red-100 text-red-800',
			accepted: 'bg-emerald-100 text-emerald-800',
			failed: 'bg-gray-100 text-gray-800'
		};
		return colors[status] || 'bg-gray-100 text-gray-800';
	}

	function formatDate(dateString?: string | null): string {
		if (!dateString) return '-';
		try {
			return new Date(dateString).toLocaleDateString();
		} catch {
			return dateString;
		}
	}

	function formatDateTime(dateString?: string | null): string {
		if (!dateString) return '-';
		try {
			return new Date(dateString).toLocaleString();
		} catch {
			return dateString;
		}
	}

	onMount(async () => {
		// Ensure CSRF token header is set by backend middleware for subsequent state-changing requests
		try {
			await fetch(`${config.jobsApiUrl}/csrf-token`, {
				method: 'GET',
				credentials: 'include'
			});
		} catch (err) {
			console.debug('CSRF token fetch completed (may have errors, but token should be set)');
		}

		await loadApplication();
		await loadResumes();
	});
</script>

<div class="container mx-auto max-w-4xl px-4 py-8">
	<div class="mb-6">
		<button
			on:click={() => goto('/job-applications')}
			class="text-blue-600 hover:text-blue-700 mb-4"
		>
			← Back to Applications
		</button>
	</div>

	{#if error}
		<div class="mb-4 rounded-lg bg-red-50 p-4 text-red-800">{error}</div>
	{/if}

	{#if loading}
		<div class="text-center py-12">
			<div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
			<p class="mt-4 text-gray-600">Loading application...</p>
		</div>
	{:else if application}
		<div class="space-y-6">
			<!-- Header -->
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<div class="mb-4 flex items-start justify-between">
					<div class="flex-1">
						<div class="mb-2 flex items-center gap-3">
							<h1 class="text-3xl font-bold text-gray-900">{application.jobTitle}</h1>
							<span
								class="rounded-full px-3 py-1 text-sm font-medium {getStatusColor(application.status)}"
							>
								{application.status}
							</span>
						</div>
						<p class="text-2xl font-semibold text-gray-700">{application.companyName}</p>
						{#if application.location}
							<p class="text-lg text-gray-600">📍 {application.location}</p>
						{/if}
					</div>
				<div class="flex gap-2 flex-wrap">
					<button
						on:click={() => application && goto(`/resumes/generate?jobApplicationId=${application.id}`)}
						class="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md whitespace-nowrap"
						title="Generate AI-powered resume for this job"
					>
						✨ Generate Resume
					</button>
					<button
						on:click={handleGenerateCoverLetter}
						disabled={generatingCoverLetter}
						class="rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-2 text-sm font-semibold text-white hover:from-purple-700 hover:to-purple-800 transition-all shadow-sm hover:shadow-md whitespace-nowrap disabled:opacity-50"
						title="Generate AI-powered cover letter for this job"
					>
						{generatingCoverLetter ? '⏳ Generating...' : '📝 Generate Cover Letter'}
					</button>
					<button
						on:click={() => application && goto(`/job-applications/${application.id}/edit`)}
						class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
					>
						Edit
					</button>
					<button
						on:click={() => (editing = !editing)}
						class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
					>
						{editing ? 'Cancel' : 'Edit Status'}
					</button>
					<button
						on:click={deleteApplication}
						class="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 transition-colors"
					>
						Delete
					</button>
				</div>
				</div>

				{#if editing}
					<div class="mt-4 flex gap-2">
						<select
							bind:value={statusUpdate}
							class="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						>
							{#each statusOptions as status}
								<option value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
							{/each}
						</select>
						<button
							on:click={updateStatus}
							class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
						>
							Update
						</button>
					</div>
				{/if}
			</div>

			<!-- Job Details -->
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
					<h2 class="mb-4 text-xl font-semibold text-gray-900">Job Details</h2>
					<dl class="space-y-3">
						<div>
							<dt class="text-sm font-medium text-gray-500">Job URL</dt>
							<dd class="mt-1">
								<a
									href={application.jobUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="text-blue-600 hover:text-blue-700 underline break-all"
								>
									{application.jobUrl}
								</a>
							</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500">Website</dt>
							<dd class="mt-1 text-gray-900">{application.website}</dd>
						</div>
						{#if application.source}
							<div>
								<dt class="text-sm font-medium text-gray-500">Source</dt>
								<dd class="mt-1 text-gray-900">{application.source}</dd>
							</div>
						{/if}
						{#if application.applicationMethod}
							<div>
								<dt class="text-sm font-medium text-gray-500">Application Method</dt>
								<dd class="mt-1 text-gray-900">{application.applicationMethod}</dd>
							</div>
						{/if}
						{#if application.language}
							<div>
								<dt class="text-sm font-medium text-gray-500">Language</dt>
								<dd class="mt-1 text-gray-900">{application.language}</dd>
							</div>
						{/if}
						{#if application.deadline}
							<div>
								<dt class="text-sm font-medium text-gray-500">Deadline</dt>
								<dd class="mt-1 text-gray-900">{formatDate(application.deadline)}</dd>
							</div>
						{/if}
						{#if application.salaryMin || application.salaryMax}
							<div>
								<dt class="text-sm font-medium text-gray-500">Salary</dt>
								<dd class="mt-1 text-gray-900">
									{#if application.salaryMin && application.salaryMax}
										{application.salaryCurrency || 'USD'} {application.salaryMin.toLocaleString()} - {application.salaryMax.toLocaleString()}
									{:else if application.salaryMin}
										{application.salaryCurrency || 'USD'} {application.salaryMin.toLocaleString()}+
									{:else if application.salaryMax}
										Up to {application.salaryCurrency || 'USD'} {application.salaryMax.toLocaleString()}
									{/if}
								</dd>
							</div>
						{/if}
						<div>
							<dt class="text-sm font-medium text-gray-500">LinkedIn Contact</dt>
							<dd class="mt-1 text-gray-900">{application.linkedInContact ? 'Yes' : 'No'}</dd>
						</div>
					</dl>
				</div>

				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
					<h2 class="mb-4 text-xl font-semibold text-gray-900">Application Info</h2>
					<dl class="space-y-3">
						<div>
							<dt class="text-sm font-medium text-gray-500">Status</dt>
							<dd class="mt-1">
								<span
									class="inline-block rounded-full px-3 py-1 text-sm font-medium {getStatusColor(application.status)}"
								>
									{application.status}
								</span>
							</dd>
						</div>
						{#if application.appliedAt}
							<div>
								<dt class="text-sm font-medium text-gray-500">Applied At</dt>
								<dd class="mt-1 text-gray-900">{formatDate(application.appliedAt)}</dd>
							</div>
						{/if}
						<div>
							<dt class="text-sm font-medium text-gray-500">Created</dt>
							<dd class="mt-1 text-gray-900">{formatDate(application.createdAt)}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500">Last Updated</dt>
							<dd class="mt-1 text-gray-900">{formatDate(application.updatedAt)}</dd>
						</div>
						{#if application.interestLevel}
							<div>
								<dt class="text-sm font-medium text-gray-500">Interest Level</dt>
								<dd class="mt-1 text-gray-900 capitalize">{application.interestLevel.replace(/_/g, ' ')}</dd>
							</div>
						{/if}
						<div>
							<dt class="text-sm font-medium text-gray-500">Interview Count</dt>
							<dd class="mt-1 text-gray-900">{application.interviewCount}</dd>
						</div>
						{#if application.nextInterviewDate}
							<div>
								<dt class="text-sm font-medium text-gray-500">Next Interview Date</dt>
								<dd class="mt-1 text-gray-900">{formatDate(application.nextInterviewDate)}</dd>
							</div>
						{/if}
						{#if application.followUpDate}
							<div>
								<dt class="text-sm font-medium text-gray-500">Follow-up Date</dt>
								<dd class="mt-1 text-gray-900">{formatDate(application.followUpDate)}</dd>
							</div>
						{/if}
						{#if application.responseReceivedAt}
							<div>
								<dt class="text-sm font-medium text-gray-500">Response Received At</dt>
								<dd class="mt-1 text-gray-900">{formatDate(application.responseReceivedAt)}</dd>
							</div>
						{/if}
						{#if application.rejectionReason}
							<div>
								<dt class="text-sm font-medium text-gray-500">Rejection Reason</dt>
								<dd class="mt-1 text-gray-900">{application.rejectionReason}</dd>
							</div>
						{/if}
						{#if application.errorMessage}
							<div>
								<dt class="text-sm font-medium text-red-500">Error Message</dt>
								<dd class="mt-1 text-red-600">{application.errorMessage}</dd>
							</div>
						{/if}
					</dl>
				</div>
			</div>

			<!-- Resume Section -->
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-xl font-semibold text-gray-900">Resume</h2>
				{#if resumes.length === 0}
					<div class="text-gray-500 text-sm">
						<p>No resumes found.</p>
						<a href="/resumes" class="text-blue-600 hover:text-blue-700 underline">
							Create or upload a resume
						</a>
					</div>
				{:else}
					<div class="space-y-3">
						<div>
							<label for="resume-select" class="block text-sm font-medium text-gray-700 mb-2">
								Select Resume for this Job
							</label>
							<select
								id="resume-select"
								bind:value={selectedResumeId}
								disabled={savingResume}
								class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							>
								<option value={null}>-- No Resume Selected --</option>
								{#each resumes as resume}
									<option value={resume.id}>
										{resume.title}
										{#if resume.isMain}
											(Main)
										{/if}
									</option>
								{/each}
							</select>
						</div>

						{#if selectedResumeId && selectedResumeId !== application?.resumeId}
							<button
								on:click={updateResumeSelection}
								disabled={savingResume}
								class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
							>
								{savingResume ? 'Saving...' : 'Save Resume Selection'}
							</button>
						{/if}

						{#if application?.resumeId}
							<div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
								<p class="text-sm text-blue-900">
									<strong>Current Resume:</strong>
									{#each resumes as resume}
										{#if resume.id === application.resumeId}
											{resume.title}
										{/if}
									{/each}
								</p>
							</div>
						{/if}

						<div class="mt-4">
							<a href="/resumes" class="text-blue-600 hover:text-blue-700 text-sm underline">
								Manage resumes →
							</a>
						</div>
					</div>
				{/if}
			</div>

			<!-- Interview Stages -->
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-xl font-semibold text-gray-900">Interview Stages</h2>
					<a
						href={`/job-applications/${application?.id}/interview-stages`}
						class="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 transition-colors"
					>
						Manage Interviews
					</a>
				</div>
				<div class="text-gray-600">
					<p class="text-sm">
						You have <strong>{application?.interviewCount || 0}</strong> interview stage{(application?.interviewCount || 0) !== 1 ? 's' : ''}
						{#if application?.nextInterviewDate}
							. Next interview: <strong>{formatDate(application.nextInterviewDate)}</strong>
						{/if}
					</p>
					<p class="mt-2 text-sm">
						<a
							href={`/job-applications/${application?.id}/interview-stages`}
							class="text-blue-600 hover:text-blue-700 underline"
						>
							View and manage interview stages →
						</a>
					</p>
				</div>
			</div>
			{#if application.tags && application.tags.length > 0}
				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
					<h2 class="mb-4 text-xl font-semibold text-gray-900">Tags</h2>
					<div class="flex flex-wrap gap-2">
						{#each application.tags as tag}
							<span class="rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700">
								{tag}
							</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Notes -->
			{#if application.notes}
				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
					<h2 class="mb-4 text-xl font-semibold text-gray-900">Notes</h2>
					<p class="text-gray-700 whitespace-pre-wrap">{application.notes}</p>
				</div>
			{/if}

			<!-- Job Description -->
			{#if application.jobDescription}
				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
					<h2 class="mb-4 text-xl font-semibold text-gray-900">Job Description</h2>
					<div class="prose max-w-none text-gray-700">
						<p class="whitespace-pre-wrap">{application.jobDescription}</p>
					</div>
				</div>
			{/if}

			<!-- Cover Letter (Existing or Generated) -->
			{#if application.coverLetter}
				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
					<h2 class="mb-4 text-xl font-semibold text-gray-900">Cover Letter</h2>
					<div class="prose max-w-none text-gray-700">
						<p class="whitespace-pre-wrap">{application.coverLetter}</p>
					</div>
				</div>
			{/if}

			<!-- Generated Cover Letter Result -->
			{#if coverLetterResult}
				<div class="rounded-lg border border-green-200 bg-green-50 p-6 shadow-sm">
					<div class="flex items-start justify-between mb-4">
						<h2 class="text-xl font-semibold text-green-900">Generated Cover Letter</h2>
						<button
							on:click={() => (coverLetterResult = null)}
							class="text-green-600 hover:text-green-700"
							title="Close"
						>
							✕
						</button>
					</div>
					<div class="prose max-w-none text-gray-700 bg-white p-4 rounded border border-green-200">
						<p class="whitespace-pre-wrap">{coverLetterResult}</p>
					</div>
					<div class="mt-4 flex gap-2">
						<button
							on:click={() => {
								// Copy to clipboard
								navigator.clipboard.writeText(coverLetterResult || '');
								alert('Cover letter copied to clipboard');
							}}
							class="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 transition-colors"
						>
							📋 Copy to Clipboard
						</button>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

