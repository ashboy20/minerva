import {
	createSlice,
	PayloadAction,
} from '@reduxjs/toolkit';
import { Row } from '@/types/backend/common';

interface AuthData {
	authType: string;
	token: string;
}

interface HeadersAuthState {
	headers: Row[];
	auth: AuthData;
	lastUpdateSource: 'headers' | 'auth' | null;
}

const initialState: HeadersAuthState = {
	headers: [],
	auth: {
		authType: 'Bearer',
		token: '',
	},
	lastUpdateSource: null,
};

// Helper function to find bearer token header
const findBearerHeaderIndex = (headers: Row[]): number => {
	return headers.findIndex(
		(header) =>
			header.keyValue?.toLowerCase() === 'authorization' &&
			header.value?.toLowerCase().startsWith('bearer '),
	);
};

// Helper function to create bearer token header
const createBearerHeader = (token: string): Row => ({
	row_id: Date.now(), // Simple ID generation
	keyValue: 'Authorization',
	value: token
		? `Bearer ${'*'.repeat(Math.min(token.length, 20))}`
		: 'Bearer ',
	enabled: true,
	disabled: true, // Disable editing since it's auto-generated from auth
});

export const headersAuthSlice = createSlice({
	name: 'headersAuth',
	initialState,
	reducers: {
		// Initialize headers and auth from active case
		initializeHeadersAuth: (
			state,
			action: PayloadAction<{
				headers: Row[];
				auth: AuthData;
			}>,
		) => {
			state.headers = action.payload.headers;
			state.auth = action.payload.auth;
			state.lastUpdateSource = null;
		},

		// Update headers directly
		updateHeaders: (
			state,
			action: PayloadAction<Row[]>,
		) => {
			// Prevent redundant updates
			if (
				JSON.stringify(state.headers) ===
				JSON.stringify(action.payload)
			) {
				return;
			}

			const newHeaders = action.payload;
			const bearerHeaderIndex =
				findBearerHeaderIndex(newHeaders);

			// If user removes the Authorization header, clear the auth token
			if (
				state.auth.authType === 'Bearer' &&
				bearerHeaderIndex === -1
			) {
				state.auth.token = '';
			}

			// If there's a Bearer token in auth and an Authorization header exists,
			// ensure it shows the masked value and is disabled
			if (
				state.auth.authType === 'Bearer' &&
				state.auth.token &&
				bearerHeaderIndex !== -1
			) {
				const maskedValue = `Bearer ${'*'.repeat(Math.min(state.auth.token.length, 20))}`;
				newHeaders[bearerHeaderIndex] = {
					...newHeaders[bearerHeaderIndex],
					value: maskedValue,
					disabled: true, // Mark as disabled since it's auto-generated
				};
			}

			state.headers = newHeaders;
			state.lastUpdateSource = 'headers';
		},

		// Update auth data
		updateAuth: (
			state,
			action: PayloadAction<AuthData>,
		) => {
			// Prevent redundant updates
			if (
				JSON.stringify(state.auth) ===
				JSON.stringify(action.payload)
			) {
				return;
			}

			const previousAuthType = state.auth.authType;
			const previousToken = state.auth.token;

			state.auth = action.payload;
			state.lastUpdateSource = 'auth';

			// Handle Bearer token header logic
			const bearerHeaderIndex = findBearerHeaderIndex(
				state.headers,
			);

			if (action.payload.authType === 'Bearer') {
				if (action.payload.token) {
					// Add or update bearer token header
					const newBearerHeader = createBearerHeader(
						action.payload.token,
					);

					if (bearerHeaderIndex !== -1) {
						// Update existing bearer header with masked value and disabled state
						state.headers[bearerHeaderIndex] = {
							...state.headers[bearerHeaderIndex],
							value: newBearerHeader.value,
							disabled: true,
						};
					} else {
						// Add new bearer header
						state.headers.push(newBearerHeader);
					}
				} else {
					// Remove bearer header if token is empty
					if (bearerHeaderIndex !== -1) {
						state.headers.splice(bearerHeaderIndex, 1);
					}
				}
			} else {
				// If auth type changed from Bearer to something else, remove bearer header
				if (
					previousAuthType === 'Bearer' &&
					bearerHeaderIndex !== -1
				) {
					state.headers.splice(bearerHeaderIndex, 1);
				}
			}
		},

		// Clear update source
		clearUpdateSource: (state) => {
			state.lastUpdateSource = null;
		},

		// Reset to initial state
		resetHeadersAuth: (state) => {
			state.headers = [];
			state.auth = {
				authType: 'Bearer',
				token: '',
			};
			state.lastUpdateSource = null;
		},
	},
});

export const {
	initializeHeadersAuth,
	updateHeaders,
	updateAuth,
	clearUpdateSource,
	resetHeadersAuth,
} = headersAuthSlice.actions;

export default headersAuthSlice.reducer;
