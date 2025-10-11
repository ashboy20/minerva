/**
 * FastAPI Backend Client with IPC Handlers
 * HTTP client for calling backend APIs and IPC handler registration
 */

import { ipcMain } from 'electron';
import log from 'electron-log';
import { getBackendService } from './backend-service';
import { getEndpointManagementApis } from './endpoints/endpoint-management';
import { getCallEndpointApis } from './endpoints/call-endpoint';

export interface EndpointConfig {
	ipcChannel: string;
	handler: (
		event: Electron.IpcMainInvokeEvent,
		...args: any[]
	) => Promise<any>;
}

export class BackendClient {
	private baseUrl: string;

	constructor(baseUrl?: string) {
		this.baseUrl =
			baseUrl || getBackendService().getServerUrl();
	}

	/**
	 * Generic HTTP request method
	 */
	async request(endpoint: string, options: any = {}) {
		const url = `${this.baseUrl}${endpoint}`;

		const defaultHeaders = {
			'Content-Type': 'application/json',
		};

		log.info(
			`API Request: ${options.method || 'GET'} ${url}`,
		);

		return fetch(url, {
			...options,
			headers: {
				...defaultHeaders,
				...options.headers,
			},
		});
	}

	/**
	 * Helper function to process responses and return API response directly
	 */
	async processResponse(response: Response) {
		if (!response.ok) {
			// For errors, throw an exception that will be caught by the IPC handler
			throw new Error(
				`HTTP ${response.status}: ${response.statusText}`,
			);
		}

		// Return the API response directly (our BaseResponse format)
		const apiResponse = await response.json();
		return apiResponse;
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
	log.info(
		'🔌 Registering FastAPI Backend IPC handlers...',
	);
	const backendClient = getBackendClient();
	const endpoints = [
		...getEndpointManagementApis(backendClient),
		...getCallEndpointApis(backendClient),
	]


	for (const endpointConfig of endpoints) {
		ipcMain.handle(
			endpointConfig.ipcChannel,
			async (event, ...args) => {
				try {
					log.info(
						`🚀 IPC: Calling ${endpointConfig.ipcChannel}...`,
					);
					return await endpointConfig.handler(
						event,
						...args,
					);
				} catch (error) {
					const errorMessage =
						error instanceof Error
							? error.message
							: 'Unknown error';
					log.error(
						`❌ IPC ${endpointConfig.ipcChannel} error:`,
						error,
					);
					// Return error in BaseResponse format for consistency
					return {
						success: false,
						data: { error: errorMessage },
					};
				}
			},
		);
	}
	log.info(
		'✅ FastAPI Backend IPC handlers registered successfully',
	);
};
