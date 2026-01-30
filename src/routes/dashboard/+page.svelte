<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { mlServiceApi, type Recommendation, type AnalyticsOverview } from '$lib/api/ml-service';
	import { currentUser } from '$lib/stores/auth';

	let loading = true;
	let error: string | null = null;
	let recommendations: Recommendation[] = [];
	let analytics: AnalyticsOverview | null = null;

	async function loadDashboardData() {
		loading = true;
		error = null;

		try {
			const userId = $currentUser?.id;
			if (!userId) {
				error = 'User not authenticated';
				loading = false;
				return;
			}

			// Load recommendations and analytics in parallel
			const [recsResponse, analyticsData] = await Promise.all([
				mlServiceApi.getRecommendations(userId, { limit: 10 }),
				mlServiceApi.getAnalyticsOverview(userId).catch(() => null), // Analytics is optional
			]);

			recommendations = recsResponse.recommendations || [];
			analytics = analyticsData;
		} catch (err: any) {
			error = err.response?.data?.message || err.message || 'Failed to load dashboard data';
			console.error('Error loading dashboard:', err);
		} finally {
			loading = false;
		}
	}

	function getTierColor(tier: string): string {
		const colors: Record<string, string> = {
			S: 'bg-purple-100 text-purple-800 border-purple-300',
			A: 'bg-blue-100 text-blue-800 border-blue-300',
			B: 'bg-green-100 text-green-800 border-green-300',
			C: 'bg-yellow-100 text-yellow-800 border-yellow-300',
		};
		return colors[tier] || 'bg-gray-100 text-gray-800 border-gray-300';
	}

	function getScoreColor(score: number): string {
		if (score >= 80) return 'text-green-600';
		if (score >= 60) return 'text-blue-600';
		if (score >= 40) return 'text-yellow-600';
		return 'text-gray-600';
	}

	function formatNumber(num?: number): string {
		if (num === undefined || num === null) return '-';
		return num.toFixed(1);
	}

	function formatPercentage(num?: number): string {
		if (num === undefined || num === null) return '-';
		return `${(num * 100).toFixed(1)}%`;
	}

	onMount(() => {
		loadDashboardData();
	});
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
		<button
			on:click={loadDashboardData}
			class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
		>
			Refresh
		</button>
	</div>

	<!-- Error Message -->
	{#if error}
		<div class="mb-4 rounded-lg bg-red-50 p-4 text-red-800">{error}</div>
	{/if}

	<!-- Loading State -->
	{#if loading}
		<div class="text-center py-12">
			<div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
			<p class="mt-4 text-gray-600">Loading dashboard...</p>
		</div>
	{:else}
		<!-- Metrics Cards -->
		{#if analytics}
			<div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				<!-- Total Applications -->
				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-600">Total Applications</p>
							<p class="mt-2 text-3xl font-bold text-gray-900">
								{analytics.total_applications}
							</p>
						</div>
						<div class="rounded-full bg-blue-100 p-3">
							<svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
						</div>
					</div>
				</div>

				<!-- Success Rate -->
				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-600">Success Rate</p>
							<p class="mt-2 text-3xl font-bold text-green-600">
								{formatPercentage(analytics.success_rate)}
							</p>
						</div>
						<div class="rounded-full bg-green-100 p-3">
							<svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
					</div>
					<p class="mt-2 text-xs text-gray-500">
						{Math.round(analytics.total_applications * analytics.success_rate)} accepted / {analytics.total_applications} total
					</p>
				</div>

				<!-- Average Response Time -->
				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-600">Avg Response Time</p>
							<p class="mt-2 text-3xl font-bold text-blue-600">
								{analytics.avg_response_time > 0
									? `${formatNumber(analytics.avg_response_time)} days`
									: '-'}
							</p>
						</div>
						<div class="rounded-full bg-blue-100 p-3">
							<svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
					</div>
					{#if analytics.avg_response_time > 0}
						<p class="mt-2 text-xs text-gray-500">Average time to response</p>
					{/if}
				</div>

				<!-- Salary Range -->
				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-600">Avg Salary Range</p>
							<p class="mt-2 text-lg font-bold text-purple-600">
								{#if analytics.avg_salary_range?.min && analytics.avg_salary_range?.max}
									${(analytics.avg_salary_range.min / 1000).toFixed(0)}k - ${(analytics.avg_salary_range.max / 1000).toFixed(0)}k
								{:else}
									-
								{/if}
							</p>
						</div>
						<div class="rounded-full bg-purple-100 p-3">
							<svg class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
					</div>
				</div>
			</div>

			<!-- Insights -->
			{#if analytics.insights && analytics.insights.length > 0}
				<div class="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
					<h3 class="mb-2 text-sm font-semibold text-blue-900">Insights</h3>
					<ul class="list-disc space-y-1 pl-5 text-sm text-blue-800">
						{#each analytics.insights as insight}
							<li>{insight}</li>
						{/each}
					</ul>
				</div>
			{/if}
		{/if}

		<!-- Top Recommendations Section -->
		<div class="mb-8">
			<h2 class="mb-4 text-2xl font-semibold text-gray-900">Top Recommendations</h2>
			{#if recommendations.length === 0}
				<div class="rounded-lg border border-gray-200 bg-white p-12 text-center">
					<p class="text-gray-500">No recommendations available yet.</p>
					<p class="mt-2 text-sm text-gray-400">
						Create more job applications to get personalized recommendations.
					</p>
					<button
						on:click={() => goto('/job-applications/new')}
						class="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
					>
						Create Application
					</button>
				</div>
			{:else}
				<div class="space-y-4">
					{#each recommendations as rec (rec.application_id)}
						<div
							role="button"
							tabindex="0"
							on:click={() => goto(`/job-applications/${rec.application_id}`)}
							on:keydown={(e) => e.key === 'Enter' && goto(`/job-applications/${rec.application_id}`)}
							class="cursor-pointer rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<div class="mb-2 flex items-center gap-3">
										<h3 class="text-xl font-semibold text-gray-900">{rec.job_title}</h3>
										<span
											class="rounded-full border px-3 py-1 text-xs font-medium {getTierColor(rec.tier)}"
										>
											Tier {rec.tier}
										</span>
										<span class="text-lg font-bold {getScoreColor(rec.score)}">
											{rec.score.toFixed(0)}%
										</span>
									</div>
									<p class="text-lg font-medium text-gray-700">{rec.company_name}</p>
									{#if rec.location}
										<p class="text-sm text-gray-500">📍 {rec.location}</p>
									{/if}
									<p class="mt-3 text-sm text-gray-600">{rec.explanation}</p>

									<!-- Company Metrics -->
									{#if rec.company_metrics}
										<div class="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
											{#if rec.company_metrics.response_rate !== undefined}
												<span>
													Response Rate: <strong>{formatPercentage(rec.company_metrics.response_rate)}</strong>
												</span>
											{/if}
											{#if rec.company_metrics.average_response_time_days !== undefined}
												<span>
													Avg Response: <strong>{formatNumber(rec.company_metrics.average_response_time_days)} days</strong>
												</span>
											{/if}
											{#if rec.company_metrics.success_rate !== undefined}
												<span>
													Success Rate: <strong>{formatPercentage(rec.company_metrics.success_rate)}</strong>
												</span>
											{/if}
										</div>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Top Companies Section -->
		{#if analytics?.top_companies && analytics.top_companies.length > 0}
			<div class="mb-8">
				<h2 class="mb-4 text-2xl font-semibold text-gray-900">Top Companies</h2>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each analytics.top_companies as company}
						<div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
							<h3 class="font-semibold text-gray-900">{company.company_name || 'Unknown Company'}</h3>
							{#if company.location}
								<p class="text-sm text-gray-500">📍 {company.location}</p>
							{/if}
							<div class="mt-3 space-y-1 text-sm">
								{#if company.response_rate !== undefined}
									<div class="flex justify-between">
										<span class="text-gray-600">Response Rate:</span>
										<span class="font-medium">{formatPercentage(company.response_rate)}</span>
									</div>
								{/if}
								{#if company.average_response_time_days !== undefined}
									<div class="flex justify-between">
										<span class="text-gray-600">Avg Response:</span>
										<span class="font-medium">{formatNumber(company.average_response_time_days)} days</span>
									</div>
								{:else if company.avg_response_time_days !== undefined}
									<div class="flex justify-between">
										<span class="text-gray-600">Avg Response:</span>
										<span class="font-medium">{formatNumber(company.avg_response_time_days)} days</span>
									</div>
								{/if}
								{#if company.success_rate !== undefined}
									<div class="flex justify-between">
										<span class="text-gray-600">Success Rate:</span>
										<span class="font-medium">{formatPercentage(company.success_rate)}</span>
									</div>
								{/if}
								<div class="flex justify-between">
									<span class="text-gray-600">Applications:</span>
									<span class="font-medium">{company.total_applications}</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>

