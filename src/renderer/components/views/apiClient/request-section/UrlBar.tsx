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
import { updateItem } from '@/store/slices/collectionSlice';
import { updateFromUrl } from '@/store/slices/urlSlice';
import { updateNotSaveState } from '@/store/slices/tabsSlice';
import { sendRequest } from '@/store/slices/responseSlice';

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
	const { fullUrl, queryParams } = useAppSelector(
		(state) => state.url,
	);
	const activeTab = tabs.find(
		(tab) => tab.endpoint.uuid === activeTabId,
	);

	const handleMethodChange = (method: string) => {
		if (!activeTab || !activeTabId) return;

		// Mark tab as unsaved
		dispatch(
			updateNotSaveState({
				endpointId: activeTabId,
				notSaved: true,
			}),
		);
	};

	const handleUrlChange = (url: string) => {
		if (!activeTab || !activeTabId) return;

		// Update URL in urlSlice
		dispatch(updateFromUrl(url));

		// Mark tab as unsaved
		dispatch(
			updateNotSaveState({
				endpointId: activeTabId,
				notSaved: true,
			}),
		);
	};

	const handleSendRequest = async () => {
		if (!activeTab?.endpoint) return;

		// Prepare request body for non-GET requests
		let requestBody: string | object | undefined;
		if (
			activeTab.endpoint.method !== 'GET' &&
			activeTab.endpoint.method !== 'HEAD'
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
				method: activeTab.endpoint.method,
				url: fullUrl,
				headers,
				queryParams,
				body: requestBody,
				auth,
			}),
		);
	};

	const handleSave = async () => {
		if (!activeTab?.endpoint) return;

		try {
			await dispatch(
				updateItem({
					uuid: activeTab.endpoint.uuid,
					fields: {
						method: activeTab.endpoint.method,
						url: fullUrl,
						name: activeTab.endpoint.name,
					},
				}),
			).unwrap();

			// Mark tab as saved
			dispatch(
				updateNotSaveState({
					endpointId: activeTab.endpoint.uuid,
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
	}, [activeTab?.endpoint]);

	return (
		<div className="flex space-x-2">
			<Select
				value={activeTab?.endpoint?.method ?? 'GET'}
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
				value={fullUrl}
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
					disabled={
						loading || !fullUrl || !String(fullUrl).trim()
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
		</div>
	);
}

export default UrlBar;
