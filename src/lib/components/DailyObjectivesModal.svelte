<script lang="ts">
import { onMount } from 'svelte';
import { objectivesStore, objectiveExists } from '$lib/stores/objectives';
import { objectivesLoading, objectivesError } from '$lib/stores/objectives';
import { isAuthenticated } from '$lib/stores/auth';

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

 $: showModal = $isAuthenticated && !$objectiveExists;

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

{#if showModal && $isAuthenticated}
	<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black" role="dialog" aria-modal="true" aria-labelledby="objectives-modal-title">
		<div class="w-96 max-w-full rounded-lg bg-white p-8 shadow-lg" tabindex="-1">
			<h2 id="objectives-modal-title" class="mb-2 text-2xl font-bold">Set Your Daily Objectives</h2>
			<p class="mb-6 text-gray-600">
				Define your daily targets for job applications by seniority level.
			</p>

			<form on:submit|preventDefault={handleSubmit} class="space-y-4">
				<!-- Total Target -->
				<div>
					<label for="totalTarget" class="mb-1 block text-sm font-medium text-gray-700">
						Total Daily Target
					</label>
					<input
						type="number"
						id="totalTarget"
						bind:value={totalTarget}
						min="0"
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
						on:input={handleInputChange}
						aria-label="Total Daily Target"
						autofocus
					/>
					<p class="mt-1 text-xs text-gray-500">Total applications you want to submit daily</p>
				</div>

				<!-- Junior Target -->
				<div>
					<label for="juniorTarget" class="mb-1 block text-sm font-medium text-gray-700">
						Junior Level Target
					</label>
					<input
						type="number"
						id="juniorTarget"
						bind:value={juniorTarget}
						min="0"
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
						on:input={handleInputChange}
						aria-label="Junior Level Target"
					/>
				</div>

				<!-- Pleno Target -->
				<div>
					<label for="plenoTarget" class="mb-1 block text-sm font-medium text-gray-700">
						Pleno/Mid-Level Target
					</label>
					<input
						type="number"
						id="plenoTarget"
						bind:value={plenoTarget}
						min="0"
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
						on:input={handleInputChange}
						aria-label="Pleno/Mid-Level Target"
					/>
				</div>

				<!-- Senior Target -->
				<div>
					<label for="seniorTarget" class="mb-1 block text-sm font-medium text-gray-700">
						Senior Level Target
					</label>
					<input
						type="number"
						id="seniorTarget"
						bind:value={seniorTarget}
						min="0"
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
						on:input={handleInputChange}
						aria-label="Senior Level Target"
					/>
				</div>

				<!-- Error Messages -->
				{#if submitError}
					<div class="rounded-md border border-red-200 bg-red-50 p-3" role="alert">
						<p class="text-sm text-red-700">{submitError}</p>
					</div>
				{/if}

				{#if $objectivesError}
					<div class="rounded-md border border-red-200 bg-red-50 p-3" role="alert">
						<p class="text-sm text-red-700">{$objectivesError}</p>
					</div>
				{/if}

				<!-- Submit Button -->
				<button
					type="submit"
					disabled={$objectivesLoading}
					class="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
					aria-busy={$objectivesLoading}
				>
					{$objectivesLoading ? 'Saving...' : 'Save Objectives'}
					{#if $objectivesLoading}
						<span class="ml-2 inline-block align-middle" aria-hidden="true">
							<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
							</svg>
						</span>
					{/if}
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
<!-- Modal only shows if authenticated -->
