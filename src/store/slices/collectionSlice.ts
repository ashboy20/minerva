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
			});
	},
});

export default collectionSlice.reducer;
