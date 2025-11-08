import { ipcChannels } from '../../../config/ipc-channels';
import {
	BackendClient,
	EndpointConfig,
} from '../backend-client';

/**
 * Get endpoint configurations for IPC handlers
 */
export function getEndpointManagementApis(
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
			ipcChannel:
				ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_COLLECTIONS_GET,
			handler: async (_event, _search?: string) => {
				const response = await client.request(
					'/api/endpoint-management/collections',
				);
				return client.processResponse(response);
			},
		},
		{
			ipcChannel:
				ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_COLLECTION_CREATE,
			handler: async (_event) => {
				const response = await client.request(
					'/api/endpoint-management/collection/create',
					{
						method: 'POST',
					},
				);
				return await client.processResponse(response);
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
				const response = await client.request(
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
				return await client.processResponse(response);
			},
		},
		{
			ipcChannel:
				ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_ITEM_UPDATE,
			handler: async (
				_event,
				uuid: string,
				fields: any,
			) => {
				const response = await client.request(
					`/api/endpoint-management/item/update`,
					{
						method: 'PUT',
						body: JSON.stringify({
							uuid,
							fields: {
								...fields,
							},
						}),
					},
				);
				console.log(
					JSON.stringify({
						uuid,
						fields: {
							...fields,
						},
					}),
				);
				return await client.processResponse(response);
			},
		},
		{
			ipcChannel:
				ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_ITEM_CREATE,
			handler: async (_event, item: any) => {
				const response = await client.request(
					'/api/endpoint-management/item/create',
					{
						method: 'POST',
						body: JSON.stringify(item),
					},
				);
				return await client.processResponse(response);
			},
		},
		{
			ipcChannel:
				ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_ITEM_DELETE,
			handler: async (_event, uuid: string) => {
				const response = await client.request(
					'/api/endpoint-management/item/delete',
					{
						method: 'POST',
						body: JSON.stringify({
							uuid,
						}),
					},
				);
				return await client.processResponse(response);
			},
		},
		{
			ipcChannel:
				ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_ENDPOINT_GET,
			handler: async (_event, uuid: string) => {
				const response = await client.request(
					`/api/endpoint-management/endpoint/${uuid}`,
				);
				return await client.processResponse(response);
			},
		},
	];
}
