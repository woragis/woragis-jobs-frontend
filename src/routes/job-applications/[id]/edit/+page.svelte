<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { jobApplicationsApi, type JobApplication, type UpdateJobApplicationRequest, type InterestLevel } from '$lib/api/job-applications';
	import { goto } from '$app/navigation';
	import { config } from '$lib/config';

	let application: JobApplication | null = null;
	let formData: UpdateJobApplicationRequest = {
		salaryMin: undefined,
		salaryMax: undefined,
		salaryCurrency: '',
		jobDescription: '',
		coverLetter: '',
		deadline: undefined,
		interestLevel: undefined,
		notes: '',
		tags: [],
		followUpDate: undefined,
		responseReceivedAt: undefined,
		rejectionReason: '',
		nextInterviewDate: undefined,
		source: '',
		applicationMethod: '',
		language: ''
	};
	let loading = false;
	let initialLoading = true;
	let error: string | null = null;
	let tagInput = '';

	const interestLevelOptions: InterestLevel[] = ['low', 'medium', 'high', 'very-high'];
	const currencyOptions = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'BRL', 'INR', 'CNY', 'MXN'];

	// Fetch CSRF token on page load
	onMount(async () => {
		try {
			await fetch(`${config.jobsApiUrl}/csrf-token`, {
				method: 'GET',
				credentials: 'include',
			});
		} catch (err: any) {
			console.debug('CSRF token fetch completed (may have errors, but token should be set)');
		}
		await loadApplication();
	});

	async function loadApplication() {
		initialLoading = true;
		error = null;
		try {
			const id = $page.params.id;
			if (!id) {
				error = 'Application ID is required';
				initialLoading = false;
				return;
			}
			application = await jobApplicationsApi.get(id);
			
			// Populate form with existing data
			formData = {
				salaryMin: application.salaryMin ?? undefined,
				salaryMax: application.salaryMax ?? undefined,
				salaryCurrency: application.salaryCurrency || '',
				jobDescription: application.jobDescription || '',
				coverLetter: application.coverLetter || '',
				deadline: application.deadline ? application.deadline.split('T')[0] : undefined,
				interestLevel: application.interestLevel,
				notes: application.notes || '',
				tags: application.tags || [],
				followUpDate: application.followUpDate ? application.followUpDate.split('T')[0] : undefined,
				responseReceivedAt: application.responseReceivedAt ? application.responseReceivedAt.split('T')[0] : undefined,
				rejectionReason: application.rejectionReason || '',
				nextInterviewDate: application.nextInterviewDate ? application.nextInterviewDate.split('T')[0] : undefined,
				source: application.source || '',
				applicationMethod: application.applicationMethod || '',
				language: application.language || ''
			};
		} catch (err: any) {
			error = err.response?.data?.message || err.message || 'Failed to load job application';
			console.error('Error loading application:', err);
		} finally {
			initialLoading = false;
		}
	}

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
		if (!application) return;

		loading = true;
		error = null;

		try {
			// Clean up the form data - remove empty strings and undefined values
			const cleanedData: UpdateJobApplicationRequest = {};
			
			if (formData.salaryMin !== undefined && formData.salaryMin !== null) cleanedData.salaryMin = formData.salaryMin;
			if (formData.salaryMax !== undefined && formData.salaryMax !== null) cleanedData.salaryMax = formData.salaryMax;
			if (formData.salaryCurrency) cleanedData.salaryCurrency = formData.salaryCurrency;
			if (formData.jobDescription) cleanedData.jobDescription = formData.jobDescription;
			if (formData.coverLetter) cleanedData.coverLetter = formData.coverLetter;
			if (formData.deadline) cleanedData.deadline = formData.deadline;
			if (formData.interestLevel) cleanedData.interestLevel = formData.interestLevel;
			if (formData.notes) cleanedData.notes = formData.notes;
			if (formData.tags && formData.tags.length > 0) cleanedData.tags = formData.tags;
			if (formData.followUpDate) cleanedData.followUpDate = formData.followUpDate;
			if (formData.responseReceivedAt) cleanedData.responseReceivedAt = formData.responseReceivedAt;
			if (formData.rejectionReason) cleanedData.rejectionReason = formData.rejectionReason;
			if (formData.nextInterviewDate) cleanedData.nextInterviewDate = formData.nextInterviewDate;
			if (formData.source) cleanedData.source = formData.source;
			if (formData.applicationMethod) cleanedData.applicationMethod = formData.applicationMethod;
			if (formData.language) cleanedData.language = formData.language;

			await jobApplicationsApi.update(application.id, cleanedData);
			goto(`/job-applications/${application.id}`);
		} catch (err: any) {
			if (err.response?.status === 403) {
				const errorMsg = err.response?.data?.error;
				if (errorMsg && (errorMsg.includes('CSRF') || errorMsg.includes('csrf'))) {
					console.debug('CSRF token expired or invalid, fetching new token and retrying...');
					try {
						await fetch(`${config.jobsApiUrl}/csrf-token`, {
							method: 'GET',
							credentials: 'include',
						});
						const cleanedData: UpdateJobApplicationRequest = {};
						if (formData.salaryMin !== undefined && formData.salaryMin !== null) cleanedData.salaryMin = formData.salaryMin;
						if (formData.salaryMax !== undefined && formData.salaryMax !== null) cleanedData.salaryMax = formData.salaryMax;
						if (formData.salaryCurrency) cleanedData.salaryCurrency = formData.salaryCurrency;
						if (formData.jobDescription) cleanedData.jobDescription = formData.jobDescription;
						if (formData.coverLetter) cleanedData.coverLetter = formData.coverLetter;
						if (formData.deadline) cleanedData.deadline = formData.deadline;
						if (formData.interestLevel) cleanedData.interestLevel = formData.interestLevel;
						if (formData.notes) cleanedData.notes = formData.notes;
						if (formData.tags && formData.tags.length > 0) cleanedData.tags = formData.tags;
						if (formData.followUpDate) cleanedData.followUpDate = formData.followUpDate;
						if (formData.responseReceivedAt) cleanedData.responseReceivedAt = formData.responseReceivedAt;
						if (formData.rejectionReason) cleanedData.rejectionReason = formData.rejectionReason;
						if (formData.nextInterviewDate) cleanedData.nextInterviewDate = formData.nextInterviewDate;
						if (formData.source) cleanedData.source = formData.source;
						if (formData.applicationMethod) cleanedData.applicationMethod = formData.applicationMethod;
						if (formData.language) cleanedData.language = formData.language;
						await jobApplicationsApi.update(application.id, cleanedData);
						goto(`/job-applications/${application.id}`);
						return;
					} catch (retryErr: any) {
						error = retryErr.response?.data?.message || retryErr.message || 'Failed to update job application';
						console.error('Error updating application after retry:', retryErr);
					}
				} else {
					error = err.response?.data?.message || err.message || 'Failed to update job application';
					console.error('Error updating application:', err);
				}
			} else {
				error = err.response?.data?.message || err.message || 'Failed to update job application';
				console.error('Error updating application:', err);
			}
		} finally {
			loading = false;
		}
	}
