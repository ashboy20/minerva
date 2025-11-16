import React, { useEffect } from 'react';
import {
	useAppSelector,
	useAppDispatch,
} from '@/store/hooks';
import { useGlobalContext } from '@/renderer/context/global-context';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@/renderer/components/ui/resizable';
import { CollectionList } from '@/renderer/components/views/apiClient/collection-list/CollectionList';
import { RequestSection } from '@/renderer/components/views/apiClient/request-section/RequestSection';
import { ResponseSection } from '@/renderer/components/views/apiClient/components/ResponseSection';
import { LayoutSwitcher } from '@/renderer/components/views/apiClient/top-nav-bar/LayoutSwitcher';
import { TabBar } from '@/renderer/components/views/apiClient/top-nav-bar/TabBar';

export function RequestBuilder() {
	const dispatch = useAppDispatch();
	const { settings } = useGlobalContext();

	// Get collections state from Redux
	const {
		collections,
		loading: collectionsLoading,
		error: collectionsError,
	} = useAppSelector((state) => state.collection);

	return (
		<ResizablePanelGroup
			direction="horizontal"
			className="min-h-[calc(100vh-200px)] w-full"
		>
			{/* Left Sidebar - Endpoints List */}
			<ResizablePanel
				defaultSize={25}
				minSize={15}
				maxSize={40}
			>
				<CollectionList/>
			</ResizablePanel>

			<ResizableHandle />
			{/* Right Side - Main Content */}
			<ResizablePanel defaultSize={75} minSize={60}>
				<div className="flex h-full flex-col">
					{/* Top Bar with Tabs */}
					<div className="flex flex-col">
						<div className="flex h-12 items-center justify-between border-b border-border p-4">
							<TabBar />
							<LayoutSwitcher />
						</div>
					</div>

					{/* Request/Response Content */}
					<div className="flex-1">
						<ResizablePanelGroup
							direction={
								settings.apiClientLayout === 'horizontal'
									? 'horizontal'
									: 'vertical'
							}
							className="h-full"
						>
							<ResizablePanel defaultSize={60} minSize={30}>
								<RequestSection />
							</ResizablePanel>

							<ResizableHandle withHandle />

							<ResizablePanel defaultSize={40} minSize={20}>
								<ResponseSection />
							</ResizablePanel>
						</ResizablePanelGroup>
					</div>
				</div>
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}
