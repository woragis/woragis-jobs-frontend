import { writable, derived } from 'svelte/store';
import {
	dailyObjectivesApi,
	type DailyObjective,
	type DailyProgress,
	type HistoryPreset
} from '$lib/api/daily-objectives';
import { toastStore } from '$lib/stores/toast';
import { authStore } from '$lib/stores/auth';

/**
 * Daily Objectives Store
 * Manages daily objectives and progress state
 */

interface ObjectivesState {
	objective: DailyObjective | null;
	todayProgress: DailyProgress | null;
	historicalProgress: DailyProgress[];
	isLoading: boolean;
	error: string | null;
	hasObjective: boolean; // Quick check for objectives existence
}

const createObjectivesStore = () => {
	const { subscribe, set, update } = writable<ObjectivesState>({
		objective: null,
		todayProgress: null,
		historicalProgress: [],
		isLoading: false,
		error: null,
		hasObjective: false
	});

	/**
	 * Initialize objectives - load current objective and today's progress
	 */
	async function init() {
		update((state) => ({ ...state, isLoading: true, error: null }));

		try {
			const objective = await dailyObjectivesApi.getObjective();
			const todayProgress = await dailyObjectivesApi.getTodayProgress();

			update((state) => ({
				...state,
				objective,
				todayProgress,
				hasObjective: true,
				isLoading: false
			}));
		} catch (err) {
			let errorMsg = err instanceof Error ? err.message : 'Failed to load objectives';
			// Global auth error handling
			if (errorMsg.includes('401') || errorMsg.includes('403')) {
				authStore.clear();
				toastStore.showToast('error', 'Session expired. Please log in again.');
			} else {
				toastStore.showToast('error', errorMsg);
			}
			update((state) => ({
				...state,
				hasObjective: false,
				isLoading: false,
				error: errorMsg
			}));
		}
	}

	/**
	 * Create new objectives
	 */
	async function createObjective(
		totalTarget: number,
		juniorTarget: number,
		plenoTarget: number,
		seniorTarget: number
	) {
		update((state) => ({ ...state, isLoading: true, error: null }));

		try {
			const objective = await dailyObjectivesApi.createObjective({
				totalTarget,
				juniorTarget,
				plenoTarget,
				seniorTarget
			});

			update((state) => ({
				...state,
				objective,
				hasObjective: true,
				isLoading: false
			}));

			return objective;
		} catch (err) {
			let errorMsg = err instanceof Error ? err.message : 'Failed to create objectives';
			if (errorMsg.includes('401') || errorMsg.includes('403')) {
				authStore.clear();
				toastStore.showToast('error', 'Session expired. Please log in again.');
			} else {
				toastStore.showToast('error', errorMsg);
			}
			update((state) => ({
				...state,
				isLoading: false,
				error: errorMsg
			}));
			throw err;
		}
	}

	/**
	 * Update existing objectives
	 */
	async function updateObjective(
		totalTarget: number,
		juniorTarget: number,
		plenoTarget: number,
		seniorTarget: number
	) {
		update((state) => ({ ...state, isLoading: true, error: null }));

		try {
			const objective = await dailyObjectivesApi.updateObjective({
				totalTarget,
				juniorTarget,
				plenoTarget,
				seniorTarget
			});

			update((state) => ({
				...state,
				objective,
				isLoading: false
			}));

			return objective;
		} catch (err) {
			let errorMsg = err instanceof Error ? err.message : 'Failed to update objectives';
			if (errorMsg.includes('401') || errorMsg.includes('403')) {
				authStore.clear();
				toastStore.showToast('error', 'Session expired. Please log in again.');
			} else {
				toastStore.showToast('error', errorMsg);
			}
			update((state) => ({
				...state,
				isLoading: false,
				error: errorMsg
			}));
			throw err;
		}
	}

	/**
	 * Load today's progress
	 */
	async function loadTodayProgress() {
		try {
			const todayProgress = await dailyObjectivesApi.getTodayProgress();
			update((state) => ({
				...state,
				todayProgress
			}));
		} catch (err) {
			let errorMsg = err instanceof Error ? err.message : 'Failed to load today progress';
			if (errorMsg.includes('401') || errorMsg.includes('403')) {
				authStore.clear();
				toastStore.showToast('error', 'Session expired. Please log in again.');
			} else {
				toastStore.showToast('error', errorMsg);
			}
			update((state) => ({
				...state,
				error: errorMsg
			}));
		}
	}

	/**
	 * Load historical progress
	 */
	async function loadHistoricalProgress(preset?: HistoryPreset, from?: string, to?: string) {
		try {
			const historicalProgress = await dailyObjectivesApi.getHistoricalProgress(preset, from, to);
			update((state) => ({
				...state,
				historicalProgress
			}));
		} catch (err) {
			let errorMsg = err instanceof Error ? err.message : 'Failed to load historical progress';
			if (errorMsg.includes('401') || errorMsg.includes('403')) {
				authStore.clear();
				toastStore.showToast('error', 'Session expired. Please log in again.');
			} else {
				toastStore.showToast('error', errorMsg);
			}
			update((state) => ({
				...state,
				error: errorMsg
			}));
		}
	}

	/**
	 * Clear error message
	 */
	function clearError() {
		update((state) => ({ ...state, error: null }));
	}

	return {
		subscribe,
		init,
		createObjective,
		updateObjective,
		loadTodayProgress,
		loadHistoricalProgress,
		clearError
	};
};

export const objectivesStore = createObjectivesStore();

/**
 * Derived stores for easier access to specific state
 */
export const objectiveExists = derived(objectivesStore, ($store) => $store.hasObjective);
export const currentObjective = derived(objectivesStore, ($store) => $store.objective);
export const todayProgressStore = derived(objectivesStore, ($store) => $store.todayProgress);
export const historicalProgressStore = derived(
	objectivesStore,
	($store) => $store.historicalProgress
);
export const objectivesLoading = derived(objectivesStore, ($store) => $store.isLoading);
export const objectivesError = derived(objectivesStore, ($store) => $store.error);
