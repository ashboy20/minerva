import {
	useEffect,
	useCallback,
	useRef,
	useState,
} from 'react';
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@/renderer/components/ui/tabs';
import {
	Card,
	CardContent,
} from '@/renderer/components/ui/card';
import { JsonEditorComponent } from '@/renderer/components/views/apiClient/components/JsonEditorComponent';
import { TableForm } from '@/renderer/components/views/apiClient/request-section/InputForm';
import { Row } from '@/types/backend/endpoint-management/endpoint';
import UrlBar from '@/renderer/components/views/apiClient/request-section/UrlBar';
import { AuthSection } from '@/renderer/components/views/apiClient/request-section/AuthSection';
import {
	useAppDispatch,
	useAppSelector,
} from '@/store/hooks';
import {
	initializeUrl,
	updateFromUrl,
	updatePathParams,
	updateQueryParams,
	clearUpdateSource,
} from '@/store/slices/urlSlice';
import {
	initializeHeadersAuth,
	updateHeaders,
	updateAuth,
	clearUpdateSource as clearHeadersAuthUpdateSource,
} from '@/store/slices/headersAuthSlice';
import {
	updateActiveEndpoint,
	updateActiveCase,
} from '@/store/slices/endpointsSlice';
import ApiCallService from '@/renderer/services/apiCallService';

interface ApiResponse {
	status: number;
	statusText: string;
	headers: Record<string, string>;
	data: any;
	time: number;
	size: number;
}

const stringifyBody = (body: any) => {
	if (typeof body === 'string') {
		return body;
	}
	if (body === null || body === undefined) {
		return '';
	}
	try {
		return JSON.stringify(body, null, 2);
	} catch (error) {
		return String(body);
	}
};

