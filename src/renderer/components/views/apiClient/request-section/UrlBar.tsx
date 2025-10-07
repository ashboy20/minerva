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
import { PlayIcon } from '@radix-ui/react-icons';
import React from 'react';
import { UrlInputField } from '@/renderer/components/views/apiClient/request-section/UrlInputField';
import {
	useAppDispatch,
	useAppSelector,
} from '@/store/hooks';
import { updateActiveEndpoint } from '@/store/slices/endpointsSlice';

interface UrlBarProps {
	loading: boolean;
	onSendRequest: () => void;
}

function UrlBar({ loading, onSendRequest }: UrlBarProps) {
	const dispatch = useAppDispatch();

	// Get the active endpoint from the active tab
	const { tabs, activeTabId } = useAppSelector(
		(state) => state.tabs,
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

	// Construct the full URL from base_url and path, ensuring it's never undefined
	const fullUrl = activeEndpoint
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
				value={fullUrl}
				onChange={handleUrlChange}
			/>

			<Button
				onClick={onSendRequest}
				disabled={
					loading || !fullUrl || !String(fullUrl).trim()
				}
				className="px-6"
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
