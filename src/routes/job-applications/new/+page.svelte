<script lang="ts">
	import { onMount } from 'svelte';
	import { jobApplicationsApi, type CreateJobApplicationRequest } from '$lib/api/job-applications';
	import { jobLevelsApi, type JobLevel } from '$lib/api/job-levels';
	import { contractTypesApi, type ContractType } from '$lib/api/contract-types';
	import { goto } from '$app/navigation';
	import { config } from '$lib/config';

	let formData: CreateJobApplicationRequest = {
		companyName: '',
		location: '',
		jobTitle: '',
		jobUrl: '',
		website: 'linkedin',
		jobLevelId: undefined,
		contractTypeId: undefined,
		interestLevel: undefined,
		tags: [],
		notes: '',
		followUpDate: undefined
	};

	let loading = false;
	let error: string | null = null;
	let tagInput = '';
	let jobLevels: JobLevel[] = [];
	let contractTypes: ContractType[] = [];
	let loadingLevels = true;
	let loadingTypes = true;

	// Paste functionality
	async function pasteToField(field: keyof CreateJobApplicationRequest | 'tagInput') {
		try {
			const text = await navigator.clipboard.readText();
			if (field === 'tagInput') {
				tagInput = text.trim();
			} else if (field === 'tags') {
				// For tags, split by comma or newline and add all
				const newTags = text
					.split(/[,\n]/)
					.map((t) => t.trim())
					.filter((t) => t);
				formData.tags = [...new Set([...(formData.tags || []), ...newTags])];
			} else {
				formData[field] = text.trim() as any;
			}
		} catch (err) {
			console.error('Failed to paste:', err);
		}
	}

	// Fetch reference data (job levels and contract types)
	async function fetchReferenceData() {
		try {
			const [levels, types] = await Promise.all([jobLevelsApi.list(), contractTypesApi.list()]);
			jobLevels = levels;
			contractTypes = types;
		} catch (err) {
			console.error('Failed to fetch reference data:', err);
			// Continue without failing - these are optional fields
		} finally {
			loadingLevels = false;
			loadingTypes = false;
		}
	}

	// Fetch CSRF token on page load
	onMount(async () => {
		try {
			// Make a GET request to the dedicated CSRF token endpoint
			// The backend middleware will generate a new token and set it in the X-CSRF-Token header
			// Our response interceptor will extract it and store it in memory
			await fetch(`${config.jobsApiUrl}/csrf-token`, {
				method: 'GET',
				credentials: 'include'
			});
		} catch (err: any) {
			// Even if the request fails, the CSRF token should still be set
			// The middleware generates tokens for all GET requests, regardless of auth status
			console.debug('CSRF token fetch completed (may have errors, but token should be set)');
		}

		// Fetch reference data
		await fetchReferenceData();
	});

	const websiteOptions = ['linkedin', 'glassdoor', 'indeed', 'monster', 'other'];
	const interestLevelOptions = ['low', 'medium', 'high', 'very-high'] as const;

	function addTag() {
		if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
			formData.tags = [...(formData.tags || []), tagInput.trim()];
			tagInput = '';
		}
	}

	function removeTag(tag: string) {
		formData.tags = formData.tags?.filter((t) => t !== tag) || [];
	}

	async function handleSubmit() {
		if (
			!formData.companyName ||
			!formData.location ||
			!formData.jobTitle ||
			!formData.jobUrl ||
			!formData.website
		) {
			error =
				'Please fill in all required fields (Company Name, Location, Job Title, Job URL, Website)';
			return;
		}

		loading = true;
		error = null;

		try {
			// The CSRF token should already be fetched in onMount
			// The request interceptor will automatically include it in the X-CSRF-Token header
			const application = await jobApplicationsApi.create(formData);
			goto(`/job-applications/${application.id}`);
		} catch (err: any) {
			// If we get a CSRF error, try to fetch a new token and retry once
			if (err.response?.status === 403) {
				const errorMsg = err.response?.data?.error;
				if (errorMsg && (errorMsg.includes('CSRF') || errorMsg.includes('csrf'))) {
					console.debug('CSRF token expired or invalid, fetching new token and retrying...');
					try {
						// Fetch new token from dedicated endpoint
						await fetch(`${config.jobsApiUrl}/csrf-token`, {
							method: 'GET',
							credentials: 'include'
						});
						// Retry the create request
						const application = await jobApplicationsApi.create(formData);
						goto(`/job-applications/${application.id}`);
						return;
					} catch (retryErr: any) {
						error =
							retryErr.response?.data?.message ||
							retryErr.message ||
							'Failed to create job application';
						console.error('Error creating application after retry:', retryErr);
					}
				} else {
					error = err.response?.data?.message || err.message || 'Failed to create job application';
					console.error('Error creating application:', err);
				}
			} else {
				error = err.response?.data?.message || err.message || 'Failed to create job application';
				console.error('Error creating application:', err);
			}
		} finally {
			loading = false;
		}
	}
