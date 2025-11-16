import { ipcChannels } from '@/config/ipc-channels';
import {
	createAsyncThunk,
	createSlice,
} from '@reduxjs/toolkit';
import {
	ReorderItemRequest,
	ToggleOpenStateRequest,
	CreateCollectionRequest,
	DeleteCollectionRequest,
} from '@/types/backend/collections/collection';

export interface Endpoint {
	uuid: string;
	name: string;
	type: 'endpoint';
	seq: number;
	method: string;
	url: string;
	created_at: string;
	updated_at: string;
}

export interface Folder {
	uuid: string;
	name: string;
	type: 'folder';
	seq: number;
	items?: (Folder | Endpoint)[];
	is_opened: boolean;
	created_at: string;
	updated_at: string;
}

export interface Collection {
	uuid: string;
	name: string;
	type: 'collection';
	seq: number;
	items?: (Folder | Endpoint)[];
	is_opened: boolean;
	created_at: string;
	updated_at: string;
}

interface CollectionState {
	collections: Collection[];
	loading: boolean;
	error: string | null;
	reordering: boolean;
	reorderError: string | null;
	toggling: boolean;
	toggleError: string | null;
	creating: boolean;
	createError: string | null;
	deleting: boolean;
	deleteError: string | null;
}

const initialState: CollectionState = {
	collections: [],
	loading: false,
	error: null,
	reordering: false,
	reorderError: null,
	toggling: false,
	toggleError: null,
	creating: false,
	createError: null,
	deleting: false,
	deleteError: null,
};

export const getCollections = createAsyncThunk(
	'collection/getCollections',
	async (_, { rejectWithValue }) => {
		const result = await window.electron.ipcRenderer.invoke(
			ipcChannels.BACKEND_COLLECTIONS_GET,
		);
		if (result && result.success && result.data) {
			return result.data as Collection[];
		}
		// eslint-disable-next-line no-console
		console.error('Collections API failed:', result);
		return rejectWithValue(
			result?.error || 'Failed to get collections',
		);
	},
);

export const reorderCollectionItem = createAsyncThunk(
	'collection/reorderItem',
	async (
		request: {
			itemUuid: string;
			destinationFolderUuid: string | null;
			destinationSeq: number;
		},
		{ rejectWithValue },
	) => {
		const requestData: ReorderItemRequest = {
			item_uuid: request.itemUuid,
			destination_folder_uuid:
				request.destinationFolderUuid,
			destination_seq: request.destinationSeq,
		};

		const result = await window.electron.ipcRenderer.invoke(
			ipcChannels.BACKEND_COLLECTIONS_REORDER,
			requestData,
		);

		if (result && result.success) {
			return result.data;
		}

		// eslint-disable-next-line no-console
		console.error('Reorder item API failed:', result);
		return rejectWithValue(
			result?.error || 'Failed to reorder item',
		);
	},
);

export const toggleItemOpenState = createAsyncThunk(
	'collection/toggleOpenState',
	async (
		request: {
			uuid: string;
			isOpened: boolean;
		},
		{ rejectWithValue },
	) => {
		const requestData: ToggleOpenStateRequest = {
			uuid: request.uuid,
			is_opened: request.isOpened,
		};

		const result = await window.electron.ipcRenderer.invoke(
			ipcChannels.BACKEND_COLLECTIONS_TOGGLE_OPEN,
			requestData,
		);

		if (result && result.success) {
			return result.data;
		}

		// eslint-disable-next-line no-console
		console.error('Toggle open state API failed:', result);
		return rejectWithValue(
			result?.error || 'Failed to toggle open state',
		);
	},
);

export const createCollection = createAsyncThunk(
	'collection/createCollection',
	async (
		request: {
			name: string;
		},
		{ rejectWithValue },
	) => {
		const requestData: CreateCollectionRequest = {
			name: request.name,
		};

		const result = await window.electron.ipcRenderer.invoke(
			ipcChannels.BACKEND_COLLECTIONS_CREATE,
			requestData,
		);

		if (result && result.success) {
			return result.data;
		}

		// eslint-disable-next-line no-console
		console.error('Create collection API failed:', result);
		return rejectWithValue(
			result?.data?.error || 'Failed to create collection',
		);
	},
);

export const deleteCollection = createAsyncThunk(
	'collection/deleteCollection',
	async (
		request: {
			uuid: string;
		},
		{ rejectWithValue },
	) => {
		const requestData: DeleteCollectionRequest = {
			uuid: request.uuid,
		};

		const result = await window.electron.ipcRenderer.invoke(
			ipcChannels.BACKEND_COLLECTIONS_DELETE,
			requestData,
		);

		if (result && result.success) {
			return result.data;
		}

		// eslint-disable-next-line no-console
		console.error('Delete collection API failed:', result);
		return rejectWithValue(
			result?.data?.error || 'Failed to delete collection',
		);
	},
);

export const collectionSlice = createSlice({
	name: 'collection',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			// Get collections
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
				state.error = action.payload as string;
			})
			// Reorder item
			.addCase(reorderCollectionItem.pending, (state) => {
				state.reordering = true;
				state.reorderError = null;
			})
			.addCase(reorderCollectionItem.fulfilled, (state) => {
				state.reordering = false;
				// Optionally refetch collections after reorder
			})
			.addCase(
				reorderCollectionItem.rejected,
				(state, action) => {
					state.reordering = false;
					state.reorderError = action.payload as string;
				},
			)
			// Toggle open state
			.addCase(toggleItemOpenState.pending, (state) => {
				state.toggling = true;
				state.toggleError = null;
			})
			.addCase(toggleItemOpenState.fulfilled, (state) => {
				state.toggling = false;
				// State will be updated by subsequent getCollections call
			})
			.addCase(
				toggleItemOpenState.rejected,
				(state, action) => {
					state.toggling = false;
					state.toggleError = action.payload as string;
				},
			)
			// Create collection
			.addCase(createCollection.pending, (state) => {
				state.creating = true;
				state.createError = null;
			})
			.addCase(createCollection.fulfilled, (state) => {
				state.creating = false;
				// Optionally refetch collections after creation
			})
			.addCase(
				createCollection.rejected,
				(state, action) => {
					state.creating = false;
					state.createError = action.payload as string;
				},
			)
			// Delete collection
			.addCase(deleteCollection.pending, (state) => {
				state.deleting = true;
				state.deleteError = null;
			})
			.addCase(deleteCollection.fulfilled, (state) => {
				state.deleting = false;
				// Optionally refetch collections after deletion
			})
			.addCase(
				deleteCollection.rejected,
				(state, action) => {
					state.deleting = false;
					state.deleteError = action.payload as string;
				},
			);
	},
});

export default collectionSlice.reducer;
