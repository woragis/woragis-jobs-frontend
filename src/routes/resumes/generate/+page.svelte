<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { resumesApi } from '$lib/api/resumes';
	import { jobApplicationsApi } from '$lib/api/job-applications';
	import type { JobApplication } from '$lib/api/job-applications';
	import ResumeGenerationProgress from '$lib/components/ResumeGenerationProgress.svelte';

	let jobApplicationId: string | null = null;
	let jobApplication: JobApplication | null = null;
	let jobApplications: JobApplication[] = [];
	let customMode = false;
	let jobDescription = '';
	let isLoadingApps = true;
	let isGenerating = false;
	let generationJobId: string | null = null;
	let error: string | null = null;
	let resumeId: string | null = null;
	let language = 'english';

	$: jobApplicationId = $page.url.searchParams.get('jobApplicationId');

	onMount(async () => {
		if (jobApplicationId) {
			// Load specific job application
			try {
				jobApplication = await jobApplicationsApi.get(jobApplicationId);
				language = jobApplication.language || 'en';
			} catch (err) {
				error = err instanceof Error ? err.message : 'Failed to load job application';
			}
		} else {
			// Load all job applications for selection
			try {
				const response = await jobApplicationsApi.list({ limit: 100 });
				jobApplications = response.applications || [];
			} catch (err) {
				error = err instanceof Error ? err.message : 'Failed to load job applications';
			} finally {
				isLoadingApps = false;
			}
		}
	});

	async function handleGenerate() {
		// allow either jobApplicationId or jobDescription
		if (!jobApplicationId && jobDescription.trim() === '') {
			error = 'Please select a job application or provide a job description / instructions';
			return;
		}

		// enforce a minimum length for custom instructions to avoid empty/too-short prompts
		if (!jobApplicationId && jobDescription.trim().length < 10) {
			error = 'Please provide a more detailed job description or instructions (at least 10 characters)';
			return;
		}

		isGenerating = true;
		error = null;
		resumeId = null;

		try {
			const payload: any = { language };
			if (jobApplicationId) payload.jobApplicationId = jobApplicationId;
			if (!jobApplicationId && jobDescription.trim() !== '') payload.jobDescription = jobDescription.trim();

			const response = await resumesApi.generate(payload);

			generationJobId = response.jobId;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to start resume generation';
			isGenerating = false;
		}
	}

	function handleComplete(generatedResumeId: string) {
		resumeId = generatedResumeId;
		isGenerating = false;
	}

	function handleError(errorMsg: string) {
		error = errorMsg;
		isGenerating = false;
		generationJobId = null;
	}

	function startNew() {
		goto('/resumes/generate');
		generationJobId = null;
		resumeId = null;
		error = null;
		jobApplication = null;
		jobApplicationId = null;
	}

	function selectJobApplication(id: string) {
		goto(`/resumes/generate?jobApplicationId=${id}`);
	}
</script>

