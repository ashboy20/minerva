import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Endpoint, Case } from '@/types/backend/endpoint-management/endpoint';
import { ipcChannels } from '@/config/ipc-channels';

interface EndpointsState {
	endpoints: Endpoint[];
	activeEndpoint: Endpoint | null;
	activeCase: Case | null;
	loading: boolean;
	error: string | null;
}

const initialState: EndpointsState = {
	endpoints: [],
	activeEndpoint: null,
	activeCase: null,
	loading: false,
	error: null,
};

// Async thunk for fetching endpoints
export const fetchEndpoints = createAsyncThunk(
	'endpoints/fetchEndpoints',
	async (_, { rejectWithValue }) => {
		try {
			const result = await window.electron.ipcRenderer.invoke(
				ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_ENDPOINTS_GET,
			);

			if (result && result.data && result.data.length > 0) {
				return result.data as Endpoint[];
			}
			return [];
		} catch (error) {
			console.error('Failed to fetch endpoints:', error);
			return rejectWithValue('Failed to fetch endpoints');
		}
	}
);

export const endpointsSlice = createSlice({
	name: 'endpoints',
	initialState,
	reducers: {
		// Set active endpoint and optionally active case
		setActiveEndpoint: (state, action: PayloadAction<{ endpoint: Endpoint; caseIndex?: number }>) => {
			state.activeEndpoint = action.payload.endpoint;
			
			// Set active case - use provided index or default to first case
			const caseIndex = action.payload.caseIndex ?? 0;
			if (action.payload.endpoint.cases && action.payload.endpoint.cases.length > 0) {
				state.activeCase = action.payload.endpoint.cases[caseIndex] || action.payload.endpoint.cases[0];
			} else {
				state.activeCase = null;
			}
		},

		// Set active case for the current endpoint
		setActiveCase: (state, action: PayloadAction<Case>) => {
			state.activeCase = action.payload;
		},

		// Update the active endpoint (for changes like method, URL, etc.)
		updateActiveEndpoint: (state, action: PayloadAction<Partial<Endpoint>>) => {
			if (state.activeEndpoint) {
				state.activeEndpoint = {
					...state.activeEndpoint,
					...action.payload,
				};
			}
		},

		// Update the active case (for changes like body, etc.)
		updateActiveCase: (state, action: PayloadAction<Partial<Case>>) => {
			if (state.activeCase) {
				state.activeCase = {
					...state.activeCase,
					...action.payload,
				};
			}
		},

		// Clear error
		clearError: (state) => {
			state.error = null;
		},

		// Reset to initial state
		resetEndpoints: (state) => {
			state.endpoints = [];
			state.activeEndpoint = null;
			state.activeCase = null;
			state.loading = false;
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchEndpoints.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchEndpoints.fulfilled, (state, action) => {
				state.loading = false;
				state.endpoints = action.payload;
				state.error = null;
				
				// Auto-select first endpoint and case if available
				if (action.payload.length > 0) {
					state.activeEndpoint = action.payload[0];
					if (action.payload[0].cases && action.payload[0].cases.length > 0) {
						state.activeCase = action.payload[0].cases[0];
					}
				}
			})
			.addCase(fetchEndpoints.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string || 'Failed to fetch endpoints';
			});
	},
});

export const {
	setActiveEndpoint,
	setActiveCase,
	updateActiveEndpoint,
	updateActiveCase,
	clearError,
	resetEndpoints,
} = endpointsSlice.actions;

export default endpointsSlice.reducer;
