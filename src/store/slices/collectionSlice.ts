import { ipcChannels } from '@/config/ipc-channels';
import {
	createAsyncThunk,
	createSlice,
} from '@reduxjs/toolkit';

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
}

const initialState: CollectionState = {
	collections: [],
	loading: false,
	error: null,
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
		console.error('Collections API failed:', result);
		return rejectWithValue(
			result?.error || 'Failed to get collections',
		);
	},
);

export const newCollectionSlice = createSlice({
	name: 'newCollection',
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
				state.error = action.payload as string;
			});
	},
});

export default newCollectionSlice.reducer;
