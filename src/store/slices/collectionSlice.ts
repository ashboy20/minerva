import { ipcChannels } from '@/config/ipc-channels';
import {
	createAsyncThunk,
	createSlice,
} from '@reduxjs/toolkit';

export interface Variable {
	key: string;
	value: string;
}

export interface Item {
	uuid: string;
	name: string;
	type: 'folder' | 'endpoint';
	description?: string;
	parent_uuid?: string;
	created_at: string;
	updated_at: string;
}

export interface Folder extends Item {
	type: 'folder';
	items?: Item[]; // This will be populated when needed
}

export interface EndpointRequest {
	url: string;
	auth: Record<string, string>;
	headers: Record<string, string>[];
	query: Record<string, string>[];
	path_params: Record<string, string>[];
	body: string;
}

export interface EndpointResponse {
	status: number;
	headers: Record<string, string>[];
	body: string;
}

export interface Case {
	name: string;
	request: EndpointRequest;
	response: EndpointResponse;
}

export interface Endpoint extends Item {
	type: 'endpoint';
	method: string;
	url: string;
	cases: Case[];
}

export interface Collection {
	uuid: string;
	name: string;
	type: 'collection';
	description?: string;
	variables: Variable[];
	items?: (Folder | Endpoint)[]; // This will be populated when needed
	created_at: string;
	updated_at: string;
}

interface CollectionState {
	collections: Collection[];
	loading: boolean;
	error: string | null;
}

const initialState: CollectionState = {
	collections: [],
	loading: false,
	error: null,
};

export const getCollections = createAsyncThunk(
	'collection/getCollections',
	async (_, { rejectWithValue }) => {
		const result = await window.electron.ipcRenderer.invoke(
			ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_COLLECTIONS_GET,
		);

		if (result && result.success && result.data) {
			return result.data as Collection[];
		}

		console.error('Collections API failed:', result);
		return rejectWithValue(
			result?.data?.error ||
				result?.error ||
				'Failed to get collections',
		);
	},
);

export const createBlankCollection = createAsyncThunk(
	'collection/createBlankCollection',
	async (_, { rejectWithValue }) => {
		const result = await window.electron.ipcRenderer.invoke(
			ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_COLLECTION_CREATE,
		);

		if (result && result.success && result.data) {
			return result.data as Collection;
		}

		console.error(
			'Create blank collection API failed:',
			result,
		);
		return rejectWithValue(
			result?.data?.error ||
				result?.error ||
				'Failed to create blank collection',
		);
	},
);

export const reorder = createAsyncThunk(
	'collection/reorder',
	async (
		{
			draggedUuid,
			oldParentUuid,
			newParentUuid,
			relativeIndex,
		}: {
			draggedUuid: string;
			oldParentUuid: string;
			newParentUuid: string;
			relativeIndex: number;
		},
		{ rejectWithValue },
	) => {
		const result = await window.electron.ipcRenderer.invoke(
			ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_REORDER,
			draggedUuid,
			oldParentUuid,
			newParentUuid,
			relativeIndex,
		);
		return rejectWithValue(
			result?.data?.error ||
				result?.error ||
				'Failed to reorder collections',
		);
	},
);

export const renameCollection = createAsyncThunk(
	'collection/renameCollection',
	async (
		{ uuid, newName }: { uuid: string; newName: string },
		{ rejectWithValue },
	) => {
		const result = await window.electron.ipcRenderer.invoke(
			ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_COLLECTION_RENAME,
			uuid,
			newName,
		);

		if (result && result.success) {
			return { uuid, newName };
		}

		console.error('Rename collection API failed:', result);
		return rejectWithValue(
			result?.data?.error ||
				result?.error ||
				'Failed to rename collection',
		);
	},
);

export const renameFolder = createAsyncThunk(
	'collection/renameFolder',
	async (
		{ uuid, newName }: { uuid: string; newName: string },
		{ rejectWithValue },
	) => {
		const result = await window.electron.ipcRenderer.invoke(
			ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_FOLDER_RENAME,
			uuid,
			newName,
		);

		if (result && result.success) {
			return { uuid, newName };
		}

		console.error('Rename folder API failed:', result);
		return rejectWithValue(
			result?.data?.error ||
				result?.error ||
				'Failed to rename folder',
		);
	},
);

export const renameEndpoint = createAsyncThunk(
	'collection/renameEndpoint',
	async (
		{ uuid, newName }: { uuid: string; newName: string },
		{ rejectWithValue },
	) => {
		const result = await window.electron.ipcRenderer.invoke(
			ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_ENDPOINT_RENAME,
			uuid,
			newName,
		);

		if (result && result.success) {
			return { uuid, newName };
		}

		console.error('Rename endpoint API failed:', result);
		return rejectWithValue(
			result?.data?.error ||
				result?.error ||
				'Failed to rename endpoint',
		);
	},
);

export const updateItem = createAsyncThunk(
	'collection/updateItem',
	async (
		{ uuid, fields }: { uuid: string; fields: any },
		{ rejectWithValue },
	) => {
		const result = await window.electron.ipcRenderer.invoke(
			ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_ITEM_UPDATE,
			uuid,
			fields,
		);

		if (result && result.success) {
			return {
				uuid,
				fields,
			};
		}

		console.error('Rename item API failed:', result);
		return rejectWithValue(
			result?.data?.error ||
				result?.error ||
				'Failed to rename item',
		);
	},
);

export const collectionSlice = createSlice({
	name: 'collection',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(getCollections.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(
				getCollections.fulfilled,
				(state, action) => {
					state.loading = false;
					state.collections = action.payload;
				},
			)
			.addCase(getCollections.rejected, (state, action) => {
				state.loading = false;
				state.error =
					(action.payload as string) ||
					'Failed to get collections';
			})
			.addCase(
				renameCollection.fulfilled,
				(state, action) => {
					const { uuid, newName } = action.payload;
					const collection = state.collections.find(
						(c) => c.uuid === uuid,
					);
					if (collection) {
						collection.name = newName;
					}
				},
			)
			.addCase(renameFolder.fulfilled, (state, action) => {
				const { uuid, newName } = action.payload;
				// Find and update folder in collections
				state.collections.forEach((collection) => {
					if (collection.items) {
						const updateItem = (items: any[]) => {
							items.forEach((item) => {
								if (
									item.uuid === uuid &&
									item.type === 'folder'
								) {
									item.name = newName;
								} else if (
									item.type === 'folder' &&
									item.items
								) {
									updateItem(item.items);
								}
							});
						};
						updateItem(collection.items);
					}
				});
			})
			.addCase(
				renameEndpoint.fulfilled,
				(state, action) => {
					const { uuid, newName } = action.payload;
					// Find and update endpoint in collections
					state.collections.forEach((collection) => {
						if (collection.items) {
							const updateItem = (items: any[]) => {
								items.forEach((item) => {
									if (
										item.uuid === uuid &&
										item.type === 'endpoint'
									) {
										item.name = newName;
									} else if (
										item.type === 'folder' &&
										item.items
									) {
										updateItem(item.items);
									}
								});
							};
							updateItem(collection.items);
						}
					});
				},
			);
	},
});

export default collectionSlice.reducer;
