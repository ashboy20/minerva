import { useEffect, useCallback, useRef } from 'react';
import { Input } from '@/renderer/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/renderer/components/ui/select';
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@/renderer/components/ui/tabs';
import { Card, CardContent } from '@/renderer/components/ui/card';
import { Textarea } from '@/renderer/components/ui/textarea';
import { TableForm } from '@/renderer/components/views/apiClient/request-section/InputForm';
import { Case, Endpoint, Row } from '@/types/backend/endpoint-management/endpoint';
import UrlBar from '@/renderer/components/views/apiClient/request-section/UrlBar';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
	initializeUrl,
	updateFromUrl,
	updatePathParams,
	updateQueryParams,
	clearUpdateSource,
} from '@/store/slices/urlSlice';


interface RequestSectionProps {
	activeEndpoint: Endpoint | null;
	activeCase: Case | null;
	activeTab: string;
	loading: boolean;
	onMethodChange: (method: string) => void;
	onUrlChange: (url: string) => void;
	onPathParamsChange: (pathParams: Row[]) => void;
	onQueryParamsChange: (queryParams: Row[]) => void;
	onHeadersChange: (headers: Row[]) => void;
	onBodyChange: (body: string) => void;
	onAuthTypeChange: (authType: string) => void;
	onActiveTabChange: (tab: string) => void;
	onSendRequest: () => void;
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

export function RequestSection({
	activeEndpoint,
	activeCase,
	activeTab,
	loading,
	onMethodChange,
	onUrlChange,
	onPathParamsChange,
	onQueryParamsChange,
	onHeadersChange,
	onBodyChange,
	onAuthTypeChange,
	onActiveTabChange,
	onSendRequest,
}: RequestSectionProps) {
	const dispatch = useAppDispatch();
	const { fullUrl, pathParams, queryParams, lastUpdateSource } = useAppSelector(state => state.url);

	// Initialize URL state when endpoint/case changes
	useEffect(() => {
		if (activeEndpoint) {
			const baseUrl = activeEndpoint.base_url || '';
			const path = activeEndpoint.path || '';
			const initialPathParams = activeCase?.request?.path_params || [];
			const initialQueryParams = activeCase?.request?.query_params || [];
			
			dispatch(initializeUrl({
				baseUrl,
				path,
				pathParams: initialPathParams,
				queryParams: initialQueryParams
			}));
		}
	}, [activeEndpoint, activeCase, dispatch]);

	// Clean up update source after state changes (faster cleanup)
	useEffect(() => {
		if (lastUpdateSource) {
			const timeout = setTimeout(() => {
				dispatch(clearUpdateSource());
			}, 10); // Much faster cleanup
			return () => clearTimeout(timeout);
		}
	}, [lastUpdateSource, dispatch]);

	// Show path params table if URL has path parameters OR if there are existing path params
	const showPathParams = pathParams.length > 0;

	const handleUrlChange = (newUrl: string) => {
		dispatch(updateFromUrl(newUrl));
		onUrlChange?.(newUrl);
	};

	// Debounce path params updates to prevent infinite loops
	const pathParamsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	
	const handlePathParamsChange = useCallback((newPathParams: Row[]) => {
		// Clear previous timeout
		if (pathParamsTimeoutRef.current) {
			clearTimeout(pathParamsTimeoutRef.current);
		}
		
		// Immediately update Redux (for UI responsiveness)
		dispatch(updatePathParams(newPathParams));
		
		// Debounce parent callback to prevent cascading updates
		pathParamsTimeoutRef.current = setTimeout(() => {
			onPathParamsChange?.(newPathParams);
		}, 50);
	}, [dispatch, onPathParamsChange]);

	// Debounce query params updates to prevent infinite loops
	const queryParamsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	
	const handleQueryParamsChange = useCallback((newQueryParams: Row[]) => {
		// Clear previous timeout
		if (queryParamsTimeoutRef.current) {
			clearTimeout(queryParamsTimeoutRef.current);
		}
		
		// Immediately update Redux (for UI responsiveness)
		dispatch(updateQueryParams(newQueryParams));
		
		// Debounce parent callback to prevent cascading updates
		queryParamsTimeoutRef.current = setTimeout(() => {
			onQueryParamsChange?.(newQueryParams);
		}, 50);
	}, [dispatch, onQueryParamsChange]);
	
	// Cleanup timeouts on unmount
	useEffect(() => {
		return () => {
			if (pathParamsTimeoutRef.current) {
				clearTimeout(pathParamsTimeoutRef.current);
			}
			if (queryParamsTimeoutRef.current) {
				clearTimeout(queryParamsTimeoutRef.current);
			}
		};
	}, []);

	return (
		<div className="h-full p-4 overflow-y-auto">
			<Card className="h-full border-none flex flex-col">
				<CardContent className="space-y-4 p-4 flex-1 flex flex-col">
					{/* URL Bar */}
					<UrlBar
						method={activeEndpoint?.method ?? 'GET'}
						url={fullUrl}
						loading={loading}
						onMethodChange={onMethodChange}
						onUrlChange={handleUrlChange}
						onSendRequest={onSendRequest}
					/>

					{/* Request Configuration Tabs */}
					<Tabs
						value={activeTab}
						onValueChange={onActiveTabChange}
						className="flex-1 flex flex-col" 
					>
						<TabsList className="grid w-full grid-cols-6">
							<TabsTrigger value="params">Params</TabsTrigger>
							<TabsTrigger value="headers">Headers</TabsTrigger>
							<TabsTrigger value="body">Body</TabsTrigger>
							<TabsTrigger value="auth">Auth</TabsTrigger>
							<TabsTrigger value="pre-request-scripts">
								Pre-Request Scripts
							</TabsTrigger>
							<TabsTrigger value="tests">Tests</TabsTrigger>
						</TabsList>
						<TabsContent value="params" className="space-y-2 flex-1">
							{showPathParams && (
							<TableForm 
								rows={pathParams} 
								title="Path Params" 
								onChange={handlePathParamsChange} 
								isPathParamTable={true}
							/>
							)}
							<TableForm rows={queryParams} title="Query Params" onChange={handleQueryParamsChange} />
						</TabsContent>
						<TabsContent value="headers" className="space-y-2 flex-1">
							<TableForm rows={activeCase?.request?.headers || []} onChange={onHeadersChange} />
						</TabsContent>
						<TabsContent
							value="body"
							className="space-y-2 flex-1 flex flex-col"
						>
							<Textarea
								placeholder="Enter request body (JSON, XML, etc.)"
								value={stringifyBody(activeCase?.request?.body)}
								onChange={(e) => onBodyChange(e.target.value)}
								className="font-mono text-sm flex-1 resize-none"
								disabled={
									activeEndpoint?.method === 'GET' ||
									activeEndpoint?.method === 'HEAD'
								}
							/>
							{(activeEndpoint?.method === 'GET' ||
								activeEndpoint?.method === 'HEAD') && (
								<p className="text-sm text-muted-foreground">
									Body is not applicable for GET requests
								</p>
							)}
						</TabsContent>
						<TabsContent value="auth" className="flex-1 flex items-start">
							<div className="flex flex-col gap-2 w-full">
								<Select value="auth_type" onValueChange={onAuthTypeChange}>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Bearer">Bearer</SelectItem>
									</SelectContent>
								</Select>
								<Input placeholder="put token here" type="password" />
							</div>
						</TabsContent>
						{/* TODO: create content for pre-request scripts and tests */}
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}
