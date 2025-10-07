import React from 'react';
import {
	Card,
	CardContent,
} from '@/renderer/components/ui/card';
import { JsonEditorComponent } from '@/renderer/components/views/apiClient/components/JsonEditorComponent';
import { useAppSelector } from '@/store/hooks';

interface ApiResponse {
	status: number;
	statusText: string;
	headers: Record<string, string>;
	data: any;
	time: number;
	size: number;
}

export function ResponseSection() {
	const { tabs, activeTabId } = useAppSelector(
		(state) => state.tabs,
	);
	const activeTab = tabs.find(
		(tab) => tab.endpoint.uuid === activeTabId,
	);
	const activeEndpoint = activeTab?.endpoint;
	const isDisabled = activeEndpoint?.method === 'GET' || activeEndpoint?.method === 'HEAD';
	return (
		<div className="h-full overflow-y-auto p-4">
			<Card className="flex h-full flex-col border-none">
				<CardContent className="space-y-4 p-4">
					<JsonEditorComponent
						placeholder="Response will appear here"
						value=""
						onChange={() => {}}
						className="flex-1"
						disabled={isDisabled}
						darkTheme
					/>
				</CardContent>
			</Card>
		</div>
	);
}
