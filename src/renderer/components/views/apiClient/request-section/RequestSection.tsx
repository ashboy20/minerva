import { useEffect, useRef, useState } from 'react';
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

const getQueryParamsFromUrl = (url: string) => {
	try {
		// Handle cases where URL might not have protocol
		const urlToUse = url.startsWith('http') ? url : `http://localhost${url.startsWith('/') ? url : '/' + url}`;
		const urlObj = new URL(urlToUse);
		const params = Array.from(urlObj.searchParams.entries());
		return params.map(([key, value], index) => ({
			row_id: index + 1,
			keyValue: key,
			value: value,
			enabled: true,
		}));
	} catch (error) {
		// If URL parsing fails, return empty array
		return [];
	}
}

const urlPathParamsSync = (
	initUrl: string, 
	initPathParams: Row[],
	initQueryParams: Row[],
	onUrlChange?: (url: string) => void,
	onPathParamsChange?: (pathParams: Row[]) => void,
	onQueryParamsChange?: (queryParams: Row[]) => void
) => {
	const [url, setUrl] = useState(initUrl)
	const [pathParams, setPathParams] = useState(initPathParams)
	const [queryParams, setQueryParams] = useState(initQueryParams)
	const [showPathParams, setShowPathParams] = useState(false)

	useEffect(() => {
		setUrl(initUrl)
		setPathParams(initPathParams)
		setQueryParams(initQueryParams)
	}, [initUrl, initPathParams, initQueryParams])

	useEffect(() => {
		// Check if URL contains path parameters (like :id, :userId, etc.)
		const pathParamsRegex = /(?<!https?)\:[a-zA-Z0-9_]+/g
		const urlHasPathParams = url && pathParamsRegex.test(url)
		
		// Show path params table if URL has path parameters OR if there are existing path params
		if (urlHasPathParams || pathParams.length > 0) {
			setShowPathParams(true)
		} else {
			setShowPathParams(false)
		}
	}, [pathParams, url])

	const isUpdatingUrl = useRef(false)
	const isUpdatingPathParams = useRef(false)
	const isUpdatingQueryParams = useRef(false)
	const pathParamsRegex = /(?<!https?)\:[a-zA-Z0-9_]*/g

	const handleUrlChange = (newUrl: string) => {
		setUrl(newUrl)
		onUrlChange?.(newUrl)
		
		const pathParamsLocated = newUrl.match(pathParamsRegex)
		if (pathParamsLocated && !isUpdatingUrl.current) {
			let newPathParams: Row[] = []
			
			pathParamsLocated.forEach(param => {
				const paramName = param.replace(':', '')
				if (!newPathParams.find(p => p.keyValue === paramName)) {
					newPathParams.push({
						row_id: newPathParams.length + 1,
						keyValue: paramName,
						value: '',
						enabled: true,
					})
				} 
			})
			isUpdatingPathParams.current = true
			setPathParams(newPathParams)
			onPathParamsChange?.(newPathParams)
			
			setTimeout(() => {
				isUpdatingPathParams.current = false
			}, 0)
		}

        // Parse query parameters from URL
        if (!isUpdatingUrl.current) {
            let newQueryParams: Row[] = getQueryParamsFromUrl(newUrl)
            isUpdatingQueryParams.current = true
            setQueryParams(newQueryParams)
            
            setTimeout(() => {
                isUpdatingQueryParams.current = false
            }, 0)
        }
	}

	const handlePathParamsChange = (newPathParams: Row[]) => {
		setPathParams(newPathParams)
		onPathParamsChange?.(newPathParams)
		
		// Skip URL update if this change came from URL parsing
		if (isUpdatingPathParams.current) {
			return
		}
		
		let newUrl = url
		const pathParamsRegex = /(?<!https?)\:[a-zA-Z0-9_]*/g
		const pathParamsLocated = newUrl.match(pathParamsRegex)
		
		if (pathParamsLocated) {
			// Replace each path param with the new keyValue
			pathParamsLocated.forEach((param, index) => {
				if (newPathParams[index] && newPathParams[index].keyValue) {
					const newParam = `:${newPathParams[index].keyValue}`
					newUrl = newUrl.replace(param, newParam)
				}
			})
			
			isUpdatingUrl.current = true
			setUrl(newUrl)
			onUrlChange?.(newUrl)
			setTimeout(() => { isUpdatingUrl.current = false }, 0)
		}
	}

	const handleQueryParamsChange = (newQueryParams: Row[]) => {		
		// // Skip URL update if this change came from URL parsing
		// if (isUpdatingQueryParams.current) {
		// 	return
		// }

		// try {
		// 	// Handle cases where URL might not have protocol
		// 	const urlToUse = url.startsWith('http') ? url : `http://localhost${url.startsWith('/') ? url : '/' + url}`;
		// 	let currentUrlObj = new URL(urlToUse)
			
		// 	// Clear existing query parameters
		// 	currentUrlObj.searchParams.forEach((value, key) => {
		// 		currentUrlObj.searchParams.delete(key)
		// 	})
			
		// 	// Add new query parameters
		// 	newQueryParams.forEach((param) => {
		// 		if (param.enabled && param.keyValue && param.value) {
		// 			currentUrlObj.searchParams.set(param.keyValue, param.value)
		// 		}
		// 	})
			
		// 	// Reconstruct the original URL format (remove the protocol/host if it was added)
		// 	let currentUrl = currentUrlObj.toString()
		// 	if (!url.startsWith('http')) {
		// 		currentUrl = currentUrlObj.pathname + currentUrlObj.search + currentUrlObj.hash
		// 	}
			
		// 	isUpdatingUrl.current = true
		// 	setUrl(currentUrl)
		// 	setQueryParams(newQueryParams)
		// 	onQueryParamsChange?.(newQueryParams)
			
		// 	setTimeout(() => { isUpdatingUrl.current = false }, 0)
		// } catch (error) {
		// 	console.error('Error updating query parameters:', error)
		// }
	}

	return {
		url,
		pathParams,
		showPathParams,
		queryParams,
		setUrl: handleUrlChange,
		setPathParams: handlePathParamsChange,
		setQueryParams: handleQueryParamsChange
	}
}

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
	const constructedUrl = (activeEndpoint?.base_url || '') + (activeEndpoint?.path || '')
	const { url, pathParams, showPathParams, queryParams, setUrl, setPathParams, setQueryParams } = urlPathParamsSync(
		constructedUrl,
		activeCase?.request?.path_params || [],
		activeCase?.request?.query_params || [],
		onUrlChange,
		onPathParamsChange,
		onQueryParamsChange
	)

	return (
		<div className="h-full p-4 overflow-y-auto">
			<Card className="h-full border-none flex flex-col">
				<CardContent className="space-y-4 p-4 flex-1 flex flex-col">
					{/* URL Bar */}
					<UrlBar
						method={activeEndpoint?.method ?? 'GET'}
						url={url}
						loading={loading}
						onMethodChange={onMethodChange}
						onUrlChange={setUrl}
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
								onChange={setPathParams} 
								isPathParamTable={true}
							/>
							)}
							<TableForm rows={queryParams} title="Query Params" onChange={setQueryParams} />
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
