import React, { useEffect, useState } from 'react';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@/renderer/components/ui/resizable';
import { EndpointList } from '@/renderer/components/views/apiClient/components/EndpointList';
import { RequestSection } from '@/renderer/components/views/apiClient/components/RequestSection';
import { ResponseSection } from '@/renderer/components/views/apiClient/components/ResponseSection';
import {
	defaultParams,
	defaultHeaders,
	defaultUrl,
	defaultBody,
} from '@/data/apiClient';
import { ipcChannels } from '@/config/ipc-channels';
import { Button } from '@/components/ui/button';

interface Row {
	id: number;
	keyValue: string;
	value: string;
	enabled: boolean;
}

interface ApiResponse {
	status: number;
	statusText: string;
	headers: Record<string, string>;
	data: any;
	time: number;
	size: number;
}

export function RequestBuilder() {
	const [method, setMethod] = useState('GET');
	const [authType, setAuthType] = useState('Bearer');
	const [url, setUrl] = useState(defaultUrl);
	const [params, _setParams] = useState<Row[]>(defaultParams);
	const [headers, setHeaders] = useState<Row[]>(defaultHeaders);
	const [body, setBody] = useState(defaultBody);
	const [response, setResponse] = useState<ApiResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState('headers');
	const [endpoints, setEndpoints] = useState([]);
	const [_endpointsLoading, setEndpointsLoading] = useState(true);

	const handleEndpointClick = (endpoint) => {
		// Update the request form with selected endpoint data
		setMethod(endpoint.method);
		setUrl(endpoint.url);

		// Set headers if provided
		if (endpoint.headers) {
			setHeaders(endpoint.headers);
		}

		// Set body if provided
		if (endpoint.body) {
			setBody(endpoint.body);
		}
	};

	const sendRequest = async () => {
		setLoading(true);
		const startTime = Date.now();

		try {
			// Build headers object from committed headers
			const requestHeaders: Record<string, string> = {};
			headers.forEach((header) => {
				if (header.enabled && header.keyValue && header.value) {
					requestHeaders[header.keyValue] = header.value;
				}
			});

			// Prepare request options
			const requestOptions: {
				method: string;
				headers: Record<string, string>;
				body?: string;
			} = {
				method,
				headers: requestHeaders,
			};

			// Add body for non-GET requests
			if (method !== 'GET' && method !== 'HEAD' && body.trim()) {
				requestOptions.body = body;
			}

			const fetchResponse = await fetch(url, requestOptions);
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

				console.log("result from the fast api")
				console.log('result: ', result);
				if (result && result.endpoints) {
					setEndpoints(result.endpoints);
				}
			} catch {
				// Fallback to empty array if fetch fails
				setEndpoints([]);
			} finally {
				setEndpointsLoading(false);
			}
		};

		fetchEndpoints();
	}, []);

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
							method={method}
							url={url}
							params={params}
							headers={headers}
							body={body}
							authType={authType}
							activeTab={activeTab}
							loading={loading}
							onMethodChange={setMethod}
							onUrlChange={setUrl}
							onBodyChange={setBody}
							onAuthTypeChange={setAuthType}
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
