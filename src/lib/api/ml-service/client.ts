import { config } from '$lib/config';
import { createAuthenticatedClient } from '../utils';
import type {
	RecommendationsResponse,
	AnalyticsOverview,
	GetRecommendationsParams,
} from './types';

/**
 * ML Service API Client
 * Handles all API calls to the ML recommendation service
 */
class MlServiceApiClient {
	private client = createAuthenticatedClient(config.mlApiUrl);

	/**
	 * Get recommendations for a user
	 */
	async getRecommendations(
		userId: string,
		params?: GetRecommendationsParams
	): Promise<RecommendationsResponse> {
		const queryParams = new URLSearchParams();
		if (params?.limit) queryParams.append('limit', params.limit.toString());
		if (params?.tier) queryParams.append('tier', params.tier);

		const queryString = queryParams.toString();
		const url = queryString ? `/${userId}?${queryString}` : `/${userId}`;
		
		const response = await this.client.get<RecommendationsResponse>(`/recommendations${url}`);
		return response.data;
	}

	/**
	 * Get analytics overview for a user
	 */
	async getAnalyticsOverview(userId: string): Promise<AnalyticsOverview> {
		const response = await this.client.get<AnalyticsOverview>(`/analytics/${userId}/overview`);
		return response.data;
	}

	/**
	 * Get company metrics
	 */
	async getCompanyMetrics(companyId: string): Promise<any> {
		const response = await this.client.get(`/analytics/companies/${companyId}`);
		return response.data;
	}
}

// Export singleton instance
export const mlServiceApi = new MlServiceApiClient();

