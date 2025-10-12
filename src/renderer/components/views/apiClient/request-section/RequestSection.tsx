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
import { updateNotSaveState } from '@/store/slices/tabsSlice';

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

	// Get all necessary state from Redux
	const {
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

	// Update endpoint in tab state and mark as unsaved
	const updateEndpointInTab = useCallback(
		(updatedCase: any) => {
			if (activeTabId && activeCase) {
				// Mark the tab as unsaved
				dispatch(
					updateNotSaveState({
						endpointId: activeTabId,
						notSaved: true,
					}),
				);
			}
		},
		[dispatch, activeTabId, activeCase],
	);

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
					updateEndpointInTab({
						...activeCase,
						request: {
							...activeCase.request,
							path_params: newPathParams,
						},
					});
				}, 50);
			}
		},
		[dispatch, activeCase, updateEndpointInTab],
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
					updateEndpointInTab({
						...activeCase,
						request: {
							...activeCase.request,
							query_params: newQueryParams,
						},
					});
				}, 50);
			}
		},
		[dispatch, activeCase, updateEndpointInTab],
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
					updateEndpointInTab({
						...activeCase,
						request: {
							...activeCase.request,
							headers: newHeaders,
						},
					});
				}, 50);
			}
		},
		[dispatch, activeCase, updateEndpointInTab],
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
					updateEndpointInTab({
						...activeCase,
						request: {
							...activeCase.request,
							auth: {
								auth_type: authType,
								token,
							},
						},
					});
				}, 50);
			}
		},
		[dispatch, activeCase, updateEndpointInTab],
	);

	const handleBodyChange = useCallback(
		(body: string) => {
			if (activeCase) {
				try {
					// Try to parse as JSON first
					const parsedBody = JSON.parse(body);
					updateEndpointInTab({
						...activeCase,
						request: {
							...activeCase.request,
							body: parsedBody,
						},
					});
				} catch (error) {
					// If parsing fails, store as Record<string, any>
					updateEndpointInTab({
						...activeCase,
						request: {
							...activeCase.request,
							body: { content: body },
						},
					});
				}
			}
		},
		[activeCase, updateEndpointInTab],
	);

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
			{activeTabId && (<Card className="flex h-full flex-col border-none">
				<CardContent className="space-y-4 p-4">
					{/* URL Bar */}
					<UrlBar />

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
			</Card>)}
		</div>
	);
}
