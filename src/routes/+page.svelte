<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<div class="container mx-auto px-4 py-16 text-center">
	<h1 class="mb-4 text-5xl font-bold text-gray-900">Job Applications</h1>
	<p class="mb-8 text-xl text-gray-600">Manage your job applications in one place</p>
	<button
		onclick={() => goto('/job-applications')}
		class="rounded-lg bg-blue-600 px-6 py-3 text-lg text-white hover:bg-blue-700 transition-colors"
	>
		View Applications
	</button>
</div>
