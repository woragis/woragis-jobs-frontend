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
	let appliedDateFrom = '';
	let appliedDateTo = '';
	let interestLevelFilter: string | '' = '';
	let tagsSearch = '';
	let allTags: string[] = [];
	let showFiltersPanel = false;

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
				website: websiteFilter || undefined,
				appliedDateFrom: appliedDateFrom || undefined,
				appliedDateTo: appliedDateTo || undefined,
				interestLevel: interestLevelFilter || undefined,
				tags: tagsSearch ? tagsSearch.split(',').map(t => t.trim()) : undefined
			});
			applications = response.applications;
			total = response.total;
			
			// Extract all unique tags from applications
			const tagSet = new Set<string>();
			applications.forEach(app => {
				app.tags?.forEach(tag => tagSet.add(tag));
			});
			allTags = Array.from(tagSet).sort();
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

	function handleDateFromChange(date: string) {
		appliedDateFrom = date;
		page = 1;
		loadApplications();
	}

	function handleDateToChange(date: string) {
		appliedDateTo = date;
		page = 1;
		loadApplications();
	}

	function handleInterestLevelChange(level: string | '') {
		interestLevelFilter = level;
		page = 1;
		loadApplications();
	}

	function handleTagsChange(tags: string) {
		tagsSearch = tags;
		page = 1;
		loadApplications();
	}

	function clearAllFilters() {
		statusFilter = '';
		websiteFilter = '';
		appliedDateFrom = '';
		appliedDateTo = '';
		interestLevelFilter = '';
		tagsSearch = '';
		page = 1;
		loadApplications();
	}

	function hasActiveFilters(): boolean {
		return !!(statusFilter || websiteFilter || appliedDateFrom || appliedDateTo || interestLevelFilter || tagsSearch);
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
			on:click={() => goto('/job-applications/new')}
			class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
		>
			+ New Application
		</button>
	</div>

	<!-- Filter Controls -->
	<div class="mb-6 flex gap-3">
		<button
			on:click={() => (showFiltersPanel = !showFiltersPanel)}
			class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
		>
			🔍 {showFiltersPanel ? 'Hide' : 'Show'} Advanced Filters
		</button>
		{#if hasActiveFilters()}
			<button
				on:click={clearAllFilters}
				class="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
			>
				✕ Clear All Filters
			</button>
		{/if}
	</div>

	<!-- Basic Filters (Always Visible) -->
	<div class="mb-6 flex gap-4">
		<div class="flex-1">
			<label for="status-filter" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
			<select
				id="status-filter"
				bind:value={statusFilter}
				on:change={() => handleStatusChange(statusFilter)}
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
				on:input={() => handleWebsiteChange(websiteFilter)}
				placeholder="Filter by website..."
				class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
			/>
		</div>
	</div>

	<!-- Advanced Filters Panel -->
	{#if showFiltersPanel}
		<div class="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<!-- Date Range -->
				<div>
					<label for="date-from" class="block text-sm font-medium text-gray-700 mb-1">Applied Date From</label>
					<input
						id="date-from"
						type="date"
						bind:value={appliedDateFrom}
						on:change={() => handleDateFromChange(appliedDateFrom)}
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					/>
					<p class="text-xs text-gray-500 mt-1">📅 Start date for applications</p>
				</div>

				<div>
					<label for="date-to" class="block text-sm font-medium text-gray-700 mb-1">Applied Date To</label>
					<input
						id="date-to"
						type="date"
						bind:value={appliedDateTo}
						on:change={() => handleDateToChange(appliedDateTo)}
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					/>
					<p class="text-xs text-gray-500 mt-1">📅 End date for applications</p>
				</div>

				<!-- Interest Level -->
				<div>
					<label for="interest-filter" class="block text-sm font-medium text-gray-700 mb-1">Interest Level</label>
					<select
						id="interest-filter"
						bind:value={interestLevelFilter}
						on:change={() => handleInterestLevelChange(interestLevelFilter)}
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					>
						<option value="">All Levels</option>
						<option value="very_high">⭐⭐⭐ Very High</option>
						<option value="high">⭐⭐ High</option>
						<option value="medium">⭐ Medium</option>
						<option value="low">Low</option>
					</select>
					<p class="text-xs text-gray-500 mt-1">💡 Filter by interest level</p>
				</div>
			</div>

			<!-- Tags Search -->
			<div>
				<label for="tags-search" class="block text-sm font-medium text-gray-700 mb-1">Search by Tags</label>
				<input
					id="tags-search"
					type="text"
					bind:value={tagsSearch}
					on:input={() => handleTagsChange(tagsSearch)}
					placeholder="Enter tags separated by commas (e.g., 'remote, startup')"
					class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				/>
				<p class="text-xs text-gray-500 mt-1">🏷️ Search by multiple tags (comma-separated)</p>
				{#if allTags.length > 0}
					<div class="mt-2 flex flex-wrap gap-2">
						{#each allTags.slice(0, 8) as tag}
							<button
								on:click={() => (tagsSearch = tag)}
								class="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700 hover:bg-blue-200"
							>
								{tag}
							</button>
						{/each}
						{#if allTags.length > 8}
							<span class="inline-block text-xs text-gray-500">+{allTags.length - 8} more</span>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{/if}

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
				on:click={() => goto('/job-applications/new')}
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
							on:click={() => goto(`/job-applications/${application.id}`)}
							on:keydown={(e) => e.key === 'Enter' && goto(`/job-applications/${application.id}`)}
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
								{#if application.language}
									<span class="rounded bg-green-100 px-2 py-1 text-xs text-green-700">
										🌐 {application.language}
									</span>
								{/if}
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
								on:click={(e) => {
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
							on:click={() => {
								page = Math.max(1, page - 1);
								loadApplications();
							}}
							disabled={page === 1}
							class="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
							>
								Previous
							</button>
							<button
							on:click={() => {
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

