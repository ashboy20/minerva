import {
	createSlice,
	PayloadAction,
	createAsyncThunk,
} from '@reduxjs/toolkit';
import {
	Endpoint,
	Case,
} from '@/types/backend/endpoint-management/endpoint';
import { ipcChannels } from '@/config/ipc-channels';

// Type for API responses
interface ApiResponse<T = any> {
	success: boolean;
	data: T;
}

// Type for endpoint creation request
interface CreateEndpointRequest {
	operation_id: string;
	name: string;
	summary?: string;
	description?: string;
	method: string;
	path: string;
	base_url: string;
	cases?: any[];
}

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
			const result =
				await window.electron.ipcRenderer.invoke(
					ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_ENDPOINT_GET,
				);

			// Check if the API call was successful
			if (
				result &&
				result.success &&
				result.data &&
				result.data.endpoints
			) {
				return result.data.endpoints as Endpoint[];
			}

			// Handle API error response
			if (result && !result.success) {
				return rejectWithValue(
					result.data?.error || 'API call failed',
				);
			}

			return [];
		} catch (error) {
			console.error('Failed to fetch endpoints:', error);
			return rejectWithValue('Failed to fetch endpoints');
		}
	},
);

// Async thunk for creating an endpoint
export const createEndpoint = createAsyncThunk(
	'endpoints/createEndpoint',
	async (
		endpointData: CreateEndpointRequest,
		{ rejectWithValue },
	) => {
		try {
			const result =
				await window.electron.ipcRenderer.invoke(
					ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_ENDPOINT_CREATE,
					endpointData,
				);

			if (
				result &&
				result.success &&
				result.data &&
				result.data.endpoint
			) {
				return result.data.endpoint as Endpoint;
			}

			if (result && !result.success) {
				return rejectWithValue(
					result.data?.error || 'Failed to create endpoint',
				);
			}

			return rejectWithValue('Unexpected response format');
		} catch (error) {
			console.error('Failed to create endpoint:', error);
			return rejectWithValue('Failed to create endpoint');
		}
	},
);

// Async thunk for updating an endpoint
export const updateEndpoint = createAsyncThunk(
	'endpoints/updateEndpoint',
	async (
		{ uuid, updateData }: { uuid: string; updateData: any },
		{ rejectWithValue },
	) => {
		try {
			const result =
				await window.electron.ipcRenderer.invoke(
					ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_ENDPOINT_UPDATE,
					uuid,
					updateData,
				);

			if (
				result &&
				result.success &&
				result.data &&
				result.data.endpoint
			) {
				return result.data.endpoint as Endpoint;
			}

			if (result && !result.success) {
				return rejectWithValue(
					result.data?.error || 'Failed to update endpoint',
				);
			}

			return rejectWithValue('Unexpected response format');
		} catch (error) {
			console.error('Failed to update endpoint:', error);
			return rejectWithValue('Failed to update endpoint');
		}
	},
);

// Async thunk for deleting an endpoint
export const deleteEndpoint = createAsyncThunk(
	'endpoints/deleteEndpoint',
	async (uuid: string, { rejectWithValue }) => {
		try {
			const result =
				await window.electron.ipcRenderer.invoke(
					ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_ENDPOINT_DELETE,
					uuid,
				);

			if (result && result.success) {
				return uuid; // Return the UUID of the deleted endpoint
			}

			if (result && !result.success) {
				return rejectWithValue(
					result.data?.error || 'Failed to delete endpoint',
				);
			}

			return rejectWithValue('Unexpected response format');
		} catch (error) {
			console.error('Failed to delete endpoint:', error);
			return rejectWithValue('Failed to delete endpoint');
		}
	},
);

export const endpointsSlice = createSlice({
	name: 'endpoints',
	initialState,
	reducers: {
		// Set active endpoint and optionally active case
		setActiveEndpoint: (
			state,
			action: PayloadAction<{
				endpoint: Endpoint;
				caseIndex?: number;
			}>,
		) => {
			state.activeEndpoint = action.payload.endpoint;

			// Set active case - use provided index or default to first case
			const caseIndex = action.payload.caseIndex ?? 0;
			if (
				action.payload.endpoint.cases &&
				action.payload.endpoint.cases.length > 0
			) {
				state.activeCase =
					action.payload.endpoint.cases[caseIndex] ||
					action.payload.endpoint.cases[0];
			} else {
				state.activeCase = null;
			}
		},

		// Set active case for the current endpoint
		setActiveCase: (state, action: PayloadAction<Case>) => {
			state.activeCase = action.payload;
		},

		// Update the active endpoint (for changes like method, URL, etc.)
		updateActiveEndpoint: (
			state,
			action: PayloadAction<Partial<Endpoint>>,
		) => {
			if (state.activeEndpoint) {
				state.activeEndpoint = {
					...state.activeEndpoint,
					...action.payload,
				};
			}
		},

		// Update the active case (for changes like body, etc.)
		updateActiveCase: (
			state,
			action: PayloadAction<Partial<Case>>,
		) => {
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
			// Fetch endpoints
			.addCase(fetchEndpoints.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(
				fetchEndpoints.fulfilled,
				(state, action) => {
					state.loading = false;
					state.endpoints = action.payload;
					state.error = null;

					// Auto-select first endpoint and case if available
					if (action.payload.length > 0) {
						state.activeEndpoint = action.payload[0];
						if (
							action.payload[0].cases &&
							action.payload[0].cases.length > 0
						) {
							state.activeCase = action.payload[0].cases[0];
						}
					}
				},
			)
			.addCase(fetchEndpoints.rejected, (state, action) => {
				state.loading = false;
				state.error =
					(action.payload as string) ||
					'Failed to fetch endpoints';
			})
			// Create endpoint
			.addCase(createEndpoint.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(
				createEndpoint.fulfilled,
				(state, action) => {
					state.loading = false;
					state.endpoints.push(action.payload);
					state.error = null;
				},
			)
			.addCase(createEndpoint.rejected, (state, action) => {
				state.loading = false;
				state.error =
					(action.payload as string) ||
					'Failed to create endpoint';
			})
			// Update endpoint
			.addCase(updateEndpoint.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(
				updateEndpoint.fulfilled,
				(state, action) => {
					state.loading = false;
					const index = state.endpoints.findIndex(
						(ep) => ep.uuid === action.payload.uuid,
					);
					if (index !== -1) {
						state.endpoints[index] = action.payload;
						// Update active endpoint if it's the one being updated
						if (
							state.activeEndpoint?.uuid ===
							action.payload.uuid
						) {
							state.activeEndpoint = action.payload;
						}
					}
					state.error = null;
				},
			)
			.addCase(updateEndpoint.rejected, (state, action) => {
				state.loading = false;
				state.error =
					(action.payload as string) ||
					'Failed to update endpoint';
			})
			// Delete endpoint
			.addCase(deleteEndpoint.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(
				deleteEndpoint.fulfilled,
				(state, action) => {
					state.loading = false;
					const deletedUuid = action.payload;
					state.endpoints = state.endpoints.filter(
						(ep) => ep.uuid !== deletedUuid,
					);

					// Clear active endpoint if it was deleted
					if (state.activeEndpoint?.uuid === deletedUuid) {
						state.activeEndpoint =
							state.endpoints.length > 0
								? state.endpoints[0]
								: null;
						state.activeCase =
							state.activeEndpoint?.cases?.[0] || null;
					}
					state.error = null;
				},
			)
			.addCase(deleteEndpoint.rejected, (state, action) => {
				state.loading = false;
				state.error =
					(action.payload as string) ||
					'Failed to delete endpoint';
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
