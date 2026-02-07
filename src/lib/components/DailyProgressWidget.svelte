<script lang="ts">
	import { onMount } from 'svelte';
	import { todayProgressStore, objectivesStore } from '$lib/stores/objectives';

	onMount(async () => {
		await objectivesStore.loadTodayProgress();
	});

	function getProgressColor(progress: number): string {
		if (progress >= 100) return 'bg-green-500';
		if (progress >= 75) return 'bg-blue-500';
		if (progress >= 50) return 'bg-yellow-500';
		if (progress >= 25) return 'bg-orange-500';
		return 'bg-red-500';
	}

	function getProgressLabel(progress: number): string {
		if (progress >= 100) return '✓ Complete';
		return `${Math.round(progress)}%`;
	}

	function ProgressBar({ value, max }: { value: number; max: number }) {
		const percentage = Math.min((value / max) * 100, 100);
		return { percentage };
	}
</script>

<div class="rounded-lg bg-white p-6 shadow">
	<h3 class="mb-4 text-lg font-semibold text-gray-900">Today's Progress</h3>

	{#if $todayProgressStore}
		<div class="space-y-4">
			<!-- Total Progress -->
			<div>
				<div class="mb-2 flex items-center justify-between">
					<span class="text-sm font-medium text-gray-700">Total</span>
					<span class="text-sm font-bold text-gray-900">
						{$todayProgressStore.totalCount}/{$todayProgressStore.totalTarget}
					</span>
				</div>
				<div class="h-2 w-full rounded-full bg-gray-200">
					<div
						class={`h-2 rounded-full transition-all ${getProgressColor($todayProgressStore.totalProgress)}`}
						style={`width: ${Math.min($todayProgressStore.totalProgress, 100)}%`}
					></div>
				</div>
				<p class="mt-1 text-xs text-gray-500">
					{getProgressLabel($todayProgressStore.totalProgress)}
				</p>
			</div>

			<!-- Junior Progress -->
			<div>
				<div class="mb-2 flex items-center justify-between">
					<span class="text-sm font-medium text-gray-700">Junior</span>
					<span class="text-sm font-bold text-gray-900">
						{$todayProgressStore.juniorCount}/{$todayProgressStore.juniorTarget}
					</span>
				</div>
				<div class="h-2 w-full rounded-full bg-gray-200">
					<div
						class={`h-2 rounded-full transition-all ${getProgressColor($todayProgressStore.juniorProgress)}`}
						style={`width: ${Math.min($todayProgressStore.juniorProgress, 100)}%`}
					></div>
				</div>
				<p class="mt-1 text-xs text-gray-500">
					{getProgressLabel($todayProgressStore.juniorProgress)}
				</p>
			</div>

			<!-- Pleno Progress -->
			<div>
				<div class="mb-2 flex items-center justify-between">
					<span class="text-sm font-medium text-gray-700">Pleno/Mid</span>
					<span class="text-sm font-bold text-gray-900">
						{$todayProgressStore.plenoCount}/{$todayProgressStore.plenoTarget}
					</span>
				</div>
				<div class="h-2 w-full rounded-full bg-gray-200">
					<div
						class={`h-2 rounded-full transition-all ${getProgressColor($todayProgressStore.plenoProgress)}`}
						style={`width: ${Math.min($todayProgressStore.plenoProgress, 100)}%`}
					></div>
				</div>
				<p class="mt-1 text-xs text-gray-500">
					{getProgressLabel($todayProgressStore.plenoProgress)}
				</p>
			</div>

			<!-- Senior Progress -->
			<div>
				<div class="mb-2 flex items-center justify-between">
					<span class="text-sm font-medium text-gray-700">Senior</span>
					<span class="text-sm font-bold text-gray-900">
						{$todayProgressStore.seniorCount}/{$todayProgressStore.seniorTarget}
					</span>
				</div>
				<div class="h-2 w-full rounded-full bg-gray-200">
					<div
						class={`h-2 rounded-full transition-all ${getProgressColor($todayProgressStore.seniorProgress)}`}
						style={`width: ${Math.min($todayProgressStore.seniorProgress, 100)}%`}
					></div>
				</div>
				<p class="mt-1 text-xs text-gray-500">
					{getProgressLabel($todayProgressStore.seniorProgress)}
				</p>
			</div>
		</div>
	{:else}
		<div class="py-8 text-center text-gray-500">
			<p>Loading progress...</p>
		</div>
	{/if}
</div>
