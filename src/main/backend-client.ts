/**
 * FastAPI Backend Client with IPC Handlers
 * HTTP client for calling backend APIs and IPC handler registration
 */

import { ipcMain } from 'electron';
import log from 'electron-log';
import { getBackendService } from './backend-service';
import { ipcChannels } from '../config/ipc-channels';

interface EndpointConfig {
	ipcChannel: string;
	handler: (event: Electron.IpcMainInvokeEvent, ...args: any[]) => Promise<any>;
}

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

		log.info(`API Request: ${options.method || 'GET'} ${url}`);

		return fetch(url, {
			...options,
			headers: {
				...defaultHeaders,
				...options.headers,
			},
		});
	}

	/**
	 * Helper function to process responses consistently
	 */
	private async processResponse(response: Response) {
		if (!response.ok) {
			return {
				error: `HTTP ${response.status}: ${response.statusText}`,
				status: response.status,
			};
		}
		
		const data = await response.json();
		return {
			data: data,
			status: response.status,
		};
	}

	/**
	 * Get endpoint configurations for IPC handlers
	 */
	getEndpoints(): EndpointConfig[] {
		return [
			{
				ipcChannel: ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_ENDPOINTS_GET,
				handler: async (_event, _search?: string) => {
					const response = await this.request('/api/endpoint-management/endpoints');
					return this.processResponse(response);
				},
			},
			{
				ipcChannel: ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_ENDPOINT_GET,
				handler: async (_event, endpointUuid: string) => {
					const response = await this.request(`/api/endpoint-management/endpoints/${endpointUuid}`);
					return this.processResponse(response);
				},
			},
			{
				ipcChannel: ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_ENDPOINT_CREATE,
				handler: async (_event, endpointData: any) => {
					const response = await this.request('/api/endpoint-management/endpoints', {
						method: 'POST',
						body: JSON.stringify(endpointData)
					});
					return this.processResponse(response);
				},
			},
			{
				ipcChannel: ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_ENDPOINT_UPDATE,
				handler: async (_event, endpointUuid: string, updateData: any) => {
					const response = await this.request(`/api/endpoint-management/endpoints/${endpointUuid}`, {
						method: 'PUT',
						body: JSON.stringify(updateData)
					});
					return this.processResponse(response);
				},
			},
			{
				ipcChannel: ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_ENDPOINT_DELETE,
				handler: async (_event, endpointUuid: string) => {
					const response = await this.request(`/api/endpoint-management/endpoints/${endpointUuid}`, {
						method: 'DELETE'
					});
					return this.processResponse(response);
				},
			},
			{
				ipcChannel: ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_RESET,
				handler: async (_event) => {
					const response = await this.request('/api/endpoint-management/reset', {method: 'POST'});
					return this.processResponse(response);
				},
			},
			{
				ipcChannel: ipcChannels.BACKEND_API_CALL_ENDPOINT,
				handler: async (_event, requestData: any) => {
					const response = await this.request('/api/call-endpoint/call', {
						method: 'POST',
						body: JSON.stringify(requestData)
					});
					return this.processResponse(response);
				},
			}
		];
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

/**
 * Register FastAPI Backend IPC Handlers
 * Handles IPC communication between renderer and FastAPI backend
 */
export const registerBackendHandlers = () => {
	log.info('🔌 Registering FastAPI Backend IPC handlers...');
	const backendClient = getBackendClient();
	for (const endpointConfig of backendClient.getEndpoints()) {
		ipcMain.handle(endpointConfig.ipcChannel, async (event, ...args) => {
			try {
				log.info(`🚀 IPC: Calling ${endpointConfig.ipcChannel}...`);
				return await endpointConfig.handler(event, ...args);
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				log.error(`❌ IPC ${endpointConfig.ipcChannel} error:`, error);
				return { success: false, error: errorMessage };
			}
		});
	}
	log.info('✅ FastAPI Backend IPC handlers registered successfully');
};
