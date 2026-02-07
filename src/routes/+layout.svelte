<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { authStore, isAuthenticated, currentUser } from '$lib/stores/auth';
	import { authApi } from '$lib/api/auth';
	import DailyObjectivesModal from '$lib/components/DailyObjectivesModal.svelte';
	import Toast from '$lib/components/Toast.svelte';

	let { children } = $props();
	let mobileMenuOpen = $state(false);

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

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	async function handleLogoutMobile() {
		closeMobileMenu();
		await handleLogout();
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if $isAuthenticated}
	<nav class="border-b border-gray-200 bg-white shadow-sm">
		<div class="container mx-auto px-4">
			<div class="flex h-16 items-center justify-between">
				<div class="flex items-center gap-6">
					<a href="/job-applications" class="text-xl font-bold text-gray-900 hover:text-blue-600">
						Job Manager
					</a>
					<!-- Desktop Navigation -->
					<div class="hidden gap-4 md:flex">
						<a
							href="/job-applications"
							class="text-sm text-gray-700 transition-colors hover:text-blue-600"
						>
							Applications
						</a>
						<a
							href="/dashboard"
							class="text-sm text-gray-700 transition-colors hover:text-blue-600"
						>
							Dashboard
						</a>
						<a
							href="/daily-progress"
							class="text-sm text-gray-700 transition-colors hover:text-blue-600"
						>
							📊 Daily Progress
						</a>
						<a href="/resumes" class="text-sm text-gray-700 transition-colors hover:text-blue-600">
							Resumes
						</a>
						<a href="/reports" class="text-sm text-gray-700 transition-colors hover:text-blue-600">
							Reports
						</a>
						<a
							href="/resumes/generate"
							class="text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
						>
							✨ Generate Resume
						</a>
						<a
							href="/auth/profile"
							class="text-sm text-gray-700 transition-colors hover:text-blue-600"
						>
							Profile
						</a>
					</div>
				</div>

				<!-- Desktop User Section -->
				<div class="hidden items-center gap-4 md:flex">
					{#if $currentUser}
						<span class="text-sm text-gray-600">
							{$currentUser.first_name}
							{$currentUser.last_name}
						</span>
					{/if}
					<button
						on:click={handleLogout}
						class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
					>
						Sign Out
					</button>
				</div>

				<!-- Mobile Hamburger Button -->
				<button
					on:click={() => (mobileMenuOpen = !mobileMenuOpen)}
					class="rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 md:hidden"
					title="Toggle menu"
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
						/>
					</svg>
				</button>
			</div>

			<div class="space-y-2 border-t border-gray-200 bg-white py-4 md:hidden">
				<a
					href="/job-applications"
					on:click={closeMobileMenu}
					class="block rounded-lg px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
				>
					Applications
				</a>
				<a
					href="/dashboard"
					on:click={closeMobileMenu}
					class="block rounded-lg px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
				>
					Dashboard
				</a>
				<a
					href="/daily-progress"
					on:click={closeMobileMenu}
					class="block rounded-lg px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
				>
					📊 Daily Progress
				</a>
				<a
					href="/resumes"
					on:click={closeMobileMenu}
					class="block rounded-lg px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
				>
					Resumes
				</a>
				<a
					href="/reports"
					on:click={closeMobileMenu}
					class="block rounded-lg px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
				>
					📊 Reports
				</a>
				<a
					href="/resumes/generate"
					on:click={closeMobileMenu}
					class="block rounded-lg px-4 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
				>
					✨ Generate Resume
				</a>
				<a
					href="/auth/profile"
					on:click={closeMobileMenu}
					class="block rounded-lg px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
				>
					Profile
				</a>
				<hr class="my-2" />
				{#if $currentUser}
					<div class="px-4 py-2 text-sm text-gray-600">
						{$currentUser.first_name}
						{$currentUser.last_name}
					</div>
				{/if}
				<button
					on:click={handleLogoutMobile}
					class="w-full rounded-lg px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600"
				>
					Sign Out
				</button>
			</div>
		</div>
	</nav>
{/if}

<DailyObjectivesModal />

<Toast />

{@render children()}
