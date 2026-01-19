<script lang="ts">
	import { onMount } from 'svelte';
	import { jobApplicationsApi, type JobApplication, type ApplicationStatus } from '$lib/api/job-applications';
	import { goto } from '$app/navigation';
	import ServiceHealthMonitor from '$lib/components/ServiceHealthMonitor.svelte';

	let applications: JobApplication[] = [];
	let loading = true;
	let error: string | null = null;
	let total = 0;
	let page = 1;
	let limit = 20;
	let statusFilter: ApplicationStatus | '' = '';
	let websiteFilter = '';

	const statusOptions: ApplicationStatus[] = [
		'pending',
		'processing',
		'applied',
		'contacted',
		'rejected',
		'accepted',
		'failed'
	];

	async function loadApplications() {
		loading = true;
		error = null;
		try {
			const response = await jobApplicationsApi.list({
				page,
				limit,
				status: statusFilter || undefined,
				website: websiteFilter || undefined
			});
			applications = response.applications;
			total = response.total;
		} catch (err: any) {
			error = err.response?.data?.message || err.message || 'Failed to load job applications';
			console.error('Error loading applications:', err);
		} finally {
			loading = false;
		}
	}

	function handleStatusChange(newStatus: ApplicationStatus | '') {
		statusFilter = newStatus;
		page = 1;
		loadApplications();
	}

	function handleWebsiteChange(newWebsite: string) {
		websiteFilter = newWebsite;
		page = 1;
		loadApplications();
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
		loadApplications();
	});
</script>

<ServiceHealthMonitor />

<div class="container mx-auto px-4 py-8">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Job Applications</h1>
			<nav class="mt-2 flex gap-4 text-sm">
				<a href="/resumes" class="text-blue-600 hover:text-blue-700">My Resumes</a>
			</nav>
		</div>
		<button
			onclick={() => goto('/job-applications/new')}
			class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
		>
			+ New Application
		</button>
	</div>

	<!-- Filters -->
	<div class="mb-6 flex gap-4">
		<div class="flex-1">
			<label for="status-filter" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
			<select
				id="status-filter"
				bind:value={statusFilter}
				onchange={() => handleStatusChange(statusFilter)}
				class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
			>
				<option value="">All Statuses</option>
				{#each statusOptions as status}
					<option value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
				{/each}
			</select>
		</div>
		<div class="flex-1">
			<label for="website-filter" class="block text-sm font-medium text-gray-700 mb-1">Website</label>
			<input
				id="website-filter"
				type="text"
				bind:value={websiteFilter}
				oninput={() => handleWebsiteChange(websiteFilter)}
				placeholder="Filter by website..."
				class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
			/>
		</div>
	</div>

	<!-- Error Message -->
	{#if error}
		<div class="mb-4 rounded-lg bg-red-50 p-4 text-red-800">{error}</div>
	{/if}

	<!-- Loading State -->
	{#if loading}
		<div class="text-center py-12">
			<div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
			<p class="mt-4 text-gray-600">Loading applications...</p>
		</div>
	{:else if applications.length === 0}
		<div class="rounded-lg border border-gray-200 bg-white p-12 text-center">
			<p class="text-gray-500">No job applications found.</p>
			<button
				onclick={() => goto('/job-applications/new')}
				class="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
			>
				Create Your First Application
			</button>
		</div>
	{:else}
		<!-- Applications List -->
		<div class="space-y-4">
			{#each applications as application (application.id)}
				<div
					class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
				>
					<div class="flex items-start justify-between gap-4">
						<div 
							role="button"
							tabindex="0"
							onclick={() => goto(`/job-applications/${application.id}`)}
							onkeydown={(e) => e.key === 'Enter' && goto(`/job-applications/${application.id}`)}
							class="flex-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
						>
							<div class="mb-2 flex items-center gap-3">
								<h2 class="text-xl font-semibold text-gray-900">{application.jobTitle}</h2>
								<span
									class="rounded-full px-3 py-1 text-xs font-medium {getStatusColor(application.status)}"
								>
									{application.status}
								</span>
							</div>
							<p class="text-lg font-medium text-gray-700">{application.companyName}</p>
							{#if application.location}
								<p class="text-sm text-gray-500">📍 {application.location}</p>
							{/if}
							<div class="mt-3 flex flex-wrap gap-2">
								<span class="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
									{application.website}
								</span>
								{#if application.interestLevel}
									<span class="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
										Interest: {application.interestLevel}
									</span>
								{/if}
								{#if application.tags && application.tags.length > 0}
									{#each application.tags as tag}
										<span class="rounded bg-purple-100 px-2 py-1 text-xs text-purple-700">
											{tag}
										</span>
									{/each}
								{/if}
							</div>
							<div class="mt-3 text-sm text-gray-500">
								<p>Applied: {formatDate(application.appliedAt)} • Created: {formatDate(application.createdAt)}</p>
							</div>
						</div>
						<div class="flex flex-col gap-2">
							<button
								onclick={(e) => {
									e.stopPropagation();
									goto(`/resumes/generate?jobApplicationId=${application.id}`);
								}}
								class="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md whitespace-nowrap"
								title="Generate AI-powered resume for this application"
							>
								✨ Generate Resume
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Pagination -->
		{#if total > limit}
			<div class="mt-6 flex items-center justify-between">
				<p class="text-sm text-gray-700">
					Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} applications
				</p>
				<div class="flex gap-2">
					<button
						onclick={() => {
							page = Math.max(1, page - 1);
							loadApplications();
						}}
						disabled={page === 1}
						class="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
					>
						Previous
					</button>
					<button
						onclick={() => {
							page = page + 1;
							loadApplications();
						}}
						disabled={page * limit >= total}
						class="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
					>
						Next
					</button>
				</div>
			</div>
		{/if}
	{/if}
</div>