export function RequestSection() {
	const dispatch = useAppDispatch();
	const [activeTab, setActiveTab] = useState('headers');
	const [loading, setLoading] = useState(false);
	const [response, setResponse] =
		useState<ApiResponse | null>(null);

	// Get all necessary state from Redux
	const {
		fullUrl,
		pathParams,
		queryParams,
		lastUpdateSource,
	} = useAppSelector((state) => state.url);
	const {
		headers,
		auth,
		lastUpdateSource: headersAuthUpdateSource,
	} = useAppSelector((state) => state.headersAuth);

	// Get the active endpoint and case from tabs state
	const { tabs, activeTabId } = useAppSelector(
		(state) => state.tabs,
	);
	const currentTab = tabs.find(
		(tab) => tab.endpoint.uuid === activeTabId,
	);
	const activeEndpoint = currentTab?.endpoint;
	const activeCase = activeEndpoint?.cases.find(
		(c) => c.uuid === currentTab?.activeCaseId,
	);

	// Initialize URL and headers/auth state when endpoint/case changes
	useEffect(() => {
		if (activeEndpoint) {
			const url = activeEndpoint.url || '';
			const initialPathParams =
				activeCase?.request?.path_params || [];
			const initialQueryParams =
				activeCase?.request?.query_params || [];
			const initialHeaders =
				activeCase?.request?.headers || [];
			const initialAuth = {
				authType:
					activeCase?.request?.auth?.auth_type || 'Bearer',
				token: activeCase?.request?.auth?.token || '',
			};

			// Split URL into base and path
			const urlParts = url.match(
				/^(https?:\/\/[^\/]+)(\/.*)?$/,
			);
			const baseUrl = urlParts ? urlParts[1] : '';
			const path = urlParts ? urlParts[2] || '/' : url;

			dispatch(
				initializeUrl({
					baseUrl,
					path,
					pathParams: initialPathParams,
					queryParams: initialQueryParams,
				}),
			);

			dispatch(
				initializeHeadersAuth({
					headers: initialHeaders,
					auth: initialAuth,
				}),
			);
		}
	}, [activeEndpoint, activeCase, dispatch]);

	// Clean up update source after state changes
	useEffect(() => {
		if (lastUpdateSource) {
			const timeout = setTimeout(() => {
				dispatch(clearUpdateSource());
			}, 10);
			return () => clearTimeout(timeout);
		}
	}, [lastUpdateSource, dispatch]);

	useEffect(() => {
		if (headersAuthUpdateSource) {
			const timeout = setTimeout(() => {
				dispatch(clearHeadersAuthUpdateSource());
			}, 10);
			return () => clearTimeout(timeout);
		}
	}, [headersAuthUpdateSource, dispatch]);

	// Show path params table if URL has path parameters OR if there are existing path params
	const showPathParams = pathParams.length > 0;

	const handleMethodChange = (method: string) => {
		if (activeEndpoint) {
			dispatch(
				updateActiveEndpoint({
					...activeEndpoint,
					method,
				}),
			);
		}
	};

	const handleUrlChange = (newUrl: string) => {
		dispatch(updateFromUrl(newUrl));
		if (activeEndpoint) {
			dispatch(
				updateActiveEndpoint({
					...activeEndpoint,
					url: newUrl,
				}),
			);
		}
	};

	// Debounce path params updates
	const pathParamsTimeoutRef =
		useRef<NodeJS.Timeout | null>(null);
	const handlePathParamsChange = useCallback(
		(newPathParams: Row[]) => {
			if (pathParamsTimeoutRef.current) {
				clearTimeout(pathParamsTimeoutRef.current);
			}
			dispatch(updatePathParams(newPathParams));
			if (activeCase) {
				pathParamsTimeoutRef.current = setTimeout(() => {
					dispatch(
						updateActiveCase({
							...activeCase,
							request: {
								...activeCase.request,
								path_params: newPathParams,
							},
						}),
					);
				}, 50);
			}
		},
		[dispatch, activeCase],
	);

	// Debounce query params updates
	const queryParamsTimeoutRef =
		useRef<NodeJS.Timeout | null>(null);
	const handleQueryParamsChange = useCallback(
		(newQueryParams: Row[]) => {
			if (queryParamsTimeoutRef.current) {
				clearTimeout(queryParamsTimeoutRef.current);
			}
			dispatch(updateQueryParams(newQueryParams));
			if (activeCase) {
				queryParamsTimeoutRef.current = setTimeout(() => {
					dispatch(
						updateActiveCase({
							...activeCase,
							request: {
								...activeCase.request,
								query_params: newQueryParams,
							},
						}),
					);
				}, 50);
			}
		},
		[dispatch, activeCase],
	);

	// Debounce headers updates
	const headersTimeoutRef = useRef<NodeJS.Timeout | null>(
		null,
	);
	const handleHeadersChange = useCallback(
		(newHeaders: Row[]) => {
			if (headersTimeoutRef.current) {
				clearTimeout(headersTimeoutRef.current);
			}
			dispatch(updateHeaders(newHeaders));
			if (activeCase) {
				headersTimeoutRef.current = setTimeout(() => {
					dispatch(
						updateActiveCase({
							...activeCase,
							request: {
								...activeCase.request,
								headers: newHeaders,
							},
						}),
					);
				}, 50);
			}
		},
		[dispatch, activeCase],
	);

	// Debounce auth updates
	const authTimeoutRef = useRef<NodeJS.Timeout | null>(
		null,
	);
	const handleAuthChange = useCallback(
		(authType: string, token: string) => {
			if (authTimeoutRef.current) {
				clearTimeout(authTimeoutRef.current);
			}
			dispatch(updateAuth({ authType, token }));
			if (activeCase) {
				authTimeoutRef.current = setTimeout(() => {
					dispatch(
						updateActiveCase({
							...activeCase,
							request: {
								...activeCase.request,
								auth: {
									auth_type: authType,
									token,
								},
							},
						}),
					);
				}, 50);
			}
		},
		[dispatch, activeCase],
	);

	const handleBodyChange = (body: string) => {
		if (activeCase) {
			try {
				// Try to parse as JSON first
				const parsedBody = JSON.parse(body);
				dispatch(
					updateActiveCase({
						...activeCase,
						request: {
							...activeCase.request,
							body: parsedBody,
						},
					}),
				);
			} catch (error) {
				// If parsing fails, store as Record<string, any>
				dispatch(
					updateActiveCase({
						...activeCase,
						request: {
							...activeCase.request,
							body: { content: body },
						},
					}),
				);
			}
		}
	};

	const handleSendRequest = async () => {
		if (!activeEndpoint || !activeCase) return;

		setLoading(true);

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

			// Prepare request body for non-GET requests
			let requestBody: string | object | undefined;
			if (
				activeEndpoint.method !== 'GET' &&
				activeEndpoint.method !== 'HEAD' &&
				activeCase.request?.body
			) {
				requestBody = activeCase.request.body;
			}

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
					method: activeEndpoint.method,
					url: fullUrl,
					headers:
						Object.keys(requestHeaders).length > 0
							? requestHeaders
							: undefined,
					query_params:
						Object.keys(requestQueryParams).length > 0
							? requestQueryParams
							: undefined,
					body: requestBody,
					auth: authConfig,
				});

			// Convert backend response to frontend format
			setResponse({
				status: backendResponse.status_code,
				statusText:
					backendResponse.status_code >= 400
						? 'Error'
						: 'OK',
				headers: backendResponse.headers,
				data: backendResponse.body,
				time: backendResponse.response_time,
				size: backendResponse.size,
			});
		} catch (error) {
			setResponse({
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
		} finally {
			setLoading(false);
		}
	};

	// Cleanup timeouts on unmount
	useEffect(() => {
		return () => {
			if (pathParamsTimeoutRef.current) {
				clearTimeout(pathParamsTimeoutRef.current);
			}
			if (queryParamsTimeoutRef.current) {
				clearTimeout(queryParamsTimeoutRef.current);
			}
			if (headersTimeoutRef.current) {
				clearTimeout(headersTimeoutRef.current);
			}
			if (authTimeoutRef.current) {
				clearTimeout(authTimeoutRef.current);
			}
		};
	}, []);

	return (
		<div className="h-full overflow-y-auto p-4">
			<Card className="flex h-full flex-col border-none">
				<CardContent className="space-y-4 p-4">
					{/* URL Bar */}
					<UrlBar
						loading={loading}
						onSendRequest={handleSendRequest}
					/>

					{/* Request Configuration Tabs */}
					<Tabs
						value={activeTab}
						onValueChange={setActiveTab}
						className="flex flex-1 flex-col"
					>
						<TabsList className="mb-2 grid w-full grid-cols-6">
							<TabsTrigger value="params">
								Params
							</TabsTrigger>
							<TabsTrigger value="headers">
								Headers
							</TabsTrigger>
							<TabsTrigger value="body">Body</TabsTrigger>
							<TabsTrigger value="auth">Auth</TabsTrigger>
							<TabsTrigger value="pre-request-scripts">
								Pre-Request Scripts
							</TabsTrigger>
							<TabsTrigger value="tests">Tests</TabsTrigger>
						</TabsList>
						<TabsContent
							value="params"
							className="flex-1 space-y-2"
						>
							{showPathParams && (
								<TableForm
									rows={pathParams}
									title="Path Params"
									onChange={handlePathParamsChange}
									isPathParamTable
								/>
							)}
							<TableForm
								rows={queryParams}
								title="Query Params"
								onChange={handleQueryParamsChange}
							/>
						</TabsContent>
						<TabsContent
							value="headers"
							className="flex-1 space-y-2"
						>
							<TableForm
								rows={headers}
								onChange={handleHeadersChange}
								isHeaderTable
							/>
						</TabsContent>
						<TabsContent
							value="body"
							className="flex max-h-screen flex-1 flex-col space-y-2 overflow-auto"
						>
							<JsonEditorComponent
								placeholder="{}"
								value={stringifyBody(
									activeCase?.request?.body,
								)}
								onChange={handleBodyChange}
								className="flex-1"
								disabled={
									activeEndpoint?.method === 'GET' ||
									activeEndpoint?.method === 'HEAD'
								}
								darkTheme
							/>
							{(activeEndpoint?.method === 'GET' ||
								activeEndpoint?.method === 'HEAD') && (
								<p className="text-sm text-muted-foreground">
									Body is not applicable for GET requests
								</p>
							)}
						</TabsContent>
						<TabsContent
							value="auth"
							className="flex-1 space-y-2"
						>
							<AuthSection
								authType={auth.authType}
								token={auth.token}
								onAuthChange={handleAuthChange}
							/>
						</TabsContent>
						<TabsContent
							value="pre-request-scripts"
							className="flex-1 space-y-2"
						/>
						<TabsContent
							value="tests"
							className="flex-1 space-y-2"
						/>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}
