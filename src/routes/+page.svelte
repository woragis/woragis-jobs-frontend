<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore, isAuthenticated } from '$lib/stores/auth';

	onMount(() => {
		// If authenticated, redirect to job applications
		if ($isAuthenticated) {
			goto('/job-applications');
		}
	});
</script>

<div class="container mx-auto px-4 py-16 text-center">
	<h1 class="mb-4 text-5xl font-bold text-gray-900">Job Applications</h1>
	<p class="mb-8 text-xl text-gray-600">Manage your job applications in one place</p>
	
	{#if $isAuthenticated}
		<button
			onclick={() => goto('/job-applications')}
			class="rounded-lg bg-blue-600 px-6 py-3 text-lg text-white hover:bg-blue-700 transition-colors"
		>
			View Applications
		</button>
	{:else}
		<div class="space-x-4">
			<button
				onclick={() => goto('/auth/login')}
				class="rounded-lg bg-blue-600 px-6 py-3 text-lg text-white hover:bg-blue-700 transition-colors"
			>
				Sign In
			</button>
			<button
				onclick={() => goto('/auth/register')}
				class="rounded-lg border border-gray-300 px-6 py-3 text-lg text-gray-700 hover:bg-gray-50 transition-colors"
			>
				Create Account
			</button>
		</div>
	{/if}
</div>
