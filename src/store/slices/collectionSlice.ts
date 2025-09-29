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
	name: string;
	type: string;
}

export interface Folder extends Item {
	type: 'folder';
	items: Item[];
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
	path: string;
	cases: Case[];
}

export interface Collection {
	uuid: string;
	info: {
		name: string;
		description: string;
		[key: string]: any;
	};
	variables: Variable[];
	items: (Folder | Endpoint)[];
	createdAt: Date;
	updatedAt: Date;
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

		console.log('Collections API result:', result);

		if (result && result.success && result.data) {
			console.log('Collections data:', result.data);
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
