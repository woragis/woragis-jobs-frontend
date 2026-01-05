<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { authStore, isAuthenticated, currentUser } from '$lib/stores/auth';
	import { authApi } from '$lib/api/auth';

	let { children } = $props();

	// Initialize auth store on app load
	onMount(() => {
		authStore.init();
	});

	async function handleLogout() {
		try {
			const refreshToken = authApi.getRefreshToken();
			if (refreshToken) {
				await authApi.logout(refreshToken);
			}
			authStore.clear();
			await goto('/auth/login');
		} catch (err) {
			console.error('Logout error:', err);
			// Clear local state anyway
			authStore.clear();
			await goto('/auth/login');
		}
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if $isAuthenticated}
	<nav class="border-b border-gray-200 bg-white shadow-sm">
		<div class="container mx-auto px-4">
			<div class="flex h-16 items-center justify-between">
				<div class="flex items-center gap-6">
					<a href="/job-applications" class="text-xl font-bold text-gray-900 hover:text-blue-600">
						Job Applications
					</a>
					<div class="flex gap-4">
						<a href="/job-applications" class="text-sm text-gray-700 hover:text-blue-600">
							Applications
						</a>
						<a href="/job-applications/new" class="text-sm text-gray-700 hover:text-blue-600">
							New Application
						</a>
						<a href="/auth/profile" class="text-sm text-gray-700 hover:text-blue-600">
							Profile
						</a>
					</div>
				</div>
				<div class="flex items-center gap-4">
					{#if $currentUser}
						<span class="text-sm text-gray-600">
							{$currentUser.first_name} {$currentUser.last_name}
						</span>
					{/if}
					<button
						onclick={handleLogout}
						class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
					>
						Sign Out
					</button>
				</div>
			</div>
		</div>
	</nav>
{/if}

{@render children()}
