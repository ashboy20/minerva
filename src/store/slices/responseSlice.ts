import {
	createSlice,
	createAsyncThunk,
	PayloadAction,
} from '@reduxjs/toolkit';
import ApiCallService from '@/renderer/services/apiCallService';
import { Row } from '@/types/backend/common';

interface ApiResponse {
	status: number;
	statusText: string;
	headers: Record<string, string>;
	data: any;
	time: number;
	size: number;
}

interface ResponseState {
	response: ApiResponse | null;
	loading: boolean;
	error: string | null;
}

const initialState: ResponseState = {
	response: null,
	loading: false,
	error: null,
};

export const sendRequest = createAsyncThunk(
	'response/sendRequest',
	async (
		{
			method,
			url,
			headers,
			queryParams,
			body,
			auth,
		}: {
			method: string;
			url: string;
			headers: Row[];
			queryParams: Row[];
			body: any;
			auth: {
				authType: string;
				token: string;
			};
		},
		{ rejectWithValue },
	) => {
		try {
			// Build headers object from Redux state
			const requestHeaders: Record<string, string> = {};
			headers.forEach((header: Row) => {
				if (
					header.enabled &&
					header.keyValue &&
					header.value
				) {
					requestHeaders[header.keyValue] = header.value;
				}
			});

			// Build query parameters from Redux state
			const requestQueryParams: Record<string, string> = {};
			queryParams.forEach((param: Row) => {
				if (
					param.enabled &&
					param.keyValue &&
					param.value
				) {
					requestQueryParams[param.keyValue] = param.value;
				}
			});

			// Prepare auth configuration
			const authConfig =
				auth.authType !== 'None' && auth.token
					? {
							auth_type: auth.authType,
							token: auth.token,
						}
					: undefined;

			// Call API through Python backend
			const backendResponse =
				await ApiCallService.callEndpoint({
					method,
					url,
					headers:
						Object.keys(requestHeaders).length > 0
							? requestHeaders
							: undefined,
					query_params:
						Object.keys(requestQueryParams).length > 0
							? requestQueryParams
							: undefined,
					body,
					auth: authConfig,
				});

			// If the backend request failed
			if (!backendResponse.success) {
				return rejectWithValue({
					status: backendResponse.data.status_code,
					statusText: 'Error',
					headers: backendResponse.data.headers,
					data: backendResponse.data.body,
					time: backendResponse.data.response_time,
					size: backendResponse.data.size,
				});
			}

			// Convert backend response to frontend format
			return {
				status: backendResponse.data.status_code,
				statusText:
					backendResponse.data.status_code >= 400
						? 'Error'
						: 'OK',
				headers: backendResponse.data.headers,
				data: backendResponse.data.body,
				time: backendResponse.data.response_time,
				size: backendResponse.data.size,
			} as ApiResponse;
		} catch (error) {
			return rejectWithValue({
				status: 0,
				statusText: 'Network Error',
				headers: {},
				data: {
					error:
						error instanceof Error
							? error.message
							: 'Unknown error',
				},
				time: 0,
				size: 0,
			});
		}
	},
);

export const responseSlice = createSlice({
	name: 'response',
	initialState,
	reducers: {
		clearResponse: (state) => {
			state.response = null;
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(sendRequest.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(
				sendRequest.fulfilled,
				(state, action: PayloadAction<ApiResponse>) => {
					state.loading = false;
					state.response = action.payload;
					state.error = null;
				},
			)
			.addCase(sendRequest.rejected, (state, action) => {
				state.loading = false;
				state.response = action.payload as ApiResponse;
				state.error = 'Failed to send request';
			});
	},
});

export const { clearResponse } = responseSlice.actions;

export default responseSlice.reducer;
