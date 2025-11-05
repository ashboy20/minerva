import {
	createSlice,
	PayloadAction,
} from '@reduxjs/toolkit';
import { Row } from '@/types/backend/endpoint-management/endpoint';

interface UrlState {
	baseUrl: string;
	path: string;
	pathParams: Row[];
	queryParams: Row[];
	fullUrl: string;
	lastUpdateSource:
		| 'url'
		| 'pathParams'
		| 'queryParams'
		| null;
}

const initialState: UrlState = {
	baseUrl: '',
	path: '',
	pathParams: [],
	queryParams: [],
	fullUrl: '',
	lastUpdateSource: null,
};

// Utility functions
const parsePathParams = (path: string): Row[] => {
	// First, remove any protocol part (http://, https://) to avoid false matches
	const pathWithoutProtocol = path.replace(
		/^https?:\/\/[^\/]*/,
		'',
	);

	// Now find path parameters (colon followed by alphanumeric/underscore)
	const pathParamsRegex = /\:[a-zA-Z0-9_]+/g;
	const matches =
		pathWithoutProtocol.match(pathParamsRegex) || [];

	return matches.map((param, index) => ({
		row_id: index + 1,
		keyValue: param.replace(':', ''),
		value: '',
		enabled: true,
	}));
};

const parseQueryParams = (url: string): Row[] => {
	try {
		// Handle cases where URL might not have protocol
		const urlToUse = url.startsWith('http')
			? url
			: `http://localhost${url.startsWith('/') ? url : `/${url}`}`;
		const urlObj = new URL(urlToUse);
		const params = Array.from(
			urlObj.searchParams.entries(),
		);
		return params.map(([key, value], index) => ({
			row_id: index + 1,
			keyValue: key,
			value,
			enabled: true,
		}));
	} catch {
		return [];
	}
};

const buildUrlFromParams = (
	baseUrl: string,
	path: string,
	pathParams: Row[],
	queryParams: Row[],
): string => {
	// Strip existing query parameters from path to prevent duplication
	const [pathWithoutQuery] = path.split('?');
	let fullUrl = baseUrl + pathWithoutQuery;

	// Replace path parameters with values (for preview, keep placeholders for template)
	pathParams.forEach((param) => {
		if (param.enabled && param.keyValue && param.value) {
			fullUrl = fullUrl.replace(
				`:${param.keyValue}`,
				param.value,
			);
		}
	});

	// Add query parameters - ALWAYS rebuild from scratch to avoid duplication
	const enabledQueryParams = queryParams.filter(
		(p) => p.enabled && p.keyValue && p.value,
	);
	if (enabledQueryParams.length > 0) {
		const queryString = enabledQueryParams
			.map(
				(p) =>
					`${encodeURIComponent(p.keyValue)}=${encodeURIComponent(p.value)}`,
			)
			.join('&');
		fullUrl += `?${queryString}`;
	}

	// URL decode the final URL
	try {
		fullUrl = decodeURIComponent(fullUrl);
	} catch {
		// If decoding fails, return the original URL
		console.error('Error decoding URL:', fullUrl);
	}
	return fullUrl;
};

const extractBaseAndPath = (
	fullUrl: string,
	currentBaseUrl: string = '',
): { baseUrl: string; path: string } => {
	// Remove query parameters first
	const [urlWithoutQuery] = fullUrl.split('?');

	// If currentBaseUrl exists and URL starts with it, extract path
	if (
		currentBaseUrl &&
		urlWithoutQuery.startsWith(currentBaseUrl)
	) {
		return {
			baseUrl: currentBaseUrl,
			path:
				urlWithoutQuery.replace(currentBaseUrl, '') || '/',
		};
	}

	// Try to detect base URL pattern
	const urlPattern = /^(https?:\/\/[^\/]+)(\/.*)?$/;
	const match = urlWithoutQuery.match(urlPattern);

	if (match) {
		return {
			baseUrl: match[1],
			path: match[2] || '/',
		};
	}

	// If no protocol, assume it's a path
	return {
		baseUrl: currentBaseUrl,
		path: urlWithoutQuery.startsWith('/')
			? urlWithoutQuery
			: `/${urlWithoutQuery}`,
	};
};

