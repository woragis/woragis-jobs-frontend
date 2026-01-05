<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { jobApplicationsApi, type JobApplication, type ApplicationStatus } from '$lib/api/job-applications';
	import { goto } from '$app/navigation';

	let application: JobApplication | null = null;
	let loading = true;
	let error: string | null = null;
	let editing = false;
	let statusUpdate: ApplicationStatus | '' = '';

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
		} catch (err: any) {
			error = err.response?.data?.message || err.message || 'Failed to load job application';
			console.error('Error loading application:', err);
		} finally {
			loading = false;
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
		return new Date(dateString).toLocaleDateString();
	}

	onMount(() => {
		loadApplication();
	});
</script>

<div class="container mx-auto max-w-4xl px-4 py-8">
	<div class="mb-6">
		<button
			onclick={() => goto('/job-applications')}
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
					<div class="flex gap-2">
						<button
							onclick={() => (editing = !editing)}
							class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
						>
							{editing ? 'Cancel' : 'Edit Status'}
						</button>
						<button
							onclick={deleteApplication}
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
							onclick={updateStatus}
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
									class="text-blue-600 hover:text-blue-700 underline"
								>
									{application.jobUrl}
								</a>
							</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500">Website</dt>
							<dd class="mt-1 text-gray-900">{application.website}</dd>
						</div>
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
						<div>
							<dt class="text-sm font-medium text-gray-500">Applied At</dt>
							<dd class="mt-1 text-gray-900">{formatDate(application.appliedAt)}</dd>
						</div>
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
								<dd class="mt-1 text-gray-900 capitalize">{application.interestLevel}</dd>
							</div>
						{/if}
						{#if application.interviewCount > 0}
							<div>
								<dt class="text-sm font-medium text-gray-500">Interviews</dt>
								<dd class="mt-1 text-gray-900">{application.interviewCount}</dd>
							</div>
						{/if}
					</dl>
				</div>
			</div>

			<!-- Tags -->
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

			<!-- Cover Letter -->
			{#if application.coverLetter}
				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
					<h2 class="mb-4 text-xl font-semibold text-gray-900">Cover Letter</h2>
					<div class="prose max-w-none text-gray-700">
						<p class="whitespace-pre-wrap">{application.coverLetter}</p>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

