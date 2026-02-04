<script lang="ts">
	import { onMount } from 'svelte';
	import { historicalProgressStore, objectivesStore } from '$lib/stores/objectives';
	import type { DailyProgress, HistoryPreset } from '$lib/api/daily-objectives';

	let selectedPreset: HistoryPreset = '7days';
	let fromDate = '';
	let toDate = '';
	let useCustomRange = false;

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		if (useCustomRange && fromDate && toDate) {
			await objectivesStore.loadHistoricalProgress(undefined, fromDate, toDate);
		} else {
			await objectivesStore.loadHistoricalProgress(selectedPreset);
		}
	}

	function handlePresetChange() {
		useCustomRange = false;
		loadData();
	}

	function handleCustomRangeChange() {
		if (useCustomRange && fromDate && toDate) {
			loadData();
		}
	}

	function getChartData(data: DailyProgress[], metric: 'total' | 'junior' | 'pleno' | 'senior') {
		return data.map((day) => {
			let count = 0;
			let target = 0;

			switch (metric) {
				case 'total':
					count = day.totalCount;
					target = day.totalTarget;
					break;
				case 'junior':
					count = day.juniorCount;
					target = day.juniorTarget;
					break;
				case 'pleno':
					count = day.plenoCount;
					target = day.plenoTarget;
					break;
				case 'senior':
					count = day.seniorCount;
					target = day.seniorTarget;
					break;
			}

			return { date: day.date, count, target };
		});
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function getMetricLabel(metric: string): string {
		const labels: Record<string, string> = {
			total: 'Total',
			junior: 'Junior',
			pleno: 'Pleno/Mid',
			senior: 'Senior'
		};
		return labels[metric] || metric;
	}

	function getMetricColor(metric: string): string {
		const colors: Record<string, string> = {
			total: '#3b82f6', // blue
			junior: '#10b981', // green
			pleno: '#f59e0b', // amber
			senior: '#ef4444' // red
		};
		return colors[metric] || '#3b82f6';
	}
</script>

<div class="bg-white rounded-lg shadow p-6">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Progress History</h3>

	<!-- Controls -->
	<div class="mb-6 space-y-4">
		<!-- Preset Selection -->
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-2">View</label>
			<div class="flex gap-2">
				<button
					on:click={() => {
						selectedPreset = '7days';
						handlePresetChange();
					}}
					class={`px-3 py-2 rounded text-sm font-medium transition-colors ${
						!useCustomRange && selectedPreset === '7days'
							? 'bg-blue-600 text-white'
							: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
					}`}
				>
					Last 7 Days
				</button>
				<button
					on:click={() => {
						selectedPreset = '30days';
						handlePresetChange();
					}}
					class={`px-3 py-2 rounded text-sm font-medium transition-colors ${
						!useCustomRange && selectedPreset === '30days'
							? 'bg-blue-600 text-white'
							: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
					}`}
				>
					Last 30 Days
				</button>
				<button
					on:click={() => {
						selectedPreset = '90days';
						handlePresetChange();
					}}
					class={`px-3 py-2 rounded text-sm font-medium transition-colors ${
						!useCustomRange && selectedPreset === '90days'
							? 'bg-blue-600 text-white'
							: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
					}`}
				>
					Last 90 Days
				</button>
			</div>
		</div>

		<!-- Custom Range -->
		<div>
			<label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
				<input
					type="checkbox"
					bind:checked={useCustomRange}
					class="rounded border-gray-300"
				/>
				Custom Range
			</label>
			{#if useCustomRange}
				<div class="flex gap-2">
					<input
						type="date"
						bind:value={fromDate}
						on:change={handleCustomRangeChange}
						class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<input
						type="date"
						bind:value={toDate}
						on:change={handleCustomRangeChange}
						class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
			{/if}
		</div>
	</div>

	<!-- Chart -->
	{#if $historicalProgressStore && $historicalProgressStore.length > 0}
		<div class="space-y-6">
			{#each ['total', 'junior', 'pleno', 'senior'] as metric}
				{@const chartData = getChartData($historicalProgressStore, metric)}
				{@const maxValue = Math.max(...chartData.map((d) => Math.max(d.count, d.target)))}
				<div>
					<h4 class="text-sm font-semibold text-gray-700 mb-3">
						{getMetricLabel(metric)}
					</h4>
					<div class="space-y-2">
						{#each chartData as item, i}
							<div class="flex items-center gap-2">
								<div class="w-12 text-xs text-gray-600 text-right">
									{formatDate(item.date)}
								</div>
								<div class="flex-1">
									<div class="flex gap-1">
										<!-- Target bar (light) -->
										<div
											class="bg-gray-200 rounded"
											style={`width: ${(item.target / maxValue) * 100}%`}
										>
											<div class="h-6"></div>
										</div>
										<!-- Actual bar (colored) -->
										{#if item.count > 0}
											<div
												class="rounded transition-all"
												style={`
													width: ${(item.count / maxValue) * 100}%;
													background-color: ${getMetricColor(metric)};
												`}
											>
												<div class="h-6"></div>
											</div>
										{/if}
									</div>
								</div>
								<div class="w-16 text-sm text-gray-700 text-right">
									{item.count}/{item.target}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="text-center py-8 text-gray-500">
			<p>No data available for the selected period</p>
		</div>
	{/if}
</div>

<style>
	/* Bar chart styling */
</style>
