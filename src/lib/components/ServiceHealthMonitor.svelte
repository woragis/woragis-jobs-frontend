<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { config } from '$lib/config';

	type HealthStatus = 'healthy' | 'unhealthy' | 'checking' | 'unknown';

	interface ServiceHealth {
		name: string;
		url: string;
		status: HealthStatus;
		lastChecked: Date | null;
		responseTime: number | null;
		error?: string;
	}

	let services: ServiceHealth[] = [
		{
			name: 'Jobs Backend',
			url: config.jobsApiUrl.replace('/api/v1', ''),
			status: 'unknown',
			lastChecked: null,
			responseTime: null
		},
		{
			name: 'Auth Backend',
			url: config.authApiUrl.replace('/api/v1', ''),
			status: 'unknown',
			lastChecked: null,
			responseTime: null
		},
		{
			name: 'Resume Service',
			url: config.resumeServiceUrl,
			status: 'unknown',
			lastChecked: null,
			responseTime: null
		},
		{
			name: 'AI Service',
			url: config.aiServiceUrl,
			status: 'unknown',
			lastChecked: null,
			responseTime: null
		},
		{
			name: 'Resume Worker',
			url: config.resumeWorkerUrl,
			status: 'unknown',
			lastChecked: null,
			responseTime: null
		}
	];

	let isExpanded = false;
	let checkInterval: ReturnType<typeof setInterval> | null = null;

	async function checkServiceHealth(service: ServiceHealth): Promise<void> {
		const startTime = performance.now();
		service.status = 'checking';
		
		try {
			// Try both /healthz and /health endpoints
			let response;
			try {
				response = await fetch(`${service.url}/healthz`, {
					method: 'GET',
					signal: AbortSignal.timeout(5000) // 5 second timeout
				});
			} catch {
				// Fallback to /health endpoint
				response = await fetch(`${service.url}/health`, {
					method: 'GET',
					signal: AbortSignal.timeout(5000)
				});
			}

			const responseTime = Math.round(performance.now() - startTime);
			
			if (response.ok) {
				service.status = 'healthy';
				service.responseTime = responseTime;
				service.error = undefined;
			} else {
				service.status = 'unhealthy';
				service.responseTime = responseTime;
				service.error = `HTTP ${response.status}`;
			}
		} catch (error: any) {
			service.status = 'unhealthy';
			service.responseTime = null;
			service.error = error.name === 'TimeoutError' ? 'Timeout' : 'Connection failed';
		} finally {
			service.lastChecked = new Date();
		}
	}

	async function checkAllServices(): Promise<void> {
		await Promise.all(services.map(service => checkServiceHealth(service)));
		services = services; // Trigger reactivity
	}

	function getStatusColor(status: HealthStatus): string {
		switch (status) {
			case 'healthy':
				return 'bg-green-500';
			case 'unhealthy':
				return 'bg-red-500';
			case 'checking':
				return 'bg-yellow-500 animate-pulse';
			case 'unknown':
			default:
				return 'bg-gray-400';
		}
	}

	function getStatusIcon(status: HealthStatus): string {
		switch (status) {
			case 'healthy':
				return '✓';
			case 'unhealthy':
				return '✗';
			case 'checking':
				return '⟳';
			case 'unknown':
			default:
				return '?';
		}
	}

	function formatTime(date: Date | null): string {
		if (!date) return 'Never';
		return date.toLocaleTimeString();
	}

	onMount(() => {
		// Initial check
		checkAllServices();
		
		// Check every 30 seconds
		checkInterval = setInterval(checkAllServices, 30000);
	});

	onDestroy(() => {
		if (checkInterval) {
			clearInterval(checkInterval);
		}
	});
</script>

<div class="fixed left-4 top-20 z-50">
	<div class="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
		<!-- Header -->
		<button
			onclick={() => (isExpanded = !isExpanded)}
			class="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
		>
			<span class="text-sm font-semibold text-gray-700">Services</span>
			<div class="flex items-center gap-2">
				<span class="text-xs text-gray-500">
					{services.filter(s => s.status === 'healthy').length}/{services.length}
				</span>
				<svg
					class="w-4 h-4 transition-transform duration-200"
					class:rotate-180={isExpanded}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</div>
		</button>

		<!-- Collapsed view - just dots -->
		{#if !isExpanded}
			<div class="px-4 py-2 flex gap-1.5">
				{#each services as service}
					<div
						class="w-2 h-2 rounded-full {getStatusColor(service.status)}"
						title="{service.name}: {service.status}"
					></div>
				{/each}
			</div>
		{/if}

		<!-- Expanded view -->
		{#if isExpanded}
			<div class="p-3 space-y-2 max-w-xs">
				{#each services as service}
					<div class="flex items-center justify-between text-xs">
						<div class="flex items-center gap-2 flex-1 min-w-0">
							<div class="w-6 h-6 rounded-full {getStatusColor(service.status)} flex items-center justify-center text-white font-bold text-xs">
								{getStatusIcon(service.status)}
							</div>
							<div class="flex-1 min-w-0">
								<div class="font-medium text-gray-900 truncate">{service.name}</div>
								<div class="text-gray-500 text-xs">
									{#if service.status === 'healthy' && service.responseTime !== null}
										{service.responseTime}ms
									{:else if service.error}
										{service.error}
									{:else}
										{service.status}
									{/if}
								</div>
							</div>
						</div>
					</div>
				{/each}
				
				<div class="pt-2 border-t border-gray-200 flex justify-between items-center">
					<span class="text-xs text-gray-500">
						Last: {formatTime(services[0]?.lastChecked)}
					</span>
					<button
						onclick={() => checkAllServices()}
						class="text-xs text-blue-600 hover:text-blue-700 font-medium"
					>
						Refresh
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.rotate-180 {
		transform: rotate(180deg);
	}
</style>
