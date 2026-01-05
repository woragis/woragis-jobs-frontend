<script lang="ts">
	import { goto } from '$app/navigation';
	import { authApi } from '$lib/api/auth';
	import { authStore } from '$lib/stores/auth';
	import type { RegisterRequest } from '$lib/api/auth';

	let username = '';
	let email = '';
	let password = '';
	let confirmPassword = '';
	let firstName = '';
	let lastName = '';
	let loading = false;
	let error = '';

	const handleSubmit = async (event: SubmitEvent) => {
		event.preventDefault();
		error = '';

		if (password !== confirmPassword) {
			error = 'Passwords do not match.';
			return;
		}

		if (password.length < 8) {
			error = 'Password must be at least 8 characters long.';
			return;
		}

		loading = true;

		try {
			const registerData: RegisterRequest = {
				username,
				email,
				password,
				first_name: firstName,
				last_name: lastName
			};

			const response = await authApi.register(registerData);
			
			// Update auth store with user data
			authStore.setUser(response.user, response.user.profile || null);
			
			// Redirect to job applications
			await goto('/job-applications');
		} catch (err: any) {
			error = err.response?.data?.message || err.message || 'Unable to create account. Please try again.';
			console.error('Registration error:', err);
		} finally {
			loading = false;
		}
	};
</script>

<div class="container mx-auto px-4 py-16">
	<div class="mx-auto max-w-md">
		<div class="mb-8 text-center">
			<h1 class="mb-2 text-3xl font-bold text-gray-900">Create Account</h1>
			<p class="text-gray-600">Fill in the details below to get started</p>
		</div>

		<form class="space-y-6 rounded-lg border border-gray-200 bg-white p-8 shadow-sm" on:submit={handleSubmit}>
			{#if error}
				<div class="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</div>
			{/if}

			<div class="space-y-4">
				<div>
					<label for="username" class="block text-sm font-medium text-gray-700 mb-1">
						Username
					</label>
					<input
						id="username"
						type="text"
						placeholder="johndoe"
						bind:value={username}
						required
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					/>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">
							First Name
						</label>
						<input
							id="firstName"
							type="text"
							placeholder="John"
							bind:value={firstName}
							required
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">
							Last Name
						</label>
						<input
							id="lastName"
							type="text"
							placeholder="Doe"
							bind:value={lastName}
							required
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>
				</div>

				<div>
					<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
						Email
					</label>
					<input
						id="email"
						type="email"
						placeholder="you@example.com"
						bind:value={email}
						required
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 mb-1">
						Password
					</label>
					<input
						id="password"
						type="password"
						placeholder="********"
						minlength="8"
						bind:value={password}
						required
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					/>
					<p class="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
				</div>

				<div>
					<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
						Confirm Password
					</label>
					<input
						id="confirmPassword"
						type="password"
						placeholder="********"
						minlength="8"
						bind:value={confirmPassword}
						required
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					/>
				</div>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if loading}
					Creating account...
				{:else}
					Create Account
				{/if}
			</button>

			<div class="text-center text-sm text-gray-600">
				<p>
					Already have an account?
					<a href="/auth/login" class="text-blue-600 hover:underline">Sign in</a>
				</p>
			</div>
		</form>
	</div>
</div>

