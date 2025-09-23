import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { useGlobalContext } from '@/renderer/context/global-context';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@/renderer/components/ui/resizable';
import { EndpointList } from '@/renderer/components/views/apiClient/components/EndpointList';
import { RequestSection } from '@/renderer/components/views/apiClient/request-section/RequestSection';
import { ResponseSection } from '@/renderer/components/views/apiClient/components/ResponseSection';
import { LayoutSwitcher } from '@/renderer/components/views/apiClient/top-nav-bar/LayoutSwitcher';
import { TabBar } from '@/renderer/components/views/apiClient/top-nav-bar/TabBar';
import ApiCallService from '@/renderer/services/apiCallService';
import {
	Row,
	Endpoint,
} from '@/types/backend/endpoint-management/endpoint';
import { 
	fetchEndpoints, 
	setActiveEndpoint, 
	updateActiveEndpoint, 
	updateActiveCase 
} from '@/store/slices/endpointsSlice';

interface ApiResponse {
	status: number;
	statusText: string;
	headers: Record<string, string>;
	data: any;
	time: number;
	size: number;
}

export function RequestBuilder() {
	const dispatch = useAppDispatch();
	const [response, setResponse] = useState<ApiResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState('headers');
	
	// Get global settings including layout preference
	const { settings } = useGlobalContext();
	
	// Get URL state from Redux
	const { pathParams, queryParams } = useAppSelector(state => state.url);
	// Get headers and auth state from Redux
	const { headers, auth } = useAppSelector(state => state.headersAuth);
	// Get endpoints state from Redux
	const { endpoints, activeEndpoint, activeCase, loading: endpointsLoading } = useAppSelector(state => state.endpoints);

	const handleEndpointClick = (endpoint: Endpoint) => {
		dispatch(setActiveEndpoint({ endpoint }));
	};

	const sendRequest = async () => {
		if (!activeEndpoint || !activeCase) return;

		setLoading(true);

		try {
			// Build headers object from Redux state
			const requestHeaders: Record<string, string> = {};
			headers.forEach((header: Row) => {
				if (header.enabled && header.keyValue && header.value) {
					requestHeaders[header.keyValue] = header.value;
				}
			});

			// Build query parameters from Redux state
			const requestQueryParams: Record<string, string> = {};
			queryParams.forEach((param: Row) => {
				if (param.enabled && param.keyValue && param.value) {
					requestQueryParams[param.keyValue] = param.value;
				}
			});

			// Construct the full URL
			const baseUrl = activeEndpoint.base_url + activeEndpoint.path;

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
			const authConfig = auth.authType !== 'None' && auth.token ? {
				auth_type: auth.authType,
				token: auth.token
			} : undefined;

			// Call API through Python backend
			const backendResponse = await ApiCallService.callEndpoint({
				method: activeEndpoint.method,
				url: baseUrl,
				headers: Object.keys(requestHeaders).length > 0 ? requestHeaders : undefined,
				query_params: Object.keys(requestQueryParams).length > 0 ? requestQueryParams : undefined,
				body: requestBody,
				auth: authConfig
			});

			// Convert backend response to frontend format
			setResponse({
				status: backendResponse.status_code,
				statusText: backendResponse.status_code >= 400 ? 'Error' : 'OK',
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
					error: error instanceof Error ? error.message : 'Unknown error',
				},
				time: 0,
				size: 0,
			});
		} finally {
			setLoading(false);
		}
	};

	// Fetch endpoints from FastAPI backend service on mount
	useEffect(() => {
		dispatch(fetchEndpoints());
	}, [dispatch]);

	// Handler functions for RequestSection
	const handleMethodChange = (method: string) => {
		dispatch(updateActiveEndpoint({ method }));
	};

	const handleUrlChange = (url: string) => {
		// Parse the URL to extract base_url and path
		try {
			const urlObj = new URL(url);
			const basePath = urlObj.origin;
			const path = urlObj.pathname + urlObj.search;
			dispatch(updateActiveEndpoint({ base_url: basePath, path }));
		} catch {
			// If URL parsing fails, just update the path
			dispatch(updateActiveEndpoint({ path: url }));
		}
	};

	const handleBodyChange = (body: string) => {
		if (activeCase) {
			dispatch(updateActiveCase({
				request: {
					...activeCase.request,
					body: body as any, // Allow string or object for body
				},
			}));
		}
	};

	return (
		<ResizablePanelGroup
			direction="horizontal"
			className="min-h-[calc(100vh-200px)]"
		>
			{/* Left Sidebar - Endpoints List */}
			<ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
				<EndpointList
					endpoints={endpoints}
					onEndpointClick={handleEndpointClick}
				/>
			</ResizablePanel>

			<ResizableHandle />
			{/* Right Side - Main Content */}
			<ResizablePanel defaultSize={75} minSize={60}>
				<div className="flex flex-col h-full">
					{/* Top Bar with Tabs */}
					<div className="flex flex-col">
						<div className="flex items-center justify-between p-4 border-b border-border h-12">
							<TabBar />
							<LayoutSwitcher />
						</div>
					</div>

					{/* Request/Response Content */}
					<div className="flex-1">
						<ResizablePanelGroup 
							direction={settings.apiClientLayout === 'horizontal' ? 'horizontal' : 'vertical'} 
							className="h-full"
						>
							<ResizablePanel defaultSize={60} minSize={30}>
								<RequestSection
									activeEndpoint={activeEndpoint}
									activeCase={activeCase}
									activeTab={activeTab}
									loading={loading}
									onMethodChange={handleMethodChange}
									onUrlChange={handleUrlChange}
									onPathParamsChange={() => {}} // No-op since Redux handles this
									onQueryParamsChange={() => {}} // No-op since Redux handles this
									onHeadersChange={() => {}} // No-op since Redux handles this
									onBodyChange={handleBodyChange}
									onAuthChange={() => {}} // No-op since Redux handles this
									onActiveTabChange={setActiveTab}
									onSendRequest={sendRequest}
								/>
							</ResizablePanel>

							<ResizableHandle withHandle />

							<ResizablePanel defaultSize={40} minSize={20}>
								<ResponseSection response={response} />
							</ResizablePanel>
						</ResizablePanelGroup>
					</div>
				</div>
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}
