import { config } from '$lib/config';
import { createAuthenticatedClient } from '../utils';
import type { ContractType, ApiResponse } from './types';

/**
 * Contract Types API Client
 * Handles all API calls to the contract types endpoints
 */
class ContractTypesApiClient {
	private client = createAuthenticatedClient(
		`${config.jobsApiUrl}/job-applications/contract-types`
	);

	/**
	 * Get a contract type by ID
	 */
	async get(id: string): Promise<ContractType> {
		const response = await this.client.get<ApiResponse<ContractType>>(`/${id}`);
		return response.data.data;
	}

	/**
	 * List all contract types
	 */
	async list(): Promise<ContractType[]> {
		const response = await this.client.get<ApiResponse<ContractType[]>>('/');
		return response.data.data;
	}
}

// Export singleton instance
export const contractTypesApi = new ContractTypesApiClient();
