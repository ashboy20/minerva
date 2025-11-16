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
