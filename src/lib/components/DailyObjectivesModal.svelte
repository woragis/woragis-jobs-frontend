<script lang="ts">
	import { onMount } from 'svelte';
	import { objectivesStore, objectiveExists } from '$lib/stores/objectives';
	import { objectivesLoading, objectivesError } from '$lib/stores/objectives';

	let showModal = false;
	let totalTarget = 100;
	let juniorTarget = 70;
	let plenoTarget = 30;
	let seniorTarget = 0;
	let submitError = '';

	onMount(async () => {
		// Check if objectives exist
		await objectivesStore.init();
	});

	$: showModal = !$objectiveExists;

	async function handleSubmit() {
		submitError = '';

		// Validation
		if (totalTarget < 0 || juniorTarget < 0 || plenoTarget < 0 || seniorTarget < 0) {
			submitError = 'All targets must be non-negative';
			return;
		}

		const sum = juniorTarget + plenoTarget + seniorTarget;
		if (sum !== totalTarget) {
			submitError = `Sum of levels (${sum}) must equal total target (${totalTarget})`;
			return;
		}

		try {
			await objectivesStore.createObjective(totalTarget, juniorTarget, plenoTarget, seniorTarget);
			showModal = false;
		} catch (err) {
			submitError = err instanceof Error ? err.message : 'Failed to save objectives';
		}
	}

	function handleInputChange() {
		submitError = '';
	}
</script>

{#if showModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg shadow-lg p-8 w-96 max-w-full">
			<h2 class="text-2xl font-bold mb-2">Set Your Daily Objectives</h2>
			<p class="text-gray-600 mb-6">
				Define your daily targets for job applications by seniority level.
			</p>

			<form on:submit|preventDefault={handleSubmit} class="space-y-4">
				<!-- Total Target -->
				<div>
					<label for="totalTarget" class="block text-sm font-medium text-gray-700 mb-1">
						Total Daily Target
					</label>
					<input
						type="number"
						id="totalTarget"
						bind:value={totalTarget}
						min="0"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						on:input={handleInputChange}
					/>
					<p class="text-xs text-gray-500 mt-1">Total applications you want to submit daily</p>
				</div>

				<!-- Junior Target -->
				<div>
					<label for="juniorTarget" class="block text-sm font-medium text-gray-700 mb-1">
						Junior Level Target
					</label>
					<input
						type="number"
						id="juniorTarget"
						bind:value={juniorTarget}
						min="0"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						on:input={handleInputChange}
					/>
				</div>

				<!-- Pleno Target -->
				<div>
					<label for="plenoTarget" class="block text-sm font-medium text-gray-700 mb-1">
						Pleno/Mid-Level Target
					</label>
					<input
						type="number"
						id="plenoTarget"
						bind:value={plenoTarget}
						min="0"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						on:input={handleInputChange}
					/>
				</div>

				<!-- Senior Target -->
				<div>
					<label for="seniorTarget" class="block text-sm font-medium text-gray-700 mb-1">
						Senior Level Target
					</label>
					<input
						type="number"
						id="seniorTarget"
						bind:value={seniorTarget}
						min="0"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						on:input={handleInputChange}
					/>
				</div>

				<!-- Error Messages -->
				{#if submitError}
					<div class="p-3 bg-red-50 border border-red-200 rounded-md">
						<p class="text-sm text-red-700">{submitError}</p>
					</div>
				{/if}

				{#if $objectivesError}
					<div class="p-3 bg-red-50 border border-red-200 rounded-md">
						<p class="text-sm text-red-700">{$objectivesError}</p>
					</div>
				{/if}

				<!-- Submit Button -->
				<button
					type="submit"
					disabled={$objectivesLoading}
					class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
				>
					{$objectivesLoading ? 'Saving...' : 'Save Objectives'}
				</button>
			</form>
		</div>
	</div>
{/if}

<style>
	/* Modal backdrop prevents scroll */
	:global(body.modal-open) {
		overflow: hidden;
	}
</style>
