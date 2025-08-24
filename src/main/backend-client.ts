/**
 * FastAPI Backend Client with IPC Handlers
 * HTTP client for calling backend APIs and IPC handler registration
 */

import { ipcMain } from 'electron';
import log from 'electron-log';
import { getBackendService } from './backend-service';
import { ipcChannels } from '../config/ipc-channels';

export class BackendClient {
	private baseUrl: string;

	constructor(baseUrl?: string) {
		this.baseUrl = baseUrl || getBackendService().getServerUrl();
	}

	/**
	 * Generic HTTP request method
	 */
	async request(endpoint: string, options: any = {}) {
		const url = `${this.baseUrl}${endpoint}`;

		const defaultHeaders = {
			'Content-Type': 'application/json',
		};

		try {
			log.info(`API Request: ${options.method || 'GET'} ${url}`);

			const response = await fetch(url, {
				...options,
				headers: {
					...defaultHeaders,
					...options.headers,
				},
			});

			let responseData = null;
			try {
				responseData = await response.json();
			} catch (e) {
				// Response might not be JSON
			}

			if (!response.ok) {
				log.error(`API Error: ${response.status} ${response.statusText}`);
				return {
					error: `HTTP ${response.status}: ${response.statusText}`,
					status: response.status,
				};
			}

			log.info(`API Response: ${response.status}`);
			return {
				data: responseData,
				status: response.status,
			};

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			log.error(`API Request failed: ${errorMessage}`);
			return {
				error: errorMessage,
				status: 0,
			};
		}
	}

	// Endpoints
	async getEndpoints() {
		return this.request(`/api/endpoint-management/endpoints`)
	}


	// Test connection
	async testConnection() {
		try {
			const response = await this.request('/');
			return response.status === 200;
		} catch (error) {
			log.error('Backend connection test failed:', error);
			return false;
		}
	}
}

// Singleton instance
let backendClientInstance: BackendClient | null = null;

export function getBackendClient() {
	if (!backendClientInstance) {
		backendClientInstance = new BackendClient();
	}
	return backendClientInstance;
}

// Simple API shortcuts
export const BackendAPI = {
	endpointManagement: {
		getEndpoints: () => getBackendClient().getEndpoints(),
	},

	health: {
		test: () => getBackendClient().testConnection(),
	},
};

/**
 * Register FastAPI Backend IPC Handlers
 * Handles IPC communication between renderer and FastAPI backend
 */
export const registerBackendHandlers = () => {
	log.info('🔌 Registering FastAPI Backend IPC handlers...');

	// Get all endpoints
	ipcMain.handle(ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_ENDPOINTS_GET, async (_event, search?: string) => {
		try {
			log.info('📋 IPC: Getting endpoints from FastAPI backend...');
			const result = await BackendAPI.endpointManagement.getEndpoints();
			return result;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			log.error('❌ IPC BACKEND_GET_ENDPOINTS error:', error);
			return { success: false, error: errorMessage };
		}
	});

	log.info('✅ FastAPI Backend IPC handlers registered successfully');
};
