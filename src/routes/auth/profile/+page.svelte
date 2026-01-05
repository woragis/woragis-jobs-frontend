<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authApi } from '$lib/api/auth';
	import { authStore, currentUser, currentProfile } from '$lib/stores/auth';
	import type { ProfileUpdateRequest, ChangePasswordRequest } from '$lib/api/auth';

	let profile = $derived($currentProfile);
	let user = $derived($currentUser);
	
	let loading = false;
	let saving = false;
	let error = '';
	let success = '';

	// Profile form fields
	let bio = '';
	let phone = '';
	let location = '';
	let website = '';

	// Password change fields
	let currentPassword = '';
	let newPassword = '';
	let confirmPassword = '';
	let showPasswordForm = false;

	onMount(() => {
		if (profile) {
			bio = profile.bio || '';
			phone = profile.phone || '';
			location = profile.location || '';
			website = profile.website || '';
		}
	});

	async function loadProfile() {
		loading = true;
		error = '';
		try {
			await authStore.refreshProfile();
		} catch (err: any) {
			error = err.response?.data?.message || err.message || 'Failed to load profile';
		} finally {
			loading = false;
		}
	}

	async function updateProfile() {
		saving = true;
		error = '';
		success = '';

		try {
			const updateData: ProfileUpdateRequest = {
				bio: bio || undefined,
				phone: phone || undefined,
				location: location || undefined,
				website: website || undefined
			};

			const updatedProfile = await authApi.updateProfile(updateData);
			authStore.setProfile(updatedProfile);
			success = 'Profile updated successfully';
		} catch (err: any) {
			error = err.response?.data?.message || err.message || 'Failed to update profile';
		} finally {
			saving = false;
		}
	}

	async function changePassword() {
		if (newPassword !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (newPassword.length < 8) {
			error = 'Password must be at least 8 characters long';
			return;
		}

		saving = true;
		error = '';
		success = '';

		try {
			const passwordData: ChangePasswordRequest = {
				current_password: currentPassword,
				new_password: newPassword
			};

			await authApi.changePassword(passwordData);
			success = 'Password changed successfully';
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
			showPasswordForm = false;
		} catch (err: any) {
			error = err.response?.data?.message || err.message || 'Failed to change password';
		} finally {
			saving = false;
		}
	}

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

<div class="container mx-auto px-4 py-8">
	<div class="mx-auto max-w-2xl">
		<div class="mb-6 flex items-center justify-between">
			<h1 class="text-3xl font-bold text-gray-900">Profile</h1>
			<button
				onclick={() => goto('/job-applications')}
				class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
			>
				Back to Applications
			</button>
		</div>

		{#if loading}
			<div class="text-center py-12">
				<div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
				<p class="mt-4 text-gray-600">Loading profile...</p>
			</div>
		{:else if !user}
			<div class="rounded-lg border border-gray-200 bg-white p-8 text-center">
				<p class="text-gray-500 mb-4">You need to be signed in to view your profile.</p>
				<a href="/auth/login" class="text-blue-600 hover:underline">Sign in</a>
			</div>
		{:else}
			<!-- User Info -->
			<div class="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-xl font-semibold text-gray-900">Account Information</h2>
				<div class="space-y-2">
					<p class="text-sm text-gray-600">
						<span class="font-medium">Name:</span> {user.first_name} {user.last_name}
					</p>
					<p class="text-sm text-gray-600">
						<span class="font-medium">Username:</span> {user.username}
					</p>
					<p class="text-sm text-gray-600">
						<span class="font-medium">Email:</span> {user.email}
					</p>
					<p class="text-sm text-gray-600">
						<span class="font-medium">Role:</span> {user.role}
					</p>
					<p class="text-sm text-gray-600">
						<span class="font-medium">Status:</span>
						<span class={user.is_verified ? 'text-green-600' : 'text-yellow-600'}>
							{user.is_verified ? 'Verified' : 'Not Verified'}
						</span>
					</p>
				</div>
			</div>

			<!-- Profile Update Form -->
			<div class="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-xl font-semibold text-gray-900">Profile Details</h2>

				{#if error}
					<div class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</div>
				{/if}

				{#if success}
					<div class="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-800">{success}</div>
				{/if}

				<form class="space-y-4" onsubmit={(e) => { e.preventDefault(); updateProfile(); }}>
					<div>
						<label for="bio" class="block text-sm font-medium text-gray-700 mb-1">
							Bio
						</label>
						<textarea
							id="bio"
							bind:value={bio}
							rows="3"
							placeholder="Tell us about yourself..."
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						></textarea>
					</div>

					<div>
						<label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
							Phone
						</label>
						<input
							id="phone"
							type="tel"
							bind:value={phone}
							placeholder="+1 (555) 123-4567"
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label for="location" class="block text-sm font-medium text-gray-700 mb-1">
							Location
						</label>
						<input
							id="location"
							type="text"
							bind:value={location}
							placeholder="City, Country"
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label for="website" class="block text-sm font-medium text-gray-700 mb-1">
							Website
						</label>
						<input
							id="website"
							type="url"
							bind:value={website}
							placeholder="https://example.com"
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>

					<button
						type="submit"
						disabled={saving}
						class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if saving}
							Saving...
						{:else}
							Save Profile
						{/if}
					</button>
				</form>
			</div>

			<!-- Password Change -->
			<div class="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-xl font-semibold text-gray-900">Change Password</h2>
					<button
						onclick={() => {
							showPasswordForm = !showPasswordForm;
							if (!showPasswordForm) {
								currentPassword = '';
								newPassword = '';
								confirmPassword = '';
								error = '';
							}
						}}
						class="text-sm text-blue-600 hover:underline"
					>
						{showPasswordForm ? 'Cancel' : 'Change Password'}
					</button>
				</div>

				{#if showPasswordForm}
					<form class="space-y-4" onsubmit={(e) => { e.preventDefault(); changePassword(); }}>
						<div>
							<label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-1">
								Current Password
							</label>
							<input
								id="currentPassword"
								type="password"
								bind:value={currentPassword}
								required
								class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>

						<div>
							<label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">
								New Password
							</label>
							<input
								id="newPassword"
								type="password"
								bind:value={newPassword}
								minlength="8"
								required
								class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
							<p class="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
						</div>

						<div>
							<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
								Confirm New Password
							</label>
							<input
								id="confirmPassword"
								type="password"
								bind:value={confirmPassword}
								minlength="8"
								required
								class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>

						<button
							type="submit"
							disabled={saving}
							class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{#if saving}
								Changing Password...
							{:else}
								Change Password
							{/if}
						</button>
					</form>
				{/if}
			</div>

			<!-- Logout -->
			<div class="rounded-lg border border-red-200 bg-red-50 p-6">
				<h2 class="mb-4 text-xl font-semibold text-red-900">Danger Zone</h2>
				<button
					onclick={handleLogout}
					class="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 transition-colors"
				>
					Sign Out
				</button>
			</div>
		{/if}
	</div>
</div>

