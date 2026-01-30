<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { resumesApi, type Resume } from '$lib/api/resumes';
	import { config } from '$lib/config';

	let resume: Resume | null = null;
	let loading = true;
	let error: string | null = null;
	let editing = false;
	let formData = {
		title: '',
		tags: [] as string[]
	};
	let tagInput = '';
	let isSaving = false;

	async function loadResume() {
		loading = true;
		error = null;
		try {
			const id = $page.params.id;
			if (!id) {
				error = 'Resume ID is required';
				loading = false;
				return;
			}
			resume = await resumesApi.get(id);
			formData = {
				title: resume.title,
				tags: resume.tags || []
			};
		} catch (err: any) {
			error = err.response?.data?.message || err.message || 'Failed to load resume';
			console.error('Error loading resume:', err);
		} finally {
			loading = false;
		}
	}

	function addTag() {
		if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
			formData.tags = [...formData.tags, tagInput.trim()];
			tagInput = '';
		}
	}

	function removeTag(tag: string) {
		formData.tags = formData.tags.filter(t => t !== tag);
	}

	async function handleSave() {
		if (!resume || !formData.title.trim()) {
			error = 'Title is required';
			return;
		}

		isSaving = true;
		error = null;

		try {
			resume = await resumesApi.update(resume.id, {
				title: formData.title.trim(),
				tags: formData.tags
			});
			editing = false;
		} catch (err: any) {
			error = err.response?.data?.message || err.message || 'Failed to update resume';
			console.error('Error updating resume:', err);
		} finally {
			isSaving = false;
		}
	}

	async function handleDelete() {
		if (!resume || !confirm('Are you sure you want to delete this resume?')) return;

		try {
			await resumesApi.delete(resume.id);
			goto('/resumes');
		} catch (err: any) {
			error = err.response?.data?.message || err.message || 'Failed to delete resume';
			console.error('Error deleting resume:', err);
		}
	}

	async function handleSetAsMain() {
		if (!resume) return;
		if (!confirm('Set this resume as your main resume? This will be used by default for new applications.')) return;
		
		try {
			resume = await resumesApi.setAsMain(resume.id);
		} catch (err: any) {
			error = err.response?.data?.message || err.message || 'Failed to set as main';
		}
	}

	async function handleSetAsFeatured() {
		if (!resume) return;
		if (!confirm('Mark this resume as featured? It will be highlighted in your resume list.')) return;
		
		try {
			resume = await resumesApi.setAsFeatured(resume.id);
		} catch (err: any) {
			error = err.response?.data?.message || err.message || 'Failed to set as featured';
		}
	}

	function formatDate(dateString?: string | null): string {
		if (!dateString) return '-';
		try {
			return new Date(dateString).toLocaleDateString();
		} catch {
			return dateString;
		}
	}

	onMount(() => {
		loadResume();
	});
</script>