</script>

<div class="container mx-auto max-w-4xl px-4 py-8">
	<div class="mb-6">
		<button
			onclick={() => goto(`/job-applications/${application?.id || ''}`)}
			class="text-blue-600 hover:text-blue-700 mb-4"
		>
			← Back to Application
		</button>
		<h1 class="text-3xl font-bold text-gray-900">Edit Job Application</h1>
		{#if application}
			<p class="text-gray-600 mt-2">{application.jobTitle} at {application.companyName}</p>
		{/if}
	</div>

	{#if error}
		<div class="mb-4 rounded-lg bg-red-50 p-4 text-red-800">{error}</div>
	{/if}

	{#if initialLoading}
		<div class="text-center py-12">
			<div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
			<p class="mt-4 text-gray-600">Loading application...</p>
		</div>
	{:else if application}
		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
			<!-- Resume Section (Coming Soon) -->
			<div class="rounded-lg border border-gray-200 bg-gray-50 p-6">
				<h2 class="mb-4 text-xl font-semibold text-gray-900">Resume</h2>
				<div class="flex items-center gap-2 text-gray-500">
					<span class="text-sm italic">Coming soon - Resume feature is being implemented in the backend</span>
				</div>
				{#if application.resumeId}
					<p class="mt-2 text-sm text-gray-600">Resume ID: {application.resumeId}</p>
				{/if}
			</div>

			<!-- Salary Information -->
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-xl font-semibold text-gray-900">Salary Information</h2>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
					<div>
						<label for="salaryMin" class="block text-sm font-medium text-gray-700 mb-1">Minimum Salary</label>
						<input
							id="salaryMin"
							type="number"
							bind:value={formData.salaryMin}
							min="0"
							placeholder="0"
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label for="salaryMax" class="block text-sm font-medium text-gray-700 mb-1">Maximum Salary</label>
						<input
							id="salaryMax"
							type="number"
							bind:value={formData.salaryMax}
							min="0"
							placeholder="0"
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label for="salaryCurrency" class="block text-sm font-medium text-gray-700 mb-1">Currency</label>
						<select
							id="salaryCurrency"
							bind:value={formData.salaryCurrency}
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						>
							<option value="">Select currency...</option>
							{#each currencyOptions as currency}
								<option value={currency}>{currency}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>

			<!-- Job Information -->
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-xl font-semibold text-gray-900">Job Information</h2>
				<div class="space-y-4">
					<div>
						<label for="jobDescription" class="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
						<textarea
							id="jobDescription"
							bind:value={formData.jobDescription}
							rows="8"
							placeholder="Paste the job description here..."
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						></textarea>
					</div>
					<div>
						<label for="coverLetter" class="block text-sm font-medium text-gray-700 mb-1">Cover Letter</label>
						<textarea
							id="coverLetter"
							bind:value={formData.coverLetter}
							rows="8"
							placeholder="Your cover letter text..."
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						></textarea>
					</div>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label for="deadline" class="block text-sm font-medium text-gray-700 mb-1">Application Deadline</label>
							<input
								id="deadline"
								type="date"
								bind:value={formData.deadline}
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
									<option value={level}>{level.charAt(0).toUpperCase() + level.slice(1).replace(/-/g, ' ')}</option>
								{/each}
							</select>
						</div>
					</div>
				</div>
			</div>

			<!-- Application Details -->
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-xl font-semibold text-gray-900">Application Details</h2>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<label for="source" class="block text-sm font-medium text-gray-700 mb-1">Source</label>
						<p class="text-xs text-gray-500 mb-2">Where you found this job (company website, referral, job board, etc.)</p>
						<input
							id="source"
							type="text"
							bind:value={formData.source}
							placeholder="e.g., Company website, Referral, etc."
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label for="applicationMethod" class="block text-sm font-medium text-gray-700 mb-1">Application Method</label>
						<p class="text-xs text-gray-500 mb-2">How you applied (online form, email, recruiter, etc.)</p>
						<input
							id="applicationMethod"
							type="text"
							bind:value={formData.applicationMethod}
							placeholder="e.g., Online form, Email, etc."
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label for="language" class="block text-sm font-medium text-gray-700 mb-1">Language</label>
						<p class="text-xs text-gray-500 mb-2">Primary language for the position or application</p>
						<input
							id="language"
							type="text"
							bind:value={formData.language}
							placeholder="e.g., English, Spanish, etc."
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>
				</div>
			</div>

			<!-- Timeline -->
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-xl font-semibold text-gray-900">Timeline</h2>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
					<div>
						<label for="followUpDate" class="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
						<input
							id="followUpDate"
							type="date"
							bind:value={formData.followUpDate}
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label for="responseReceivedAt" class="block text-sm font-medium text-gray-700 mb-1">Response Received At</label>
						<input
							id="responseReceivedAt"
							type="date"
							bind:value={formData.responseReceivedAt}
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label for="nextInterviewDate" class="block text-sm font-medium text-gray-700 mb-1">Next Interview Date</label>
						<input
							id="nextInterviewDate"
							type="date"
							bind:value={formData.nextInterviewDate}
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>
				</div>
				<div class="mt-4">
					<label for="rejectionReason" class="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
					<textarea
						id="rejectionReason"
						bind:value={formData.rejectionReason}
						rows="3"
						placeholder="If rejected, provide the reason..."
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					></textarea>
				</div>
			</div>

			<!-- Tags and Notes -->
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-xl font-semibold text-gray-900">Tags and Notes</h2>
				<div class="space-y-4">
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
							rows="6"
							placeholder="Any additional notes about this application..."
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						></textarea>
					</div>
				</div>
			</div>

			<!-- Submit Buttons -->
			<div class="flex gap-4">
				<button
					type="submit"
					disabled={loading}
					class="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{loading ? 'Saving...' : 'Save Changes'}
				</button>
				<button
					type="button"
					onclick={() => application && goto(`/job-applications/${application.id}`)}
					class="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
				>
					Cancel
				</button>
			</div>
		</form>
	{/if}
</div>



