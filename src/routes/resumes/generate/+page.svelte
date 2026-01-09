<script lang="ts">
	import { resumesApi } from '$lib/api/resumes';
	import ResumeGenerationProgress from '$lib/components/ResumeGenerationProgress.svelte';

	let jobDescription = '';
	let title = 'AI Generated Resume';
	let isGenerating = false;
	let generationJobId: string | null = null;
	let error: string | null = null;
	let downloadUrl: string | null = null;

	async function handleGenerate() {
		if (!jobDescription.trim()) {
			error = 'Please provide a job description';
			return;
		}

		isGenerating = true;
		error = null;
		downloadUrl = null;

		try {
			const response = await resumesApi.generate({
				jobDescription: jobDescription.trim(),
				title: title.trim() || 'AI Generated Resume'
			});

			generationJobId = response.jobId;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to start resume generation';
			isGenerating = false;
		}
	}

	function handleComplete(url: string) {
		downloadUrl = url;
		isGenerating = false;
	}

	function handleError(errorMsg: string) {
		error = errorMsg;
		isGenerating = false;
		generationJobId = null;
	}

	function startNew() {
		generationJobId = null;
		downloadUrl = null;
		error = null;
		jobDescription = '';
		title = 'AI Generated Resume';
	}
</script>

<div class="container">
	<div class="header">
		<h1>Generate AI-Powered Resume</h1>
		<p class="subtitle">
			Paste a job description and we'll create a tailored resume using your profile data,
			technical writings, projects, and work experience.
		</p>
	</div>

	{#if !generationJobId}
		<form on:submit|preventDefault={handleGenerate} class="generation-form">
			<div class="form-group">
				<label for="title">Resume Title</label>
				<input
					id="title"
					type="text"
					bind:value={title}
					placeholder="e.g., Senior Backend Engineer Resume"
					class="input"
				/>
			</div>

			<div class="form-group">
				<label for="jobDescription">Job Description *</label>
				<textarea
					id="jobDescription"
					bind:value={jobDescription}
					placeholder="Paste the full job description here..."
					rows="12"
					class="textarea"
					required
				/>
				<p class="hint">
					Include the job title, requirements, responsibilities, and qualifications for best results.
				</p>
			</div>

			{#if error}
				<div class="error-alert">
					{error}
				</div>
			{/if}

			<button type="submit" class="btn-generate" disabled={isGenerating}>
				{isGenerating ? 'Starting...' : 'Generate Resume'}
			</button>
		</form>
	{:else}
		<ResumeGenerationProgress
			jobId={generationJobId}
			onComplete={handleComplete}
			onError={handleError}
		/>

		{#if downloadUrl}
			<div class="success-actions">
				<a href={downloadUrl} download class="btn-download">
					Download Resume
				</a>
				<button on:click={startNew} class="btn-secondary">
					Generate Another
				</button>
			</div>
		{/if}
	{/if}
</div>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 32px 16px;
	}

	.header {
		text-align: center;
		margin-bottom: 48px;
	}

	.header h1 {
		font-size: 32px;
		font-weight: 700;
		color: #1a1a1a;
		margin: 0 0 12px 0;
	}

	.subtitle {
		font-size: 16px;
		color: #666;
		line-height: 1.6;
		max-width: 600px;
		margin: 0 auto;
	}

	.generation-form {
		background: white;
		border-radius: 12px;
		padding: 32px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.form-group {
		margin-bottom: 24px;
	}

	.form-group label {
		display: block;
		font-size: 14px;
		font-weight: 600;
		color: #333;
		margin-bottom: 8px;
	}

	.input,
	.textarea {
		width: 100%;
		padding: 12px;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 15px;
		font-family: inherit;
		transition: border-color 0.2s;
	}

	.input:focus,
	.textarea:focus {
		outline: none;
		border-color: #0066cc;
		box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
	}

	.textarea {
		resize: vertical;
		min-height: 200px;
	}

	.hint {
		font-size: 13px;
		color: #888;
		margin-top: 6px;
		margin-bottom: 0;
	}

	.error-alert {
		padding: 12px 16px;
		background: #fee;
		border: 1px solid #fcc;
		border-radius: 6px;
		color: #c33;
		font-size: 14px;
		margin-bottom: 20px;
	}

	.btn-generate {
		width: 100%;
		padding: 14px 24px;
		background: linear-gradient(135deg, #0066cc, #0052a3);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.btn-generate:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
	}

	.btn-generate:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.success-actions {
		display: flex;
		gap: 16px;
		justify-content: center;
		margin-top: 32px;
	}

	.btn-download {
		padding: 14px 32px;
		background: linear-gradient(135deg, #28a745, #218838);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.btn-download:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
	}

	.btn-secondary {
		padding: 14px 32px;
		background: white;
		color: #333;
		border: 2px solid #ddd;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-secondary:hover {
		border-color: #0066cc;
		color: #0066cc;
	}
</style>
