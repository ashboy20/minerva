/**
 * Collection Service API Endpoints
 * Handles collection management operations
 */

import { ipcChannels } from '../../../config/ipc-channels';
import {
	BackendClient,
	EndpointConfig,
} from '../backend-client';
import { ReorderItemRequest } from '../../../types/backend/collections/collection';

/**
 * Get collection service endpoint configurations for IPC handlers
 */
export function getCollectionServiceApis(
	client: BackendClient,
): EndpointConfig[] {
	return [
		{
			ipcChannel: ipcChannels.BACKEND_COLLECTIONS_GET,
			handler: async (_event) => {
				const response = await client.request(
					'/api/collections/',
				);
				return client.processResponse(response);
			},
		},
		{
			ipcChannel: ipcChannels.BACKEND_COLLECTIONS_REORDER,
			handler: async (
				_event,
				request: ReorderItemRequest,
			) => {
				const response = await client.request(
					'/api/collections/reorder',
					{
						method: 'POST',
						body: JSON.stringify(request),
					},
				);
				return client.processResponse(response);
			},
		},
	];
}
