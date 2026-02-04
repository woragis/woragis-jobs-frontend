<script lang="ts">
	import { onMount } from 'svelte';
	import DailyProgressWidget from '$lib/components/DailyProgressWidget.svelte';
	import DailyProgressChart from '$lib/components/DailyProgressChart.svelte';
	import { objectivesStore, currentObjective, objectiveExists } from '$lib/stores/objectives';

	let showEditModal = false;
	let editTotalTarget = 0;
	let editJuniorTarget = 0;
	let editPlenoTarget = 0;
	let editSeniorTarget = 0;
	let editError = '';
	let editLoading = false;

	onMount(async () => {
		await objectivesStore.init();
	});

	$: if ($currentObjective) {
		editTotalTarget = $currentObjective.totalTarget;
		editJuniorTarget = $currentObjective.juniorTarget;
		editPlenoTarget = $currentObjective.plenoTarget;
		editSeniorTarget = $currentObjective.seniorTarget;
	}

	async function handleUpdateObjective() {
		editError = '';

		// Validation
		if (
			editTotalTarget < 0 ||
			editJuniorTarget < 0 ||
			editPlenoTarget < 0 ||
			editSeniorTarget < 0
		) {
			editError = 'All targets must be non-negative';
			return;
		}

		const sum = editJuniorTarget + editPlenoTarget + editSeniorTarget;
		if (sum !== editTotalTarget) {
			editError = `Sum of levels (${sum}) must equal total target (${editTotalTarget})`;
			return;
		}

		try {
			editLoading = true;
			await objectivesStore.updateObjective(
				editTotalTarget,
				editJuniorTarget,
				editPlenoTarget,
				editSeniorTarget
			);
			showEditModal = false;
		} catch (err) {
			editError = err instanceof Error ? err.message : 'Failed to update objectives';
		} finally {
			editLoading = false;
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	<div class="max-w-6xl mx-auto py-8 px-4">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Daily Progress</h1>
			<p class="text-gray-600">Track your job application targets and daily progress</p>
		</div>

		{#if $objectiveExists}
			<!-- Current Objectives Card -->
			<div class="bg-white rounded-lg shadow p-6 mb-6">
				<div class="flex justify-between items-start">
					<div>
						<h2 class="text-lg font-semibold text-gray-900 mb-4">Current Objectives</h2>
						<div class="grid grid-cols-4 gap-4">
							<div>
								<p class="text-sm text-gray-600 mb-1">Total Daily</p>
								<p class="text-2xl font-bold text-blue-600">{$currentObjective?.totalTarget}</p>
							</div>
							<div>
								<p class="text-sm text-gray-600 mb-1">Junior</p>
								<p class="text-2xl font-bold text-green-600">{$currentObjective?.juniorTarget}</p>
							</div>
							<div>
								<p class="text-sm text-gray-600 mb-1">Pleno/Mid</p>
								<p class="text-2xl font-bold text-amber-600">{$currentObjective?.plenoTarget}</p>
							</div>
							<div>
								<p class="text-sm text-gray-600 mb-1">Senior</p>
								<p class="text-2xl font-bold text-red-600">{$currentObjective?.seniorTarget}</p>
							</div>
						</div>
					</div>
					<button
						on:click={() => (showEditModal = true)}
						class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
					>
						Edit
					</button>
				</div>
			</div>

			<!-- Main Content -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<!-- Today's Progress (spans 1 column on lg) -->
				<div class="lg:col-span-1">
					<DailyProgressWidget />
				</div>

				<!-- Historical Chart (spans 2 columns on lg) -->
				<div class="lg:col-span-2">
					<DailyProgressChart />
				</div>
			</div>
		{:else}
			<div class="text-center py-16">
				<p class="text-gray-600 mb-4">No objectives set yet. Please set your daily objectives.</p>
			</div>
		{/if}

		<!-- Edit Modal -->
		{#if showEditModal}
			<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
				<div class="bg-white rounded-lg shadow-lg p-8 w-96 max-w-full">
					<h2 class="text-2xl font-bold mb-4">Update Your Objectives</h2>

					<form on:submit|preventDefault={handleUpdateObjective} class="space-y-4">
						<!-- Total Target -->
						<div>
							<label for="editTotalTarget" class="block text-sm font-medium text-gray-700 mb-1">
								Total Daily Target
							</label>
							<input
								type="number"
								id="editTotalTarget"
								bind:value={editTotalTarget}
								min="0"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<!-- Junior Target -->
						<div>
							<label for="editJuniorTarget" class="block text-sm font-medium text-gray-700 mb-1">
								Junior Level Target
							</label>
							<input
								type="number"
								id="editJuniorTarget"
								bind:value={editJuniorTarget}
								min="0"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<!-- Pleno Target -->
						<div>
							<label for="editPlenoTarget" class="block text-sm font-medium text-gray-700 mb-1">
								Pleno/Mid-Level Target
							</label>
							<input
								type="number"
								id="editPlenoTarget"
								bind:value={editPlenoTarget}
								min="0"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<!-- Senior Target -->
						<div>
							<label for="editSeniorTarget" class="block text-sm font-medium text-gray-700 mb-1">
								Senior Level Target
							</label>
							<input
								type="number"
								id="editSeniorTarget"
								bind:value={editSeniorTarget}
								min="0"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<!-- Error Messages -->
						{#if editError}
							<div class="p-3 bg-red-50 border border-red-200 rounded-md">
								<p class="text-sm text-red-700">{editError}</p>
							</div>
						{/if}

						<!-- Buttons -->
						<div class="flex gap-2">
							<button
								type="submit"
								disabled={editLoading}
								class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
							>
								{editLoading ? 'Saving...' : 'Update'}
							</button>
							<button
								type="button"
								on:click={() => (showEditModal = false)}
								class="flex-1 bg-gray-300 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-400 font-medium transition-colors"
							>
								Cancel
							</button>
						</div>
					</form>
				</div>
			</div>
		{/if}
	</div>
</div>
