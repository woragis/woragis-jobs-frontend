<script lang="ts">
	import { jobApplicationsApi, type CreateJobApplicationRequest } from '$lib/api/job-applications';
	import { goto } from '$app/navigation';

	let formData: CreateJobApplicationRequest = {
		companyName: '',
		location: '',
		jobTitle: '',
		jobUrl: '',
		website: 'linkedin',
		interestLevel: undefined,
		tags: [],
		notes: ''
	};

	let loading = false;
	let error: string | null = null;
	let tagInput = '';

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
		if (!formData.companyName || !formData.jobTitle || !formData.jobUrl || !formData.website) {
			error = 'Please fill in all required fields';
			return;
		}

		loading = true;
		error = null;

		try {
			const application = await jobApplicationsApi.create(formData);
			goto(`/job-applications/${application.id}`);
		} catch (err: any) {
			error = err.response?.data?.message || err.message || 'Failed to create job application';
			console.error('Error creating application:', err);
		} finally {
			loading = false;
		}
	}
</script>

<div class="container mx-auto max-w-2xl px-4 py-8">
	<div class="mb-6">
		<button
			onclick={() => goto('/job-applications')}
			class="text-blue-600 hover:text-blue-700 mb-4"
		>
			← Back to Applications
		</button>
		<h1 class="text-3xl font-bold text-gray-900">New Job Application</h1>
	</div>

	{#if error}
		<div class="mb-4 rounded-lg bg-red-50 p-4 text-red-800">{error}</div>
	{/if}

	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
		<!-- Required Fields -->
		<div>
			<label for="companyName" class="block text-sm font-medium text-gray-700 mb-1">
				Company Name <span class="text-red-500">*</span>
			</label>
			<input
				id="companyName"
				type="text"
				bind:value={formData.companyName}
				required
				class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
			/>
		</div>

		<div>
			<label for="jobTitle" class="block text-sm font-medium text-gray-700 mb-1">
				Job Title <span class="text-red-500">*</span>
			</label>
			<input
				id="jobTitle"
				type="text"
				bind:value={formData.jobTitle}
				required
				class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
			/>
		</div>

		<div>
			<label for="jobUrl" class="block text-sm font-medium text-gray-700 mb-1">
				Job URL <span class="text-red-500">*</span>
			</label>
			<input
				id="jobUrl"
				type="url"
				bind:value={formData.jobUrl}
				required
				placeholder="https://..."
				class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
			/>
		</div>

		<div>
			<label for="website" class="block text-sm font-medium text-gray-700 mb-1">
				Website <span class="text-red-500">*</span>
			</label>
			<select
				id="website"
				bind:value={formData.website}
				required
				class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
			>
				{#each websiteOptions as website}
					<option value={website}>{website.charAt(0).toUpperCase() + website.slice(1)}</option>
				{/each}
			</select>
		</div>

		<!-- Optional Fields -->
		<div>
			<label for="location" class="block text-sm font-medium text-gray-700 mb-1">Location</label>
			<input
				id="location"
				type="text"
				bind:value={formData.location}
				placeholder="City, State/Country"
				class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
			/>
		</div>

		<div>
			<label for="interestLevel" class="block text-sm font-medium text-gray-700 mb-1">Interest Level</label>
			<select
				id="interestLevel"
				bind:value={formData.interestLevel}
				class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
			>
				<option value={undefined}>Select interest level...</option>
				{#each interestLevelOptions as level}
					<option value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
				{/each}
			</select>
		</div>

		<div>
			<label for="tags" class="block text-sm font-medium text-gray-700 mb-1">Tags</label>
			<div class="flex gap-2 mb-2">
				<input
					id="tags"
					type="text"
					bind:value={tagInput}
					onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
					placeholder="Add a tag and press Enter"
					class="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				/>
				<button
					type="button"
					onclick={addTag}
					class="rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200 transition-colors"
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
			<label for="notes" class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
			<textarea
				id="notes"
				bind:value={formData.notes}
				rows="4"
				placeholder="Any additional notes about this application..."
				class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
			></textarea>
		</div>

		<!-- Submit Buttons -->
		<div class="flex gap-4">
			<button
				type="submit"
				disabled={loading}
				class="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				{loading ? 'Creating...' : 'Create Application'}
			</button>
			<button
				type="button"
				onclick={() => goto('/job-applications')}
				class="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
			>
				Cancel
			</button>
		</div>
	</form>
</div>

