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
	private async processResponse(response: Response) {
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

	/**
	 * Get endpoint configurations for IPC handlers
	 */
	getEndpoints(): EndpointConfig[] {
		return [
			{
				ipcChannel:
					ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_COLLECTIONS_GET,
				handler: async (_event, _search?: string) => {
					const response = await this.request(
						'/api/endpoint-management/collections',
					);
					return this.processResponse(response);
				},
			},
			{
				ipcChannel:
					ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_COLLECTION_CREATE,
				handler: async (_event) => {
					const response = await this.request(
						'/api/endpoint-management/collection/create',
						{
							method: 'POST',
						},
					);
					return this.processResponse(response);
				},
			},
			{
				ipcChannel:
					ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_REORDER,
				handler: async (
					_event,
					draggedUuid: string,
					oldParentUuid: string,
					newParentUuid: string,
					relativeIndex: number,
				) => {
					const response = await this.request(
						`/api/endpoint-management/reorder`,
						{
							method: 'PUT',
							body: JSON.stringify({
								dragged_uuid: draggedUuid,
								old_parent_uuid: oldParentUuid,
								new_parent_uuid: newParentUuid,
								relative_index: relativeIndex,
							}),
						},
					);
					return this.processResponse(response);
				},
			},
			{
				ipcChannel:
					ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_COLLECTION_RENAME,
				handler: async (
					_event,
					uuid: string,
					newName: string,
				) => {
					const response = await this.request(
						`/api/endpoint-management/collection/${uuid}/rename?new_name=${encodeURIComponent(newName)}`,
						{
							method: 'PUT',
						},
					);
					return this.processResponse(response);
				},
			},
			{
				ipcChannel:
					ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_FOLDER_RENAME,
				handler: async (
					_event,
					uuid: string,
					newName: string,
				) => {
					const response = await this.request(
						`/api/endpoint-management/folder/${uuid}/rename?new_name=${encodeURIComponent(newName)}`,
						{
							method: 'PUT',
						},
					);
					return this.processResponse(response);
				},
			},
			{
				ipcChannel:
					ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_ENDPOINT_RENAME,
				handler: async (
					_event,
					uuid: string,
					newName: string,
				) => {
					const response = await this.request(
						`/api/endpoint-management/endpoint/${uuid}/rename?new_name=${encodeURIComponent(newName)}`,
						{
							method: 'PUT',
						},
					);
					return this.processResponse(response);
				},
			},
			{
				ipcChannel: ipcChannels.BACKEND_API_CALL_ENDPOINT,
				handler: async (_event, requestData: any) => {
					const response = await this.request(
						'/api/call-endpoint/call',
						{
							method: 'POST',
							body: JSON.stringify(requestData),
						},
					);
					return this.processResponse(response);
				},
			},
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
	log.info(
		'🔌 Registering FastAPI Backend IPC handlers...',
	);
	const backendClient = getBackendClient();
	for (const endpointConfig of backendClient.getEndpoints()) {
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
