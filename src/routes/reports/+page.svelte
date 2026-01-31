<script lang="ts">
	import { onMount } from 'svelte';
	import { jobApplicationsApi, type JobApplication, type ApplicationStatus } from '$lib/api/job-applications';
	import ServiceHealthMonitor from '$lib/components/ServiceHealthMonitor.svelte';

	let applications: JobApplication[] = [];
	let loading = true;
	let error: string | null = null;
	let successMessage: string | null = null;
	let exportFormat: 'csv' | 'json' = 'csv';
	let reportType: 'summary' | 'detailed' | 'timeline' = 'summary';
	let isExporting = false;
	let statusStats: Record<ApplicationStatus, number> | null = null;

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
			const response = await jobApplicationsApi.list({ limit: 1000 });
			applications = response.applications;
			statusStats = getStatusStats();
		} catch (err: any) {
			error = err.response?.data?.message || err.message || 'Failed to load applications';
			console.error('Error loading applications:', err);
		} finally {
			loading = false;
		}
	}

	function getStatusStats() {
		const stats: Record<ApplicationStatus, number> = {
			pending: 0,
			processing: 0,
			applied: 0,
			contacted: 0,
			rejected: 0,
			accepted: 0,
			failed: 0
		};

		applications.forEach(app => {
			stats[app.status]++;
		});

		return stats;
	}

	function getInterestStats() {
		const stats: Record<string, number> = {};
		applications.forEach(app => {
			const level = app.interestLevel || 'not-set';
			stats[level] = (stats[level] || 0) + 1;
		});
		return stats;
	}

	function getWebsiteStats() {
		const stats: Record<string, number> = {};
		applications.forEach(app => {
			stats[app.website] = (stats[app.website] || 0) + 1;
		});
		return Object.entries(stats)
			.map(([website, count]) => ({ website, count }))
			.sort((a, b) => b.count - a.count);
	}

	function formatCSV(data: any[]): string {
		if (data.length === 0) return '';

		const headers = Object.keys(data[0]);
		const rows = data.map(obj =>
			headers.map(header => {
				const value = obj[header];
				if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
					return `"${value.replace(/"/g, '""')}"`;
				}
				return value;
			}).join(',')
		);

		return [headers.join(','), ...rows].join('\n');
	}

	function downloadFile(content: string, filename: string, mimeType: string) {
		const blob = new Blob([content], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	function exportSummaryReport() {
		if (exportFormat === 'csv') {
			const stats = getStatusStats();
			const websiteStats = getWebsiteStats();
			const interestStats = getInterestStats();

			let csvContent = 'Job Search Summary Report\n';
			csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

			csvContent += 'Status Breakdown\n';
			csvContent += 'Status,Count\n';
			Object.entries(stats).forEach(([status, count]) => {
				csvContent += `${status},${count}\n`;
			});

			csvContent += '\nTop Websites\n';
			csvContent += 'Website,Count\n';
			websiteStats.slice(0, 10).forEach(({ website, count }) => {
				csvContent += `${website},${count}\n`;
			});

			csvContent += '\nInterest Level Breakdown\n';
			csvContent += 'Interest Level,Count\n';
			Object.entries(interestStats).forEach(([level, count]) => {
				csvContent += `${level},${count}\n`;
			});

			downloadFile(csvContent, `job-search-summary-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
		} else {
			const stats = getStatusStats();
			const websiteStats = getWebsiteStats();
			const interestStats = getInterestStats();

			const report = {
				generated: new Date().toISOString(),
				totalApplications: applications.length,
				statusBreakdown: stats,
				topWebsites: websiteStats.slice(0, 10),
				interestLevelBreakdown: interestStats
			};

			downloadFile(JSON.stringify(report, null, 2), `job-search-summary-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
		}

		successMessage = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report exported as ${exportFormat.toUpperCase()}`;
		setTimeout(() => (successMessage = null), 3000);
	}

	function exportDetailedReport() {
		const exportData = applications.map(app => ({
			'Job Title': app.jobTitle,
			'Company': app.companyName,
			'Website': app.website,
			'Location': app.location || '-',
			'Status': app.status,
			'Interest Level': app.interestLevel || '-',
			'Applied Date': app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '-',
			'Language': app.language || '-',
			'Tags': (app.tags || []).join('; '),
			'Interview Count': app.interviewCount || 0,
			'Salary Range': app.salaryMin && app.salaryMax ? `${app.salaryMin}-${app.salaryMax}` : '-',
			'Created Date': new Date(app.createdAt).toLocaleDateString(),
			'Notes': app.notes || '-'
		}));

		if (exportFormat === 'csv') {
			const csvContent = formatCSV(exportData);
			downloadFile(csvContent, `job-applications-detailed-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
		} else {
			downloadFile(JSON.stringify(exportData, null, 2), `job-applications-detailed-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
		}

		successMessage = 'Detailed report exported successfully';
		setTimeout(() => (successMessage = null), 3000);
	}

	function exportTimelineReport() {
		// Sort applications by applied date
		const timeline = [...applications]
			.filter(app => app.appliedAt)
			.sort((a, b) => new Date(b.appliedAt!).getTime() - new Date(a.appliedAt!).getTime())
			.map(app => ({
				'Date': app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '-',
				'Job Title': app.jobTitle,
				'Company': app.companyName,
				'Status': app.status,
				'Next Interview': app.nextInterviewDate ? new Date(app.nextInterviewDate).toLocaleDateString() : '-',
				'Days Active': app.appliedAt ? Math.floor((new Date().getTime() - new Date(app.appliedAt).getTime()) / (1000 * 60 * 60 * 24)) : '-'
			}));

		if (exportFormat === 'csv') {
			const csvContent = formatCSV(timeline);
			downloadFile(csvContent, `job-applications-timeline-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
		} else {
			downloadFile(JSON.stringify(timeline, null, 2), `job-applications-timeline-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
		}

		successMessage = 'Timeline report exported successfully';
		setTimeout(() => (successMessage = null), 3000);
	}

	function handleExport() {
		isExporting = true;
		setTimeout(() => {
			if (reportType === 'summary') {
				exportSummaryReport();
			} else if (reportType === 'detailed') {
				exportDetailedReport();
			} else {
				exportTimelineReport();
			}
			isExporting = false;
		}, 500);
	}

	onMount(() => {
		loadApplications();
	});
</script>

<ServiceHealthMonitor />

<div class="container mx-auto px-4 py-8">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-900">Reports & Export</h1>
		<p class="mt-2 text-gray-600">Generate reports and export your job search data</p>
	</div>

	<!-- Success Message -->
	{#if successMessage}
		<div class="mb-4 rounded-lg bg-green-50 p-4 text-green-800 border border-green-200">
			✓ {successMessage}
		</div>
	{/if}

	<!-- Error Message -->
	{#if error}
		<div class="mb-4 rounded-lg bg-red-50 p-4 text-red-800 border border-red-200">
			✗ {error}
		</div>
	{/if}

	{#if loading}
		<div class="text-center py-12">
			<div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
			<p class="mt-4 text-gray-600">Loading applications...</p>
		</div>
	{:else}
		<!-- Statistics Section -->
		<div class="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
			<div class="rounded-lg border border-gray-200 bg-white p-4">
				<p class="text-sm text-gray-500">Total Applications</p>
				<p class="text-3xl font-bold text-gray-900">{applications.length}</p>
			</div>

			{#if statusStats}
				<div class="rounded-lg border border-green-200 bg-green-50 p-4">
					<p class="text-sm text-gray-500">✓ Accepted</p>
					<p class="text-3xl font-bold text-green-600">{statusStats.accepted}</p>
				</div>

				<div class="rounded-lg border border-purple-200 bg-purple-50 p-4">
					<p class="text-sm text-gray-500">💬 Contacted</p>
					<p class="text-3xl font-bold text-purple-600">{statusStats.contacted}</p>
				</div>

				<div class="rounded-lg border border-red-200 bg-red-50 p-4">
					<p class="text-sm text-gray-500">✗ Rejected</p>
					<p class="text-3xl font-bold text-red-600">{statusStats.rejected}</p>
				</div>
			{/if}
		</div>

		<!-- Export Options -->
		<div class="rounded-lg border border-gray-200 bg-white p-6">
			<h2 class="text-xl font-semibold text-gray-900 mb-4">Export Your Data</h2>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
				<!-- Report Type Selection -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-3">Report Type</label>
					<div class="space-y-2">
						<label class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer" class:ring-2={reportType === 'summary'} class:ring-blue-500={reportType === 'summary'}>
							<input
								type="radio"
								value="summary"
								bind:group={reportType}
								class="w-4 h-4"
							/>
							<div>
								<p class="font-medium text-gray-900">Summary Report</p>
								<p class="text-xs text-gray-500">Status breakdown, top websites, interest levels</p>
							</div>
						</label>

						<label class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer" class:ring-2={reportType === 'detailed'} class:ring-blue-500={reportType === 'detailed'}>
							<input
								type="radio"
								value="detailed"
								bind:group={reportType}
								class="w-4 h-4"
							/>
							<div>
								<p class="font-medium text-gray-900">Detailed Report</p>
								<p class="text-xs text-gray-500">All applications with full details</p>
							</div>
						</label>

						<label class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer" class:ring-2={reportType === 'timeline'} class:ring-blue-500={reportType === 'timeline'}>
							<input
								type="radio"
								value="timeline"
								bind:group={reportType}
								class="w-4 h-4"
							/>
							<div>
								<p class="font-medium text-gray-900">Timeline Report</p>
								<p class="text-xs text-gray-500">Applications sorted by date with progress</p>
							</div>
						</label>
					</div>
				</div>

				<!-- Export Format Selection -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
					<div class="space-y-2">
						<label class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer" class:ring-2={exportFormat === 'csv'} class:ring-blue-500={exportFormat === 'csv'}>
							<input
								type="radio"
								value="csv"
								bind:group={exportFormat}
								class="w-4 h-4"
							/>
							<div>
								<p class="font-medium text-gray-900">CSV (Excel/Sheets)</p>
								<p class="text-xs text-gray-500">Spreadsheet format for analysis</p>
							</div>
						</label>

						<label class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer" class:ring-2={exportFormat === 'json'} class:ring-blue-500={exportFormat === 'json'}>
							<input
								type="radio"
								value="json"
								bind:group={exportFormat}
								class="w-4 h-4"
							/>
							<div>
								<p class="font-medium text-gray-900">JSON (Data Export)</p>
								<p class="text-xs text-gray-500">Structured data format for integration</p>
							</div>
						</label>
					</div>
				</div>
			</div>

			<button
				on:click={handleExport}
				disabled={isExporting}
				class="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-center font-semibold text-white hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 transition-all shadow-sm hover:shadow-md"
			>
				{isExporting ? '⏳ Preparing Export...' : '📥 Download Report'}
			</button>
		</div>

		<!-- Statistics Details -->
		{#if reportType === 'summary'}
			<div class="mt-8">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">Status Breakdown</h2>
				<div class="rounded-lg border border-gray-200 bg-white overflow-hidden">
					<div class="space-y-0">
					{#if statusStats}
						{#each Object.entries(statusStats) as [status, count]}
							<div class="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50" class:border-0={status === Object.keys(statusStats)[Object.keys(statusStats).length - 1]}>
								<span class="font-medium text-gray-700 capitalize">{status}</span>
								<div class="flex items-center gap-3">
									<div class="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
										<div
											class="h-full bg-blue-600"
											style="width: {(count / applications.length) * 100}%"
										></div>
									</div>
									<span class="text-sm font-semibold text-gray-900 w-12 text-right">{count}</span>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>

			<!-- Top Websites -->
			<h2 class="text-xl font-semibold text-gray-900 mb-4 mt-8">Top Job Websites</h2>
			<div class="rounded-lg border border-gray-200 bg-white overflow-hidden">
				<div class="space-y-0">
					{#each getWebsiteStats().slice(0, 10) as { website, count }}
						<div class="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50">
							<span class="font-medium text-gray-700">{website}</span>
							<span class="text-sm font-semibold text-gray-900">{count} application{count !== 1 ? 's' : ''}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
{/if}
</div>
