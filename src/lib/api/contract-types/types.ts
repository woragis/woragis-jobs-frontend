/**
 * Contract Types domain types
 */

export interface ContractType {
	id: string;
	name: string;
	description: string;
	createdAt: string;
}

export interface ApiResponse<T> {
	success: boolean;
	data: T;
}
