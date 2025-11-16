/**
 * TypeScript types for Collection Service
 * Based on backend Pydantic models in app/models/collections.py
 */

/**
 * Base interface for all collection items
 */
export interface CollectionItemBase {
	uuid: string;
	name: string;
	seq: number;
}

/**
 * Endpoint item in a collection
 */
export interface EndpointItem extends CollectionItemBase {
	type: 'endpoint';
	method: string;
}

/**
 * Folder item in a collection
 */
export interface FolderItem extends CollectionItemBase {
	type: 'folder';
	items: (FolderItem | EndpointItem)[];
	is_opened: boolean;
}

/**
 * Collection item (top-level)
 */
export interface CollectionItem extends CollectionItemBase {
	type: 'collection';
	items: (FolderItem | EndpointItem)[];
	is_opened: boolean;
}

/**
 * Union type for tree items (folder or endpoint)
 */
export type CollectionTreeItem = FolderItem | EndpointItem;

/**
 * Response from GET /api/collections/
 */
export interface GetCollectionsListResponse {
	success: boolean;
	data: CollectionItem[];
}

/**
 * Request body for POST /api/collections/reorder
 */
export interface ReorderItemRequest {
	item_uuid: string;
	destination_folder_uuid: string | null;
	destination_seq: number;
}

/**
 * Response from POST /api/collections/reorder
 */
export interface ReorderItemResponse {
	success: boolean;
	data?: {
		message: string;
		item_uuid: string;
		new_seq: number;
		parent_changed: boolean;
	};
}

/**
 * Request body for PATCH /api/collections/toggle-open
 */
export interface ToggleOpenStateRequest {
	uuid: string;
	is_opened: boolean;
}

/**
 * Data model for toggle open state result
 */
export interface ToggleOpenStateData {
	message: string;
	uuid: string;
	is_opened: boolean;
}

/**
 * Response from PATCH /api/collections/toggle-open
 */
export interface ToggleOpenStateResponse {
	success: boolean;
	data?: ToggleOpenStateData;
}

/**
 * Request body for POST /api/collections/
 */
export interface CreateCollectionRequest {
	name: string;
}

/**
 * Data model for collection creation result
 */
export interface CreateCollectionData {
	message: string;
	uuid: string;
	name: string;
	slug: string;
}

/**
 * Response from POST /api/collections/
 */
export interface CreateCollectionResponse {
	success: boolean;
	data?: CreateCollectionData;
}

/**
 * Request body for DELETE /api/collections/
 */
export interface DeleteCollectionRequest {
	uuid: string;
}

/**
 * Data model for collection deletion result
 */
export interface DeleteCollectionData {
	message: string;
	uuid: string;
	slug: string;
}

/**
 * Response from DELETE /api/collections/
 */
export interface DeleteCollectionResponse {
	success: boolean;
	data?: DeleteCollectionData;
}

/**
 * Request body for POST /api/collections/folder
 */
export interface CreateFolderRequest {
	name: string;
	parent_uuid: string;
}

/**
 * Data model for folder creation result
 */
export interface CreateFolderData {
	message: string;
	uuid: string;
	name: string;
	slug: string;
}

/**
 * Response from POST /api/collections/folder
 */
export interface CreateFolderResponse {
	success: boolean;
	data?: CreateFolderData;
}

/**
 * Request body for DELETE /api/collections/folder
 */
export interface DeleteFolderRequest {
	uuid: string;
}

/**
 * Data model for folder deletion result
 */
export interface DeleteFolderData {
	message: string;
	uuid: string;
	slug: string;
}

/**
 * Response from DELETE /api/collections/folder
 */
export interface DeleteFolderResponse {
	success: boolean;
	data?: DeleteFolderData;
}

/**
 * Request body for POST /api/collections/endpoint
 */
export interface CreateEndpointRequest {
	name: string;
	parent_uuid: string;
	method?: string;
	base_url?: string;
	path?: string;
}

/**
 * Data model for endpoint creation result
 */
export interface CreateEndpointData {
	message: string;
	uuid: string;
	name: string;
	slug: string;
}

/**
 * Response from POST /api/collections/endpoint
 */
export interface CreateEndpointResponse {
	success: boolean;
	data?: CreateEndpointData;
}

/**
 * Request body for DELETE /api/collections/endpoint
 */
export interface DeleteEndpointRequest {
	uuid: string;
}

/**
 * Data model for endpoint deletion result
 */
export interface DeleteEndpointData {
	message: string;
	uuid: string;
	slug: string;
}

/**
 * Response from DELETE /api/collections/endpoint
 */
export interface DeleteEndpointResponse {
	success: boolean;
	data?: DeleteEndpointData;
}
