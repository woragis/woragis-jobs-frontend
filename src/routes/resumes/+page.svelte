<script lang="ts">
	import { resumesApi, type Resume } from '$lib/api/resumes';
	import { onMount } from 'svelte';
	import { config } from '$lib/config';

	let resumes: Resume[] = [];
	let isLoading = true;
	let error: string | null = null;
	let isCreating = false;
	let selectedFile: File | null = null;
	let title = '';
	let tags = '';

	onMount(async () => {
		// Ensure CSRF token header is set by backend middleware for subsequent uploads
		try {
			await fetch(`${config.jobsApiUrl}/csrf-token`, {
				method: 'GET',
				credentials: 'include',
			});
		} catch (err: any) {
			console.debug('CSRF token fetch completed (may have errors, but token should be set)');
		}

		await loadResumes();
	});

	async function loadResumes() {
		isLoading = true;
		error = null;
		try {
			const response = await resumesApi.list({ limit: 50 });
			resumes = response.resumes;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load resumes';
		} finally {
			isLoading = false;
		}
	}

	async function handleCreateResume() {
		if (!selectedFile || !title.trim()) {
			error = 'Please select a file and enter a title';
			return;
		}

		isCreating = true;
		error = null;

		try {
			const tagArray = tags
				.split(',')
				.map((t) => t.trim())
				.filter((t) => t.length > 0);

			const resume = await resumesApi.create({
				title,
				file: selectedFile,
				tags: tagArray,
			});

			resumes = [...resumes, resume];
			selectedFile = null;
			title = '';
			tags = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create resume';
		} finally {
			isCreating = false;
		}
	}

	async function handleSetAsMain(id: string) {
		try {
			const updated = await resumesApi.setAsMain(id);
			resumes = resumes.map((r) => ({
				...r,
				isMain: r.id === id ? true : false,
			}));
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to set resume as main';
		}
	}

	async function handleDelete(id: string) {
		if (!confirm('Are you sure you want to delete this resume?')) return;

		try {
			await resumesApi.delete(id);
			resumes = resumes.filter((r) => r.id !== id);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete resume';
		}
	}

	async function handleDownload(id: string, fileName: string) {
		try {
			const blob = await resumesApi.download(id);
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = fileName;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to download resume';
		}
	}
</script>

<div class="resumes-container">
	<h1>My Resumes</h1>

	{#if error}
		<div class="alert alert-error">
			<p>{error}</p>
		</div>
	{/if}

	<div class="create-form">
		<h2>Upload New Resume</h2>
		<div class="form-group">
			<label for="title">Resume Title</label>
			<input
				id="title"
				type="text"
				placeholder="e.g., Software Engineer 2024"
				bind:value={title}
				disabled={isCreating}
			/>
		</div>

		<div class="form-group">
			<label for="file">Resume File (PDF)</label>
			<input
				id="file"
				type="file"
				accept=".pdf"
				on:change={(e) => {
					selectedFile = e.currentTarget.files?.[0] || null;
				}}
				disabled={isCreating}
			/>
		</div>

		<div class="form-group">
			<label for="tags">Tags (comma-separated)</label>
			<input
				id="tags"
				type="text"
				placeholder="e.g., full-stack, react, typescript"
				bind:value={tags}
				disabled={isCreating}
			/>
		</div>

		<button on:click={handleCreateResume} disabled={isCreating || !selectedFile || !title}>
			{isCreating ? 'Uploading...' : 'Upload Resume'}
		</button>
	</div>

	{#if isLoading}
		<div class="loading">Loading resumes...</div>
	{:else if resumes.length === 0}
		<div class="empty-state">No resumes yet. Create one above to get started.</div>
	{:else}
		<div class="resumes-list">
			<h2>Your Resumes ({resumes.length})</h2>
			{#each resumes as resume (resume.id)}
				<div class="resume-card">
					<div class="resume-header">
						<h3>{resume.title}</h3>
						{#if resume.isMain}
							<span class="badge badge-primary">Main</span>
						{/if}
						{#if resume.isFeatured}
							<span class="badge badge-secondary">Featured</span>
						{/if}
					</div>

					<div class="resume-info">
						<p><strong>File:</strong> {resume.fileName}</p>
						<p><strong>Size:</strong> {(resume.fileSize / 1024).toFixed(2)} KB</p>
						<p><strong>Created:</strong> {new Date(resume.createdAt).toLocaleDateString()}</p>
						{#if resume.tags.length > 0}
							<div class="tags">
								{#each resume.tags as tag}
									<span class="tag">{tag}</span>
								{/each}
							</div>
						{/if}
					</div>

					<div class="resume-actions">
						<button
							class="btn-small btn-primary"
							on:click={() => handleSetAsMain(resume.id)}
							disabled={resume.isMain}
						>
							{resume.isMain ? 'Main Resume' : 'Set as Main'}
						</button>
						<button
							class="btn-small btn-secondary"
							on:click={() => handleDownload(resume.id, resume.fileName)}
						>
							Download
						</button>
						<button class="btn-small btn-danger" on:click={() => handleDelete(resume.id)}>
							Delete
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.resumes-container {
		max-width: 1000px;
		margin: 0 auto;
		padding: 2rem;
	}

	h1 {
		font-size: 2rem;
		margin-bottom: 2rem;
		color: #333;
	}

	h2 {
		font-size: 1.5rem;
		margin-bottom: 1.5rem;
		color: #555;
	}

	.alert {
		padding: 1rem;
		border-radius: 4px;
		margin-bottom: 2rem;
	}

	.alert-error {
		background-color: #fee;
		border: 1px solid #fcc;
		color: #c33;
	}

	.create-form {
		background: #f5f5f5;
		padding: 2rem;
		border-radius: 8px;
		margin-bottom: 3rem;
		border: 1px solid #ddd;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #333;
	}

	.form-group input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 1rem;
		font-family: inherit;
	}

	.form-group input:disabled {
		background-color: #eee;
		cursor: not-allowed;
	}

	button {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
		font-weight: 600;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	button:not(:disabled):hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.loading,
	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: #666;
		font-size: 1.1rem;
	}

	.resumes-list {
		margin-top: 3rem;
	}

	.resume-card {
		background: white;
		border: 1px solid #ddd;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		transition: all 0.2s;
	}

	.resume-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.resume-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.resume-header h3 {
		margin: 0;
		font-size: 1.25rem;
		color: #333;
	}

	.badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.85rem;
		font-weight: 600;
	}

	.badge-primary {
		background-color: #def;
		color: #059;
	}

	.badge-secondary {
		background-color: #fef;
		color: #905;
	}

	.resume-info {
		margin-bottom: 1rem;
		color: #666;
	}

	.resume-info p {
		margin: 0.5rem 0;
	}

	.tags {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-top: 0.75rem;
	}

	.tag {
		display: inline-block;
		background-color: #eee;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.85rem;
		color: #555;
	}

	.resume-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.btn-small {
		padding: 0.5rem 1rem;
		font-size: 0.9rem;
	}

	.btn-primary {
		background-color: #007bff;
		color: white;
	}

	.btn-secondary {
		background-color: #6c757d;
		color: white;
	}

	.btn-danger {
		background-color: #dc3545;
		color: white;
	}

	@media (max-width: 768px) {
		.resumes-container {
			padding: 1rem;
		}

		.create-form {
			padding: 1rem;
		}

		.resume-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.resume-actions {
			flex-direction: column;
		}

		.btn-small {
			width: 100%;
		}
	}
</style>
