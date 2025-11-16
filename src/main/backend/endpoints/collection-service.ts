/**
 * Collection Service API Endpoints
 * Handles collection management operations
 */

import { ipcChannels } from '../../../config/ipc-channels';
import {
	BackendClient,
	EndpointConfig,
} from '../backend-client';
import {
	ReorderItemRequest,
	ReorderItemResponse,
	GetCollectionsListResponse,
	ToggleOpenStateRequest,
	ToggleOpenStateResponse,
	CreateCollectionRequest,
	CreateCollectionResponse,
	DeleteCollectionRequest,
	DeleteCollectionResponse,
	CreateFolderRequest,
	CreateFolderResponse,
	DeleteFolderRequest,
	DeleteFolderResponse,
	CreateEndpointRequest,
	CreateEndpointResponse,
	DeleteEndpointRequest,
	DeleteEndpointResponse,
} from '../../../types/backend/collections/collection';

/**
 * Get collection service endpoint configurations for IPC handlers
 */
export function getCollectionServiceApis(
	client: BackendClient,
): EndpointConfig[] {
	return [
		{
			ipcChannel: ipcChannels.BACKEND_COLLECTIONS_GET,
			handler: async (
				_event,
			): Promise<GetCollectionsListResponse> => {
				const response = await client.request(
					'/api/collections/',
				);
				return client.processResponse(
					response,
				) as Promise<GetCollectionsListResponse>;
			},
		},
		{
			ipcChannel: ipcChannels.BACKEND_COLLECTIONS_CREATE,
			handler: async (
				_event,
				request: CreateCollectionRequest,
			): Promise<CreateCollectionResponse> => {
				const response = await client.request(
					'/api/collections/',
					{
						method: 'POST',
						body: JSON.stringify(request),
					},
				);
				return client.processResponse(
					response,
				) as Promise<CreateCollectionResponse>;
			},
		},
		{
			ipcChannel: ipcChannels.BACKEND_COLLECTIONS_DELETE,
			handler: async (
				_event,
				request: DeleteCollectionRequest,
			): Promise<DeleteCollectionResponse> => {
				const response = await client.request(
					'/api/collections/',
					{
						method: 'DELETE',
						body: JSON.stringify(request),
					},
				);
				return client.processResponse(
					response,
				) as Promise<DeleteCollectionResponse>;
			},
		},
		{
			ipcChannel: ipcChannels.BACKEND_COLLECTIONS_REORDER,
			handler: async (
				_event,
				request: ReorderItemRequest,
			): Promise<ReorderItemResponse> => {
				const response = await client.request(
					'/api/collections/reorder',
					{
						method: 'POST',
						body: JSON.stringify(request),
					},
				);
				return client.processResponse(
					response,
				) as Promise<ReorderItemResponse>;
			},
		},
		{
			ipcChannel:
				ipcChannels.BACKEND_COLLECTIONS_TOGGLE_OPEN,
			handler: async (
				_event,
				request: ToggleOpenStateRequest,
			): Promise<ToggleOpenStateResponse> => {
				const response = await client.request(
					'/api/collections/toggle-open',
					{
						method: 'PATCH',
						body: JSON.stringify(request),
					},
				);
				return client.processResponse(
					response,
				) as Promise<ToggleOpenStateResponse>;
			},
		},
		{
			ipcChannel: ipcChannels.BACKEND_FOLDER_CREATE,
			handler: async (
				_event,
				request: CreateFolderRequest,
			): Promise<CreateFolderResponse> => {
				const response = await client.request(
					'/api/collections/folder',
					{
						method: 'POST',
						body: JSON.stringify(request),
					},
				);
				return client.processResponse(
					response,
				) as Promise<CreateFolderResponse>;
			},
		},
		{
			ipcChannel: ipcChannels.BACKEND_FOLDER_DELETE,
			handler: async (
				_event,
				request: DeleteFolderRequest,
			): Promise<DeleteFolderResponse> => {
				const response = await client.request(
					'/api/collections/folder',
					{
						method: 'DELETE',
						body: JSON.stringify(request),
					},
				);
				return client.processResponse(
					response,
				) as Promise<DeleteFolderResponse>;
			},
		},
		{
			ipcChannel: ipcChannels.BACKEND_ENDPOINT_CREATE,
			handler: async (
				_event,
				request: CreateEndpointRequest,
			): Promise<CreateEndpointResponse> => {
				const response = await client.request(
					'/api/collections/endpoint',
					{
						method: 'POST',
						body: JSON.stringify(request),
					},
				);
				return client.processResponse(
					response,
				) as Promise<CreateEndpointResponse>;
			},
		},
		{
			ipcChannel: ipcChannels.BACKEND_ENDPOINT_DELETE,
			handler: async (
				_event,
				request: DeleteEndpointRequest,
			): Promise<DeleteEndpointResponse> => {
				const response = await client.request(
					'/api/collections/endpoint',
					{
						method: 'DELETE',
						body: JSON.stringify(request),
					},
				);
				return client.processResponse(
					response,
				) as Promise<DeleteEndpointResponse>;
			},
		},
	];
}