export const urlSlice = createSlice({
	name: 'url',
	initialState,
	reducers: {
		// Initialize from endpoint data
		initializeUrl: (
			state,
			action: PayloadAction<{
				baseUrl: string;
				path: string;
				pathParams?: Row[];
				queryParams?: Row[];
			}>,
		) => {
			const {
				baseUrl,
				path,
				pathParams = [],
				queryParams = [],
			} = action.payload;
			state.baseUrl = baseUrl;
			state.path = path;
			state.pathParams = pathParams;
			state.queryParams = queryParams;
			state.fullUrl = buildUrlFromParams(
				baseUrl,
				path,
				pathParams,
				queryParams,
			);
			state.lastUpdateSource = null;
		},

		// Update from URL input field (like Postman/Bruno URL bar)
		updateFromUrl: (
			state,
			action: PayloadAction<string>,
		) => {
			const newUrl = action.payload;

			// Check if URL actually changed to prevent unnecessary processing
			if (state.fullUrl === newUrl) {
				return;
			}

			// Prevent circular updates when we just updated from params
			if (
				state.lastUpdateSource === 'pathParams' ||
				state.lastUpdateSource === 'queryParams'
			) {
				state.lastUpdateSource = null;
				return;
			}

			state.fullUrl = newUrl;
			
			// Extract base URL and path
			const { baseUrl, path } = extractBaseAndPath(
				newUrl,
				state.baseUrl,
			);
			state.baseUrl = baseUrl;
			state.path = path;

			// Parse parameters from URL
			state.pathParams = parsePathParams(path);
			state.queryParams = parseQueryParams(newUrl);

			state.lastUpdateSource = 'url';
		},

		// Update path parameters from table
		updatePathParams: (
			state,
			action: PayloadAction<Row[]>,
		) => {
			const newPathParams = action.payload;

			// Check if parameters actually changed to prevent unnecessary updates
			const hasChanged =
				JSON.stringify(state.pathParams) !==
				JSON.stringify(newPathParams);
			if (!hasChanged) {
				return;
			}

			state.pathParams = newPathParams;

			// Update path with new parameter names
			const newPath = state.path;
			// Remove protocol part before processing
			const pathWithoutProtocol = newPath.replace(
				/^https?:\/\/[^\/]*/,
				'',
			);
			const pathParamsRegex = /\:[a-zA-Z0-9_]+/g;
			const pathParamsLocated =
				pathWithoutProtocol.match(pathParamsRegex);

			if (
				pathParamsLocated &&
				state.pathParams.length > 0
			) {
				// Replace each path parameter in order
				let updatedPath = newPath;
				pathParamsLocated.forEach((oldParam, index) => {
					if (
						state.pathParams[index] &&
						state.pathParams[index].keyValue
					) {
						const newParam = `:${state.pathParams[index].keyValue}`;
						// Replace the specific occurrence by position
						updatedPath = updatedPath.replace(
							oldParam,
							newParam,
						);
					}
				});

				state.path = updatedPath;
			}

			state.fullUrl = buildUrlFromParams(
				state.baseUrl,
				state.path,
				state.pathParams,
				state.queryParams,
			);
			state.lastUpdateSource = 'pathParams';
		},

		// Update query parameters from table
		updateQueryParams: (
			state,
			action: PayloadAction<Row[]>,
		) => {
			const newQueryParams = action.payload;

			// Check if parameters actually changed to prevent unnecessary updates
			const hasChanged =
				JSON.stringify(state.queryParams) !==
				JSON.stringify(newQueryParams);
			if (!hasChanged) {
				return;
			}

			state.queryParams = newQueryParams;
			state.fullUrl = buildUrlFromParams(
				state.baseUrl,
				state.path,
				state.pathParams,
				state.queryParams,
			);
			state.lastUpdateSource = 'queryParams';
		},

		// Clear update source (for cleanup)
		clearUpdateSource: (state) => {
			state.lastUpdateSource = null;
		},

		// Reset to initial state
		resetUrl: (state) => {
			Object.assign(state, initialState);
		},
	},
});

export const {
	initializeUrl,
	updateFromUrl,
	updatePathParams,
	updateQueryParams,
	clearUpdateSource,
	resetUrl,
} = urlSlice.actions;

export default urlSlice.reducer;
