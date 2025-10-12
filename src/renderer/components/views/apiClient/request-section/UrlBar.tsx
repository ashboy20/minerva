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
import { PlayIcon, FileIcon } from '@radix-ui/react-icons';
import React, { useEffect } from 'react';
import { UrlInputField } from '@/renderer/components/views/apiClient/request-section/UrlInputField';
import {
	useAppDispatch,
	useAppSelector,
} from '@/store/hooks';
import { updateActiveEndpoint } from '@/store/slices/endpointsSlice';
import { sendRequest } from '@/store/slices/responseSlice';
import { updateItem } from '@/store/slices/collectionSlice';
import { updateNotSaveState } from '@/store/slices/tabsSlice';

function UrlBar() {
	const dispatch = useAppDispatch();

	// Get the active endpoint from the active tab and loading state from response
	const { tabs, activeTabId } = useAppSelector(
		(state) => state.tabs,
	);
	const { loading } = useAppSelector(
		(state) => state.response,
	);
	const { headers, auth } = useAppSelector(
		(state) => state.headersAuth,
	);
	const { fullUrl, queryParams } = useAppSelector(
		(state) => state.url,
	);
	const activeTab = tabs.find(
		(tab) => tab.endpoint.uuid === activeTabId,
	);
	const activeEndpoint = activeTab?.endpoint;

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

	const handleUrlChange = (url: string) => {
		if (!activeEndpoint) return;

		// Parse the URL to extract base_url and path
		try {
			const urlObj = new URL(url);
			const basePath = urlObj.origin;
			const path = urlObj.pathname + urlObj.search;
			dispatch(
				updateActiveEndpoint({
					...activeEndpoint,
					url: url,
				}),
			);
		} catch {
			// If URL parsing fails, just update the path
			dispatch(
				updateActiveEndpoint({
					...activeEndpoint,
					url: url,
				}),
			);
		}
	};

	const handleSendRequest = async () => {
		if (!activeEndpoint || !activeTab?.endpoint) return;

		// Prepare request body for non-GET requests
		let requestBody: string | object | undefined;
		if (
			activeEndpoint.method !== 'GET' &&
			activeEndpoint.method !== 'HEAD'
		) {
			const activeCase = activeTab.endpoint.cases.find(
				(c) => c.uuid === activeTab.activeCaseId,
			);
			const body = activeCase?.request?.body;
			if (body !== null && body !== undefined) {
				requestBody = body;
			}
		}

		dispatch(
			sendRequest({
				method: activeEndpoint.method,
				url: fullUrl,
				headers,
				queryParams,
				body: requestBody,
				auth,
			}),
		);
	};

	const handleSave = async () => {
		if (!activeEndpoint) return;

		try {
			await dispatch(
				updateItem({
					uuid: activeEndpoint.uuid,
					fields: {
						method: activeEndpoint.method,
						url: activeEndpoint.url,
						name: activeEndpoint.name,
					},
				}),
			).unwrap();

			// Mark tab as saved
			dispatch(
				updateNotSaveState({
					endpointId: activeEndpoint.uuid,
					notSaved: false,
				}),
			);
		} catch (error) {
			console.error('Failed to save endpoint:', error);
		}
	};

	// Handle Cmd+S keyboard shortcut
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 's') {
				e.preventDefault();
				handleSave();
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () =>
			document.removeEventListener(
				'keydown',
				handleKeyDown,
			);
	}, [activeEndpoint]);

	// Construct the full URL from base_url and path, ensuring it's never undefined
	const url = activeEndpoint
		? `${activeEndpoint.url || ''}`
		: '';

	return (
		<div className="flex space-x-2">
			<Select
				value={activeEndpoint?.method ?? 'GET'}
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
				value={url}
				onChange={handleUrlChange}
			/>

			<div className="flex gap-2">
				<Button
					onClick={handleSave}
					disabled={!activeTab?.notSaved}
					variant="outline"
					className="px-4"
				>
					<FileIcon className="mr-2 h-4 w-4" />
					Save
				</Button>

				<Button
					onClick={handleSendRequest}
					disabled={loading || !url || !String(url).trim()}
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
		</div>
	);
}

export default UrlBar;
