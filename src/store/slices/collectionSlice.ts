import { ipcChannels } from '@/config/ipc-channels';
import {
	createAsyncThunk,
	createSlice,
} from '@reduxjs/toolkit';
import { ReorderItemRequest } from '@/types/backend/collections/collection';

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
	created_at: string;
	updated_at: string;
}

export interface Collection {
	uuid: string;
	name: string;
	type: 'collection';
	seq: number;
	items?: (Folder | Endpoint)[];
	created_at: string;
	updated_at: string;
}

interface CollectionState {
	collections: Collection[];
	loading: boolean;
	error: string | null;
	reordering: boolean;
	reorderError: string | null;
}

const initialState: CollectionState = {
	collections: [],
	loading: false,
	error: null,
	reordering: false,
	reorderError: null,
};

export const getCollections = createAsyncThunk(
	'newCollection/getCollections',
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
	'newCollection/reorderItem',
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
			destination_folder_uuid: request.destinationFolderUuid,
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

export const newCollectionSlice = createSlice({
	name: 'newCollection',
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
			);
	},
});

export default newCollectionSlice.reducer;
