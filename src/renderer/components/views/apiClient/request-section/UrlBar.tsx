import {
	Select,
	SelectValue,
	SelectTrigger,
	SelectContent,
	SelectItem,
} from '@/renderer/components/ui/select';
import { HTTP_METHODS } from '@/data/apiClient';
import { MethodText } from '@/renderer/components/common-ui/MethodText';
import { Button } from '@/renderer/components/ui/button';
import {
	PlayIcon,
	DownloadIcon,
} from '@radix-ui/react-icons';
import React, { useEffect } from 'react';
import { UrlInputField } from '@/renderer/components/views/apiClient/request-section/UrlInputField';
import {
	useAppDispatch,
	useAppSelector,
} from '@/store/hooks';
import {
	updateFromUrl,
	buildUrlWithPathParamValues,
} from '@/store/slices/urlSlice';
import {
	updateEndpoint,
	updateCase,
	updateOriginalState,
} from '@/store/slices/tabsSlice';
import { sendRequest } from '@/store/slices/responseSlice';
import { updateEndpoint as updateEndpointInCollection } from '@/store/slices/collectionSlice';
import { toast } from 'sonner';

function UrlBar() {
	const dispatch = useAppDispatch();

	// Get states from Redux
	const { tabs, activeTabId } = useAppSelector(
		(state) => state.tabs,
	);
	const { loading } = useAppSelector(
		(state) => state.response,
	);
	const { headers, auth } = useAppSelector(
		(state) => state.headersAuth,
	);
	const { pathParams, queryParams, fullUrl } =
		useAppSelector((state) => state.url);

	// Get active tab and case
	const activeTab = tabs.find(
		(tab) => tab.id === activeTabId,
	);

	// Type guard to ensure we're working with an EndpointTab
	const isEndpointTab =
		activeTab?.type === 'endpoint' ? activeTab : null;

	const activeCase = isEndpointTab?.endpoint.cases.find(
		(c) => c.uuid === isEndpointTab.activeCaseId,
	);

	// Get URL from urlSlice (single source of truth for current URL)
	// This ensures the URL updates when query params or path params change
	const currentUrl =
		fullUrl || isEndpointTab?.endpoint.url || '';

	const handleMethodChange = (method: string) => {
		if (!isEndpointTab || !activeTabId) return;

		dispatch(
			updateEndpoint({
				endpointId: activeTabId,
				fields: {
					method: method,
				},
			}),
		);
	};

	const handleUrlChange = (url: string) => {
		if (!isEndpointTab || !activeTabId || !activeCase)
			return;

		// Update the endpoint's URL first to trigger notSaved state
		dispatch(
			updateEndpoint({
				endpointId: activeTabId,
				fields: {
					url: url,
				},
			}),
		);

		// Then update URL slice for path/query param parsing
		dispatch(updateFromUrl(url));

		// Update the case's request with the new URL
		dispatch(
			updateCase({
				endpointId: activeTabId,
				caseId: activeCase.uuid,
				fields: {
					request: {
						...activeCase.request,
						full_url: url,
					},
				},
			}),
		);
	};

	const handleSendRequest = async () => {
		if (!isEndpointTab?.endpoint || !activeCase) return;

		// Build final URL with path parameter substitution
		const finalUrl = buildUrlWithPathParamValues(
			currentUrl,
			pathParams,
		);

		// Prepare request body for non-GET requests
		let requestBody: string | object | undefined;
		if (
			isEndpointTab.endpoint.method !== 'GET' &&
			isEndpointTab.endpoint.method !== 'HEAD'
		) {
			const body = activeCase.request?.body;
			if (body !== null && body !== undefined) {
				requestBody = body;
			}
		}

		dispatch(
			sendRequest({
				method: isEndpointTab.endpoint.method,
				url: finalUrl,
				headers,
				queryParams,
				body: requestBody,
				auth,
			}),
		);
	};

	const handleSave = async () => {
		if (!isEndpointTab || !isEndpointTab.endpoint) return;

		const endpoint = isEndpointTab.endpoint;

		// TODO
		// Check if this is a new endpoint (not saved yet)
		if (isEndpointTab.new) {
			toast.error(
				'Cannot save new endpoint. Please create it from a collection first.',
			);
			return;
		}

		try {
			// Dispatch the updateEndpoint thunk
			const resultAction = await dispatch(
				updateEndpointInCollection({
					uuid: endpoint.uuid,
					updates: {
						name: endpoint.name,
						description: endpoint.description,
						method: endpoint.method,
						url: endpoint.url,
						cases: endpoint.cases as any[], // TODO: Add proper type
					},
				}),
			);

			// Check if the update was successful
			if (
				updateEndpointInCollection.fulfilled.match(
					resultAction,
				)
			) {
				// Update the original state to reset the notSaved flag
				dispatch(
					updateOriginalState({
						endpointId: endpoint.uuid,
					}),
				);

				toast.success('Endpoint saved successfully!');
			} else {
				toast.error('Failed to save endpoint');
			}
		} catch (error) {
			console.error('Error saving endpoint:', error);
			toast.error('An error occurred while saving');
		}
	};

	// When URL changes in urlSlice from URL bar editing, update the case
	// Don't update if the change came from the table (to avoid circular updates)
	const { lastUpdateSource } = useAppSelector(
		(state) => state.url,
	);

	useEffect(() => {
		if (!isEndpointTab || !activeTabId || !activeCase)
			return;

		// Only update case if the change came from URL parsing (user typing in URL bar)
		// Don't update if it came from table changes to avoid overwriting user edits
		if (lastUpdateSource === 'url') {
			dispatch(
				updateCase({
					endpointId: activeTabId,
					caseId: activeCase.uuid,
					fields: {
						request: {
							...activeCase.request,
							path_params: pathParams,
							query_params: queryParams,
						},
					},
				}),
			);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathParams, queryParams, lastUpdateSource]); // Track lastUpdateSource to know where change came from

	return (
		<div className="flex space-x-2">
			<Select
				value={isEndpointTab?.endpoint?.method ?? 'GET'}
				onValueChange={handleMethodChange}
			>
				<SelectTrigger className="w-32">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{HTTP_METHODS.map((m) => (
						<SelectItem key={m} value={m}>
							<MethodText method={m} />
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<UrlInputField
				value={currentUrl}
				onChange={handleUrlChange}
			/>
			<Button
				variant="outline"
				className="px-4"
				onClick={handleSave}
				disabled={
					!isEndpointTab ||
					!isEndpointTab.notSaved ||
					isEndpointTab.new
				}
			>
				<DownloadIcon className="mr-2 h-4 w-4" />
				Save
			</Button>
			<Button
				onClick={handleSendRequest}
				disabled={
					loading ||
					!currentUrl ||
					!String(currentUrl).trim()
				}
				className="px-4"
			>
				{loading ? (
					<>Sending...</>
				) : (
					<>
						<PlayIcon className="mr-2 h-4 w-4" />
						Send
					</>
				)}
			</Button>
		</div>
	);
}

export default UrlBar;