<div class="container">
	<div class="header">
		<h1>Generate AI-Powered Resume</h1>
		<p class="subtitle">
			Select a job application and we'll create a tailored resume using AI to analyze the job requirements
			and match them with your profile, projects, and experience.
		</p>
	</div>

	{#if !generationJobId && !jobApplicationId && !isLoadingApps}
		<!-- Job Application Selection -->
		<div class="selection-container">
			<h2>Select a Job Application</h2>
			{#if jobApplications.length === 0}
				<div class="empty-state">
					<p>No job applications found. Create a job application first to generate a resume.</p>
					<a href="/job-applications/new" class="btn-primary">
						Create Job Application
					</a>
				</div>
			{:else}
				<div class="applications-grid">
					{#each jobApplications as app}
						<button 
							class="application-card" 
							on:click={() => selectJobApplication(app.id)}
						>
							<div class="card-header">
								<h3>{app.jobTitle}</h3>
								<span class="company">{app.companyName}</span>
							</div>
							{#if app.location}
								<p class="location">📍 {app.location}</p>
							{/if}
							<div class="card-footer">
								<span class="status status-{app.status}">{app.status}</span>
								{#if app.appliedAt}
									<span class="date">Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
								{/if}
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{:else if !generationJobId && jobApplication}
		<!-- Generation Confirmation -->
		<form on:submit|preventDefault={handleGenerate} class="generation-form">
			<div class="job-info">
				<h2>Generate Resume For:</h2>
				<div class="job-details">
					<h3>{jobApplication.jobTitle}</h3>
					<p class="company">{jobApplication.companyName}</p>
					{#if jobApplication.location}
						<p class="location">📍 {jobApplication.location}</p>
					{/if}
					{#if jobApplication.jobUrl}
						<a href={jobApplication.jobUrl} target="_blank" rel="noopener noreferrer" class="job-link">
							View Job Posting →
						</a>
					{/if}
				</div>
			</div>

			<div class="form-group">
				<label for="language">Resume Language</label>
				<select id="language" bind:value={language} class="select">
					<option value="english">English</option>
					<option value="spanish">Spanish</option>
					<option value="french">French</option>
					<option value="german">German</option>
					<option value="portuguese">Portuguese</option>
				</select>
			</div>

			{#if !jobApplicationId}
				<div class="form-group">
					<label for="jobDescription">Job Description / Instructions (optional)</label>
					<textarea id="jobDescription" bind:value={jobDescription} rows="6" class="textarea" placeholder="For example: 'Startup company, highlight GraphQL projects and leadership experience; emphasize team management and API design.'"></textarea>
					<p class="hint">Provide job description or specific instructions to tailor the resume (e.g., highlight GraphQL projects, leadership, or company type).</p>
					<div class="examples">
						<strong>Examples:</strong>
						<ul>
							<li>"Startup company — emphasize product impact and cross-functional work."</li>
							<li>"GraphQL & API-focused role — highlight projects using GraphQL and backend APIs."</li>
							<li>"Manager role — state that I managed teams and list leadership responsibilities."</li>
						</ul>
					</div>
				</div>
			{/if}

			{#if error}
				<div class="error-alert">
					{error}
				</div>
			{/if}

			<div class="button-group">
				<button type="button" on:click={startNew} class="btn-secondary">
					Choose Different Application
				</button>
				<button type="submit" class="btn-generate" disabled={isGenerating}>
					{isGenerating ? 'Starting...' : 'Generate Resume with AI'}
				</button>
			</div>
		</form>
	{:else if generationJobId}
		<!-- Progress Tracking -->
		<ResumeGenerationProgress
			jobId={generationJobId}
			onComplete={handleComplete}
			onError={handleError}
		/>

		{#if resumeId}
			<div class="success-actions">
				<a href={`/api/v1/resumes/${resumeId}/download`} download class="btn-download">
					Download Resume
				</a>
				<a href="/resumes" class="btn-secondary">
					View All Resumes
				</a>
				<button on:click={startNew} class="btn-secondary">
					Generate Another
				</button>
			</div>
		{/if}
	{:else if isLoadingApps}
		<div class="loading">Loading job applications...</div>
	{/if}
</div>

<style>
	.container {
		max-width: 900px;
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
		max-width: 700px;
		margin: 0 auto;
	}

	.loading {
		text-align: center;
		padding: 48px;
		color: #666;
		font-size: 16px;
	}

	/* Job Application Selection */
	.selection-container {
		background: white;
		border-radius: 12px;
		padding: 32px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.selection-container h2 {
		font-size: 24px;
		font-weight: 600;
		margin: 0 0 24px 0;
		color: #1a1a1a;
	}

	.applications-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 16px;
	}

	.application-card {
		background: white;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		padding: 20px;
		text-align: left;
		cursor: pointer;
		transition: all 0.2s;
		width: 100%;
	}

	.application-card:hover {
		border-color: #0066cc;
		box-shadow: 0 4px 12px rgba(0, 102, 204, 0.15);
		transform: translateY(-2px);
	}

	.card-header h3 {
		font-size: 18px;
		font-weight: 600;
		margin: 0 0 8px 0;
		color: #1a1a1a;
	}

	.company {
		font-size: 14px;
		color: #666;
		font-weight: 500;
	}

	.location {
		font-size: 14px;
		color: #888;
		margin: 8px 0;
	}

	.card-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 16px;
		padding-top: 16px;
		border-top: 1px solid #f0f0f0;
	}

	.status {
		padding: 4px 12px;
		border-radius: 12px;
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
	}

	.status-applied {
		background: #e3f2fd;
		color: #1976d2;
	}

	.status-interviewing {
		background: #fff3e0;
		color: #f57c00;
	}

	.status-offered {
		background: #e8f5e9;
		color: #388e3c;
	}

	.status-rejected {
		background: #ffebee;
		color: #d32f2f;
	}

	.date {
		font-size: 12px;
		color: #999;
	}

	.empty-state {
		text-align: center;
		padding: 48px;
	}

	.empty-state p {
		color: #666;
		margin-bottom: 24px;
	}

	/* Generation Form */
	.generation-form {
		background: white;
		border-radius: 12px;
		padding: 32px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.job-info h2 {
		font-size: 20px;
		font-weight: 600;
		margin: 0 0 16px 0;
		color: #333;
	}

	.job-details {
		background: #f8f9fa;
		border-radius: 8px;
		padding: 20px;
		margin-bottom: 24px;
	}

	.job-details h3 {
		font-size: 22px;
		font-weight: 600;
		margin: 0 0 8px 0;
		color: #1a1a1a;
	}

	.job-details .company {
		font-size: 16px;
		color: #0066cc;
		font-weight: 500;
		margin-bottom: 8px;
	}

	.job-link {
		display: inline-block;
		color: #0066cc;
		text-decoration: none;
		font-size: 14px;
		margin-top: 12px;
	}

	.job-link:hover {
		text-decoration: underline;
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

	.select {
		width: 100%;
		padding: 12px;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 15px;
		font-family: inherit;
		background: white;
		cursor: pointer;
	}

	.select:focus {
		outline: none;
		border-color: #0066cc;
		box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
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

	.button-group {
		display: flex;
		gap: 12px;
		justify-content: flex-end;
	}

	.btn-primary,
	.btn-generate {
		padding: 14px 24px;
		background: linear-gradient(135deg, #0066cc, #0052a3);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
		text-decoration: none;
		display: inline-block;
	}

	.btn-generate {
		flex: 1;
	}

	.btn-primary:hover,
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
		flex-wrap: wrap;
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
		padding: 14px 24px;
		background: white;
		color: #333;
		border: 2px solid #ddd;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		text-decoration: none;
		display: inline-block;
	}

	.btn-secondary:hover {
		border-color: #0066cc;
		color: #0066cc;
	}
</style>
