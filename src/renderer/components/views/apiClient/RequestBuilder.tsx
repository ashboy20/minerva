import React, { useEffect, useState } from 'react';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@/renderer/components/ui/resizable';
import { EndpointList } from '@/renderer/components/views/apiClient/components/EndpointList';
import { RequestSection } from '@/renderer/components/views/apiClient/components/RequestSection';
import { ResponseSection } from '@/renderer/components/views/apiClient/components/ResponseSection';
import { ipcChannels } from '@/config/ipc-channels';
import {
	Case,
	Endpoint,
	Row,
} from '@/types/backend/endpoint-management/endpoint';

interface ApiResponse {
	status: number;
	statusText: string;
	headers: Record<string, string>;
	data: any;
	time: number;
	size: number;
}

export function RequestBuilder() {
	const [response, setResponse] = useState<ApiResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState('headers');
	const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
	const [_endpointsLoading, setEndpointsLoading] = useState(true);

	const [activeEndpoint, setActiveEndpoint] = useState<Endpoint | null>(null);
	const [activeCase, setActiveCase] = useState<Case | null>(null);

	const handleEndpointClick = (endpoint: Endpoint) => {
		setActiveEndpoint(endpoint);
		// Set the first case as active by default
		if (endpoint.cases && endpoint.cases.length > 0) {
			setActiveCase(endpoint.cases[0]);
		}
	};

	const sendRequest = async () => {
		if (!activeEndpoint || !activeCase) return;

		setLoading(true);
		const startTime = Date.now();

		try {
			// TODO: call request by backend side?
			// Build headers object from the active case
			const requestHeaders: Record<string, string> = {};
			if (activeCase.request?.headers) {
				activeCase.request.headers.forEach((header: Row) => {
					if (header.enabled && header.keyValue && header.value) {
						requestHeaders[header.keyValue] = header.value;
					}
				});
			}

			// Build query parameters
			const queryParams = new URLSearchParams();
			if (activeCase.request?.query_params) {
				activeCase.request.query_params.forEach((param: Row) => {
					if (param.enabled && param.keyValue && param.value) {
						queryParams.append(param.keyValue, param.value);
					}
				});
			}

			// Construct the full URL
			const baseUrl = activeEndpoint.base_url + activeEndpoint.path;
			const fullUrl = queryParams.toString()
				? `${baseUrl}?${queryParams.toString()}`
				: baseUrl;

			// Prepare request options
			const requestOptions: {
				method: string;
				headers: Record<string, string>;
				body?: string;
			} = {
				method: activeEndpoint.method,
				headers: requestHeaders,
			};

			// Add body for non-GET requests
			if (
				activeEndpoint.method !== 'GET' &&
				activeEndpoint.method !== 'HEAD' &&
				activeCase.request?.body
			) {
				requestOptions.body =
					typeof activeCase.request.body === 'string'
						? activeCase.request.body
						: JSON.stringify(activeCase.request.body);
			}

			const fetchResponse = await fetch(fullUrl, requestOptions);
			const endTime = Date.now();
			const responseTime = endTime - startTime;

			// Get response headers
			const responseHeaders: Record<string, string> = {};
			fetchResponse.headers.forEach((value, key) => {
				responseHeaders[key] = value;
			});

			// Parse response data
			const contentType = fetchResponse.headers.get('content-type');
			let responseData;

			if (contentType?.includes('application/json')) {
				responseData = await fetchResponse.json();
			} else {
				responseData = await fetchResponse.text();
			}

			// Calculate response size (approximate)
			const responseSize = new Blob([JSON.stringify(responseData)]).size;

			setResponse({
				status: fetchResponse.status,
				statusText: fetchResponse.statusText,
				headers: responseHeaders,
				data: responseData,
				time: responseTime,
				size: responseSize,
			});
		} catch (error) {
			setResponse({
				status: 0,
				statusText: 'Network Error',
				headers: {},
				data: {
					error: error instanceof Error ? error.message : 'Unknown error',
				},
				time: Date.now() - startTime,
				size: 0,
			});
		} finally {
			setLoading(false);
		}
	};

	// Fetch endpoints from FastAPI backend service on mount
	useEffect(() => {
		const fetchEndpoints = async () => {
			try {
				setEndpointsLoading(true);
				const result = await window.electron.ipcRenderer.invoke(
					ipcChannels.BACKEND_ENDPOINT_MANAGEMENT_ENDPOINTS_GET,
				);

				if (result && result.data && result.data.length > 0) {
					setEndpoints(result.data);
					setActiveEndpoint(result.data[0]);
					if (result.data[0].cases && result.data[0].cases.length > 0) {
						setActiveCase(result.data[0].cases[0]);
					}
				}
			} catch (error) {
				console.error('Failed to fetch endpoints:', error);
				setEndpoints([]);
			} finally {
				setEndpointsLoading(false);
			}
		};

		fetchEndpoints();
	}, []);

	// Handler functions for RequestSection
	const handleMethodChange = (method: string) => {
		if (activeEndpoint) {
			setActiveEndpoint({ ...activeEndpoint, method });
		}
	};

	const handleUrlChange = (url: string) => {
		if (activeEndpoint) {
			// Parse the URL to extract base_url and path
			try {
				const urlObj = new URL(url);
				const basePath = urlObj.origin;
				const path = urlObj.pathname + urlObj.search;
				setActiveEndpoint({ ...activeEndpoint, base_url: basePath, path });
			} catch {
				// If URL parsing fails, just update the path
				setActiveEndpoint({ ...activeEndpoint, path: url });
			}
		}
	};

	const handleBodyChange = (body: string) => {
		if (activeCase) {
			setActiveCase({
				...activeCase,
				request: {
					...activeCase.request,
					body: body as any, // Allow string or object for body
				},
			});
		}
	};

	const handleAuthTypeChange = (authType: string) => {
		// This could be implemented to add/update auth headers
		console.log('Auth type changed:', authType);
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
				<ResizablePanelGroup direction="vertical" className="h-full">
					<ResizablePanel defaultSize={60} minSize={30}>
						<RequestSection
							activeEndpoint={activeEndpoint}
							activeCase={activeCase}
							activeTab={activeTab}
							loading={loading}
							onMethodChange={handleMethodChange}
							onUrlChange={handleUrlChange}
							onBodyChange={handleBodyChange}
							onAuthTypeChange={handleAuthTypeChange}
							onActiveTabChange={setActiveTab}
							onSendRequest={sendRequest}
						/>
					</ResizablePanel>

					<ResizableHandle withHandle />

					<ResizablePanel defaultSize={40} minSize={20}>
						<ResponseSection response={response} />
					</ResizablePanel>
				</ResizablePanelGroup>
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}
