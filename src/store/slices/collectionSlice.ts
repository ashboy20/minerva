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
	openIds: string[];
}

const initialState: CollectionState = {
	collections: [],
	loading: false,
	error: null,
	openIds: [],
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

export const createItem = createAsyncThunk(
	'collection/createItem',
	async (
		{
			name,
			type,
			parentUuid,
			method,
			url,
		}: {
			name: string;
			type: 'folder' | 'endpoint';
			parentUuid: string;
			method?: string;
			url?: string;
		},
		{ rejectWithValue },
	) => {
		const result = await window.electron.ipcRenderer.invoke(
			ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_ITEM_CREATE,
			{
				name,
				type,
				parent_uuid: parentUuid,
				method,
				url,
			},
		);

		if (result && result.success && result.data) {
			return result.data;
		}

		console.error('Create item API failed:', result);
		return rejectWithValue(
			result?.data?.error ||
				result?.error ||
				'Failed to create item',
		);
	},
);

export const loadOpenIds = createAsyncThunk(
	'collection/loadOpenIds',
	async () => {
		const result = await window.electron.ipcRenderer.invoke(
			ipcChannels.GET_COLLECTION_OPEN_IDS,
		);
		return result && Array.isArray(result) ? result : [];
	},
);

export const setOpenIds = createAsyncThunk(
	'collection/setOpenIds',
	async (openIds: string[], { dispatch }) => {
		await window.electron.ipcRenderer.invoke(
			ipcChannels.SET_COLLECTION_OPEN_IDS,
			openIds,
		);
		return openIds;
	},
);

export const deleteItem = createAsyncThunk(
	'collection/deleteItem',
	async (uuid: string, { rejectWithValue, dispatch }) => {
		const result = await window.electron.ipcRenderer.invoke(
			ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_ITEM_DELETE,
			uuid,
		);

		if (result && result.success) {
			// Refresh collections after successful deletion
			await dispatch(getCollections());
			return result.data;
		}

		return rejectWithValue(
			result?.error || 'Failed to delete item',
		);
	},
);

export const getEndpoint = createAsyncThunk(
	'collection/getEndpoint',
	async (uuid: string, { rejectWithValue }) => {
		const result = await window.electron.ipcRenderer.invoke(
			ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_ENDPOINT_GET,
			uuid,
		);

		if (result && result.success && result.data) {
			return result.data as Endpoint;
		}

		return rejectWithValue(
			result?.error || 'Failed to get endpoint',
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
			.addCase(loadOpenIds.fulfilled, (state, action) => {
				state.openIds = action.payload;
			})
			.addCase(setOpenIds.fulfilled, (state, action) => {
				state.openIds = action.payload;
			});
	},
});

export default collectionSlice.reducer;
