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
	<div class="mx-auto max-w-6xl px-4 py-8">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="mb-2 text-3xl font-bold text-gray-900">Daily Progress</h1>
			<p class="text-gray-600">Track your job application targets and daily progress</p>
		</div>

		{#if $objectiveExists}
			<!-- Current Objectives Card -->
			<div class="mb-6 rounded-lg bg-white p-6 shadow">
				<div class="flex items-start justify-between">
					<div>
						<h2 class="mb-4 text-lg font-semibold text-gray-900">Current Objectives</h2>
						<div class="grid grid-cols-4 gap-4">
							<div>
								<p class="mb-1 text-sm text-gray-600">Total Daily</p>
								<p class="text-2xl font-bold text-blue-600">{$currentObjective?.totalTarget}</p>
							</div>
							<div>
								<p class="mb-1 text-sm text-gray-600">Junior</p>
								<p class="text-2xl font-bold text-green-600">{$currentObjective?.juniorTarget}</p>
							</div>
							<div>
								<p class="mb-1 text-sm text-gray-600">Pleno/Mid</p>
								<p class="text-2xl font-bold text-amber-600">{$currentObjective?.plenoTarget}</p>
							</div>
							<div>
								<p class="mb-1 text-sm text-gray-600">Senior</p>
								<p class="text-2xl font-bold text-red-600">{$currentObjective?.seniorTarget}</p>
							</div>
						</div>
					</div>
					<button
						on:click={() => (showEditModal = true)}
						class="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
					>
						Edit
					</button>
				</div>
			</div>

			<!-- Main Content -->
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
			<div class="py-16 text-center">
				<p class="mb-4 text-gray-600">No objectives set yet. Please set your daily objectives.</p>
			</div>
		{/if}

		<!-- Edit Modal -->
		{#if showEditModal}
			<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
				<div class="w-96 max-w-full rounded-lg bg-white p-8 shadow-lg">
					<h2 class="mb-4 text-2xl font-bold">Update Your Objectives</h2>

					<form on:submit|preventDefault={handleUpdateObjective} class="space-y-4">
						<!-- Total Target -->
						<div>
							<label for="editTotalTarget" class="mb-1 block text-sm font-medium text-gray-700">
								Total Daily Target
							</label>
							<input
								type="number"
								id="editTotalTarget"
								bind:value={editTotalTarget}
								min="0"
								class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							/>
						</div>

						<!-- Junior Target -->
						<div>
							<label for="editJuniorTarget" class="mb-1 block text-sm font-medium text-gray-700">
								Junior Level Target
							</label>
							<input
								type="number"
								id="editJuniorTarget"
								bind:value={editJuniorTarget}
								min="0"
								class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							/>
						</div>

						<!-- Pleno Target -->
						<div>
							<label for="editPlenoTarget" class="mb-1 block text-sm font-medium text-gray-700">
								Pleno/Mid-Level Target
							</label>
							<input
								type="number"
								id="editPlenoTarget"
								bind:value={editPlenoTarget}
								min="0"
								class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							/>
						</div>

						<!-- Senior Target -->
						<div>
							<label for="editSeniorTarget" class="mb-1 block text-sm font-medium text-gray-700">
								Senior Level Target
							</label>
							<input
								type="number"
								id="editSeniorTarget"
								bind:value={editSeniorTarget}
								min="0"
								class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							/>
						</div>

						<!-- Error Messages -->
						{#if editError}
							<div class="rounded-md border border-red-200 bg-red-50 p-3">
								<p class="text-sm text-red-700">{editError}</p>
							</div>
						{/if}

						<!-- Buttons -->
						<div class="flex gap-2">
							<button
								type="submit"
								disabled={editLoading}
								class="flex-1 rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
							>
								{editLoading ? 'Saving...' : 'Update'}
							</button>
							<button
								type="button"
								on:click={() => (showEditModal = false)}
								class="flex-1 rounded-md bg-gray-300 px-4 py-2 font-medium text-gray-800 transition-colors hover:bg-gray-400"
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