</script>

<div class="container mx-auto max-w-2xl px-4 py-8">
	<div class="mb-6">
		<button
			onclick={() => goto('/job-applications')}
			class="mb-4 text-blue-600 hover:text-blue-700"
		>
			← Back to Applications
		</button>
		<h1 class="text-3xl font-bold text-gray-900">New Job Application</h1>
	</div>

	{#if error}
		<div class="mb-4 rounded-lg bg-red-50 p-4 text-red-800">{error}</div>
	{/if}

	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSubmit();
		}}
		class="space-y-6"
	>
		<!-- Required Fields -->
		<div>
			<label for="companyName" class="mb-1 block text-sm font-medium text-gray-700">
				Company Name <span class="text-red-500">*</span>
			</label>
			<div class="flex gap-2">
				<input
					id="companyName"
					type="text"
					bind:value={formData.companyName}
					required
					class="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
				/>
				<button
					type="button"
					onclick={() => pasteToField('companyName')}
					class="rounded-md border border-gray-300 bg-white px-3 py-2 transition-colors hover:bg-gray-50"
					title="Paste from clipboard"
				>
					📋
				</button>
			</div>
		</div>

		<div>
			<label for="jobTitle" class="mb-1 block text-sm font-medium text-gray-700">
				Job Title <span class="text-red-500">*</span>
			</label>
			<div class="flex gap-2">
				<input
					id="jobTitle"
					type="text"
					bind:value={formData.jobTitle}
					required
					class="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
				/>
				<button
					type="button"
					onclick={() => pasteToField('jobTitle')}
					class="rounded-md border border-gray-300 bg-white px-3 py-2 transition-colors hover:bg-gray-50"
					title="Paste from clipboard"
				>
					📋
				</button>
			</div>
		</div>

		<div>
			<label for="jobUrl" class="mb-1 block text-sm font-medium text-gray-700">
				Job URL <span class="text-red-500">*</span>
			</label>
			<div class="flex gap-2">
				<input
					id="jobUrl"
					type="url"
					bind:value={formData.jobUrl}
					required
					placeholder="https://..."
					class="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
				/>
				<button
					type="button"
					onclick={() => pasteToField('jobUrl')}
					class="rounded-md border border-gray-300 bg-white px-3 py-2 transition-colors hover:bg-gray-50"
					title="Paste from clipboard"
				>
					📋
				</button>
			</div>
		</div>

		<div>
			<label for="website" class="mb-1 block text-sm font-medium text-gray-700">
				Website <span class="text-red-500">*</span>
			</label>
			<p class="mb-2 text-xs text-gray-500">Where you found or will apply for this job.</p>
			<select
				id="website"
				bind:value={formData.website}
				required
				class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
			>
				{#each websiteOptions as website}
					<option value={website}>{website.charAt(0).toUpperCase() + website.slice(1)}</option>
				{/each}
			</select>
		</div>

		<!-- Job Level and Contract Type -->
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="jobLevel" class="mb-1 block text-sm font-medium text-gray-700">Job Level</label>
				<p class="mb-2 text-xs text-gray-500">Seniority and intensity classification</p>
				<select
					id="jobLevel"
					bind:value={formData.jobLevelId}
					disabled={loadingLevels}
					class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
				>
					<option value={undefined}>Select job level...</option>
					{#if loadingLevels}
						<option disabled>Loading...</option>
					{:else}
						{#each jobLevels as level}
							<option value={level.id}>
								{level.seniority.charAt(0).toUpperCase() + level.seniority.slice(1)} - {level.intensity
									.charAt(0)
									.toUpperCase() + level.intensity.slice(1)}
							</option>
						{/each}
					{/if}
				</select>
			</div>

			<div>
				<label for="contractType" class="mb-1 block text-sm font-medium text-gray-700"
					>Contract Type</label
				>
				<p class="mb-2 text-xs text-gray-500">Employment type for this position</p>
				<select
					id="contractType"
					bind:value={formData.contractTypeId}
					disabled={loadingTypes}
					class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
				>
					<option value={undefined}>Select contract type...</option>
					{#if loadingTypes}
						<option disabled>Loading...</option>
					{:else}
						{#each contractTypes as type}
							<option value={type.id}
								>{type.name.charAt(0).toUpperCase() + type.name.slice(1).replace(/_/g, ' ')}</option
							>
						{/each}
					{/if}
				</select>
			</div>
		</div>

		<!-- Optional Fields -->
		<div>
			<label for="location" class="mb-1 block text-sm font-medium text-gray-700"
				>Location <span class="text-red-500">*</span></label
			>
			<div class="flex gap-2">
				<input
					id="location"
					type="text"
					bind:value={formData.location}
					placeholder="City, State/Country"
					required
					class="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
				/>
				<button
					type="button"
					onclick={() => pasteToField('location')}
					class="rounded-md border border-gray-300 bg-white px-3 py-2 transition-colors hover:bg-gray-50"
					title="Paste from clipboard"
				>
					📋
				</button>
			</div>
		</div>

		<div>
			<label for="interestLevel" class="mb-1 block text-sm font-medium text-gray-700"
				>Interest Level</label
			>
			<p class="mb-2 text-xs text-gray-500">
				How interested are you in this opportunity? Helps prioritize your applications.
			</p>
			<select
				id="interestLevel"
				bind:value={formData.interestLevel}
				class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
			>
				<option value={undefined}>Select interest level...</option>
				{#each interestLevelOptions as level}
					<option value={level.replace(/-/g, '_')}
						>{level.charAt(0).toUpperCase() + level.slice(1).replace(/-/g, ' ')}</option
					>
				{/each}
			</select>
		</div>

		<div>
			<label for="tags" class="mb-1 block text-sm font-medium text-gray-700">Tags</label>
			<p class="mb-2 text-xs text-gray-500">
				Add custom labels like "remote", "startup", or "FAANG" to organize applications.
			</p>
			<div class="mb-2 flex gap-2">
				<input
					id="tags"
					type="text"
					bind:value={tagInput}
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							addTag();
						}
					}}
					placeholder="Add a tag and press Enter"
					class="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
				/>
				<button
					type="button"
					onclick={() => pasteToField('tagInput')}
					class="rounded-md border border-gray-300 bg-white px-3 py-2 transition-colors hover:bg-gray-50"
					title="Paste from clipboard"
				>
					📋
				</button>
				<button
					type="button"
					onclick={addTag}
					class="rounded-md bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
				>
					Add
				</button>
			</div>
			{#if formData.tags && formData.tags.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each formData.tags as tag}
						<span
							class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
						>
							{tag}
							<button
								type="button"
								onclick={() => removeTag(tag)}
								class="ml-1 text-blue-500 hover:text-blue-700"
							>
								×
							</button>
						</span>
					{/each}
				</div>
			{/if}
		</div>

		<div>
			<label for="followUpDate" class="mb-1 block text-sm font-medium text-gray-700"
				>Follow-up Date</label
			>
			<p class="mb-2 text-xs text-gray-500">
				Set a reminder date to follow up if you haven't heard back.
			</p>
			<input
				id="followUpDate"
				type="date"
				bind:value={formData.followUpDate}
				class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
			/>
		</div>

		<div>
			<label for="notes" class="mb-1 block text-sm font-medium text-gray-700">Notes</label>
			<div class="flex gap-2">
				<textarea
					id="notes"
					bind:value={formData.notes}
					rows="4"
					placeholder="Any additional notes about this application..."
					class="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
				></textarea>
				<button
					type="button"
					onclick={() => pasteToField('notes')}
					class="self-start rounded-md border border-gray-300 bg-white px-3 py-2 transition-colors hover:bg-gray-50"
					title="Paste from clipboard"
				>
					📋
				</button>
			</div>
		</div>

		<!-- Submit Buttons -->
		<div class="flex gap-4">
			<button
				type="submit"
				disabled={loading}
				class="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{loading ? 'Creating...' : 'Create Application'}
			</button>
			<button
				type="button"
				onclick={() => goto('/job-applications')}
				class="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
			>
				Cancel
			</button>
		</div>
	</form>
</div>