<div class="container mx-auto max-w-3xl px-4 py-8">
	<div class="mb-6">
		<button
			on:click={() => goto('/resumes')}
			class="text-blue-600 hover:text-blue-700 mb-4"
		>
			← Back to Resumes
		</button>
	</div>

	{#if error}
		<div class="mb-4 rounded-lg bg-red-50 p-4 text-red-800">{error}</div>
	{/if}

	{#if loading}
		<div class="text-center py-12">
			<div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
			<p class="mt-4 text-gray-600">Loading resume...</p>
		</div>
	{:else if resume}
		<div class="space-y-6">
			<!-- Header -->
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<div class="flex items-start justify-between mb-4">
					<div class="flex-1">
						<h1 class="text-3xl font-bold text-gray-900">{resume.title}</h1>
						<p class="mt-2 text-sm text-gray-500">ID: {resume.id}</p>
					</div>
					<div class="flex gap-2 flex-wrap justify-end">
						{#if resume.isMain}
							<span class="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
								⭐ Main Resume
							</span>
						{/if}
						{#if resume.isFeatured}
							<span class="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800">
								✨ Featured
							</span>
						{/if}
					</div>
				</div>

				{#if !editing}
					<div class="flex gap-2 flex-wrap">
						<button
							on:click={() => (editing = true)}
							class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
						>
							✏️ Edit
						</button>
						{#if !resume.isMain}
							<button
								on:click={handleSetAsMain}
								class="rounded-lg border border-yellow-300 px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 transition-colors"
							>
								⭐ Set as Main
							</button>
						{/if}
						{#if !resume.isFeatured}
							<button
								on:click={handleSetAsFeatured}
								class="rounded-lg border border-purple-300 px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
							>
								✨ Set as Featured
							</button>
						{/if}
						<a
							href={`${config.jobsApiUrl}/resumes/${resume.id}/download`}
							download
							class="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 transition-colors inline-block"
						>
							📥 Download
						</a>
						<button
							on:click={handleDelete}
							class="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 transition-colors"
						>
							🗑️ Delete
						</button>
					</div>
				{/if}
			</div>

			<!-- Edit Form -->
			{#if editing}
				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
					<h2 class="mb-4 text-xl font-semibold text-gray-900">Edit Resume</h2>
					<div class="space-y-4">
						<div>
							<label for="title" class="block text-sm font-medium text-gray-700 mb-1">
								Title
							</label>
							<input
								id="title"
								type="text"
								bind:value={formData.title}
								class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								placeholder="e.g., Senior Backend Developer Resume"
							/>
						</div>

						<div>
							<label for="tags" class="block text-sm font-medium text-gray-700 mb-1">
								Tags
							</label>
							<div class="flex gap-2 mb-2">
								<input
									id="tags"
									type="text"
									bind:value={tagInput}
									on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
									class="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
									placeholder="Add a tag and press Enter"
								/>
								<button
									on:click={addTag}
									class="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 transition-colors"
								>
									Add Tag
								</button>
							</div>

							{#if formData.tags.length > 0}
								<div class="flex flex-wrap gap-2 mb-3">
									{#each formData.tags as tag}
										<div class="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1">
											<span class="text-sm text-blue-900">{tag}</span>
											<button
												on:click={() => removeTag(tag)}
												class="text-blue-600 hover:text-blue-800 font-bold"
												title="Remove tag"
											>
												×
											</button>
										</div>
									{/each}
								</div>
							{/if}
						</div>

						<div class="flex gap-2 justify-end">
							<button
								on:click={() => (editing = false)}
								class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
							>
								Cancel
							</button>
							<button
								on:click={handleSave}
								disabled={isSaving}
								class="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
							>
								{isSaving ? '💾 Saving...' : '💾 Save Changes'}
							</button>
						</div>
					</div>
				</div>
			{/if}

			<!-- Resume Info -->
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
					<h2 class="mb-4 text-lg font-semibold text-gray-900">Resume Info</h2>
					<dl class="space-y-3">
						<div>
							<dt class="text-sm font-medium text-gray-500">File Name</dt>
							<dd class="mt-1 text-gray-900 break-all">{resume.fileName}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500">File Size</dt>
							<dd class="mt-1 text-gray-900">
								{#if resume.fileSize}
									{(resume.fileSize / 1024).toFixed(2)} KB
								{:else}
									-
								{/if}
							</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500">Created</dt>
							<dd class="mt-1 text-gray-900">{formatDate(resume.createdAt)}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500">Updated</dt>
							<dd class="mt-1 text-gray-900">{formatDate(resume.updatedAt)}</dd>
						</div>
					</dl>
				</div>

				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
					<h2 class="mb-4 text-lg font-semibold text-gray-900">Status</h2>
					<dl class="space-y-3">
						<div>
							<dt class="text-sm font-medium text-gray-500">Main Resume</dt>
							<dd class="mt-1 text-gray-900">{resume.isMain ? '✓ Yes' : 'No'}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500">Featured</dt>
							<dd class="mt-1 text-gray-900">{resume.isFeatured ? '✓ Yes' : 'No'}</dd>
						</div>
						{#if resume.metrics}
							<div>
								<dt class="text-sm font-medium text-gray-500">Metrics</dt>
								<dd class="mt-1 text-gray-900">Calculated</dd>
							</div>
						{/if}
					</dl>
				</div>
			</div>

			<!-- Tags Display -->
			{#if formData.tags.length > 0}
				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
					<h2 class="mb-4 text-lg font-semibold text-gray-900">Tags</h2>
					<div class="flex flex-wrap gap-2">
						{#each formData.tags as tag}
							<span class="rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700">
								{tag}
							</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Actions -->
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
				<div class="flex gap-2 flex-wrap">
					<a
						href={`${config.jobsApiUrl}/resumes/${resume.id}/download`}
						download
						class="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 transition-colors inline-block"
					>
						📥 Download Resume
					</a>
					{#if !resume.isMain}
						<button
							on:click={handleSetAsMain}
							class="rounded-lg border border-yellow-300 px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 transition-colors"
						>
							⭐ Set as Main
						</button>
					{/if}
					{#if !resume.isFeatured}
						<button
							on:click={handleSetAsFeatured}
							class="rounded-lg border border-purple-300 px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
						>
							✨ Set as Featured
						</button>
					{/if}
					<a
						href="/resumes"
						class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors inline-block"
					>
						← Back to Resumes
					</a>
				</div>
			</div>
		</div>
	{/if}
</div>
