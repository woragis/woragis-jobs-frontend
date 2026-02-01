<script lang="ts">
	import { resumesApi, type Resume } from '$lib/api/resumes';
	import { onMount } from 'svelte';
	import { config } from '$lib/config';
	import JSZip from 'jszip';

	let resumes: Resume[] = [];
	let isLoading = true;
	let error: string | null = null;
	let isCreating = false;
	let selectedFile: File | null = null;
	let title = '';
	let tags = '';
	let selectedResumes = new Set<string>();
	let isDownloadingBatch = false;
	let showComparisonModal = false;

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

	function toggleResumeSelection(id: string) {
		if (selectedResumes.has(id)) {
			selectedResumes.delete(id);
		} else {
			selectedResumes.add(id);
		}
		selectedResumes = selectedResumes; // Trigger reactivity
	}

	function selectAllResumes() {
		selectedResumes = new Set(resumes.map((r) => r.id));
	}

	function deselectAllResumes() {
		selectedResumes = new Set();
	}

	async function handleBatchDownloadZip() {
		if (selectedResumes.size === 0) {
			error = 'Please select at least one resume';
			return;
		}

		isDownloadingBatch = true;
		error = null;

		try {
			const zip = new JSZip();
			const selectedResumeList = resumes.filter((r) => selectedResumes.has(r.id));

			for (const resume of selectedResumeList) {
				try {
					const blob = await resumesApi.download(resume.id);
					zip.file(resume.fileName, blob);
				} catch (err) {
					console.error(`Failed to download ${resume.fileName}:`, err);
				}
			}

			const zipBlob = await zip.generateAsync({ type: 'blob' });
			const url = window.URL.createObjectURL(zipBlob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `resumes-${new Date().toISOString().split('T')[0]}.zip`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);

			// Clear selection after successful download
			deselectAllResumes();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create ZIP file';
		} finally {
			isDownloadingBatch = false;
		}
	}

	async function handleBatchDownloadAll() {
		if (selectedResumes.size === 0) {
			error = 'Please select at least one resume';
			return;
		}

		isDownloadingBatch = true;
		error = null;

		try {
			const selectedResumeList = resumes.filter((r) => selectedResumes.has(r.id));

			for (const resume of selectedResumeList) {
				try {
					const blob = await resumesApi.download(resume.id);
					const url = window.URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;
					a.download = resume.fileName;
					document.body.appendChild(a);
					a.click();
					window.URL.revokeObjectURL(url);
					document.body.removeChild(a);

					// Add small delay between downloads
					await new Promise((resolve) => setTimeout(resolve, 200));
				} catch (err) {
					console.error(`Failed to download ${resume.fileName}:`, err);
				}
			}

			// Clear selection after successful downloads
			deselectAllResumes();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to download resumes';
		} finally {
			isDownloadingBatch = false;
		}
	}

	function openComparisonModal() {
		if (selectedResumes.size < 2) {
			error = 'Please select at least 2 resumes to compare';
			return;
		}
		showComparisonModal = true;
	}

	function closeComparisonModal() {
		showComparisonModal = false;
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
	<div class="header-section">
		<h1>My Resumes</h1>
		<a href="/resumes/generate" class="btn-generate-ai">
			✨ Generate with AI
		</a>
	</div>

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
			<div class="list-controls">
				<h2>Your Resumes ({resumes.length})</h2>
				{#if resumes.length > 0}
					<div class="batch-controls">
						<div class="selection-info">
							{#if selectedResumes.size > 0}
								<span class="badge badge-info">{selectedResumes.size} selected</span>
								<button class="btn-link" on:click={deselectAllResumes}>Deselect All</button>
							{:else}
								<button class="btn-link" on:click={selectAllResumes}>Select All</button>
							{/if}
						</div>
						{#if selectedResumes.size > 0}
							<div class="action-buttons">
								<button
									class="btn-small btn-primary"
									on:click={handleBatchDownloadZip}
									disabled={isDownloadingBatch}
								>
									📦 Download as ZIP
								</button>
								<button
									class="btn-small btn-secondary"
									on:click={handleBatchDownloadAll}
									disabled={isDownloadingBatch}
								>
									📥 Download All
								</button>
								{#if selectedResumes.size >= 2}
									<button
										class="btn-small btn-info"
										on:click={openComparisonModal}
										disabled={isDownloadingBatch}
									>
										👁️ Compare
									</button>
								{/if}
							</div>
						{/if}
					</div>
				{/if}
			</div>
			{#each resumes as resume (resume.id)}
				<div class="resume-card">
					<div class="resume-card-header">
						<input
							type="checkbox"
							checked={selectedResumes.has(resume.id)}
							on:change={() => toggleResumeSelection(resume.id)}
							class="resume-checkbox"
						/>
						<div class="resume-header">
							<h3>{resume.title}</h3>
							{#if resume.isMain}
								<span class="badge badge-primary">Main</span>
							{/if}
							{#if resume.isFeatured}
								<span class="badge badge-secondary">Featured</span>
							{/if}
						</div>
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
						<a
							href={`/resumes/${resume.id}`}
							class="btn-small btn-info"
						>
							ℹ️ Details
						</a>
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

	<!-- Comparison Modal -->
	{#if showComparisonModal}
		<div class="modal-overlay" on:click={closeComparisonModal}>
			<div class="modal-content" on:click|stopPropagation>
				<div class="modal-header">
					<h2>Resume Comparison</h2>
					<button class="modal-close" on:click={closeComparisonModal}>✕</button>
				</div>

				<div class="modal-body">
					<div class="comparison-list">
						{#each Array.from(selectedResumes) as resumeId}
							{@const resume = resumes.find((r) => r.id === resumeId)}
							{#if resume}
								<div class="comparison-item">
									<div class="item-header">
										<h4>{resume.title}</h4>
										{#if resume.isMain}
											<span class="badge badge-primary">Main</span>
										{/if}
									</div>
									<div class="item-details">
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
									<div class="item-actions">
										<a
											href={`/resumes/${resume.id}`}
											class="btn-small btn-info"
										>
											ℹ️ View
										</a>
										<button
											class="btn-small btn-secondary"
											on:click={() => {
												handleDownload(resume.id, resume.fileName);
											}}
										>
											📥 Download
										</button>
									</div>
								</div>
							{/if}
						{/each}
					</div>
				</div>

				<div class="modal-footer">
					<button class="btn-small btn-secondary" on:click={closeComparisonModal}>
						Close
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.resumes-container {
		max-width: 1000px;
		margin: 0 auto;
		padding: 2rem;
	}

	.header-section {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	h1 {
		font-size: 2rem;
		margin: 0;
		color: #333;
	}

	.btn-generate-ai {
		padding: 12px 24px;
		background: linear-gradient(135deg, #0066cc, #0052a3);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 15px;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.btn-generate-ai:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
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

	.btn-info {
		background-color: #17a2b8;
		color: white;
	}

	.btn-danger {
		background-color: #dc3545;
		color: white;
	}

	.btn-link {
		background: none;
		color: #007bff;
		border: none;
		padding: 0;
		cursor: pointer;
		text-decoration: underline;
		font-weight: 500;
		font-size: 0.95rem;
	}

	.btn-link:hover {
		color: #0056b3;
		text-decoration: underline;
	}

	.list-controls {
		margin-bottom: 2rem;
	}

	.batch-controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 2rem;
		padding: 1rem;
		background-color: #f8f9fa;
		border-radius: 8px;
		margin-top: 1rem;
	}

	.selection-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.badge-info {
		background-color: #cfe2ff;
		color: #084298;
	}

	.action-buttons {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.resume-card-header {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.resume-checkbox {
		margin-top: 0.25rem;
		width: 18px;
		height: 18px;
		cursor: pointer;
		accent-color: #007bff;
		flex-shrink: 0;
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

		.batch-controls {
			flex-direction: column;
			align-items: flex-start;
		}

		.action-buttons {
			width: 100%;
		}

		.action-buttons .btn-small {
			width: 100%;
		}
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
		max-width: 800px;
		width: 100%;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #eee;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
	}

	.modal-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #666;
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal-close:hover {
		background-color: #f5f5f5;
		border-radius: 4px;
	}

	.modal-body {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
	}

	.comparison-list {
		display: grid;
		gap: 1rem;
	}

	.comparison-item {
		border: 1px solid #ddd;
		border-radius: 8px;
		padding: 1.25rem;
		background: #fafafa;
		transition: all 0.2s;
	}

	.comparison-item:hover {
		background: white;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.item-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.item-header h4 {
		margin: 0;
		font-size: 1.1rem;
		color: #333;
	}

	.item-details {
		margin-bottom: 1rem;
		color: #666;
		font-size: 0.95rem;
	}

	.item-details p {
		margin: 0.35rem 0;
	}

	.item-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.modal-footer {
		padding: 1.5rem;
		border-top: 1px solid #eee;
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	@media (max-width: 768px) {
		.modal-content {
			max-width: 95%;
		}

		.item-actions {
			flex-direction: column;
		}

		.item-actions .btn-small {
			width: 100%;
		}
	}
</style>
