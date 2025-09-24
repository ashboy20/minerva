import React, { useEffect, useState } from 'react';
import { X, Plus, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MethodText } from '@/renderer/components/common-ui/MethodText';
import {
	useAppSelector,
	useAppDispatch,
} from '@/store/hooks';
import {
	addTab,
	setActiveTab,
	closeTab,
	renameTab,
	updateTabRenamingState,
} from '@/store/slices/tabsSlice';
import { setActiveEndpoint } from '@/store/slices/endpointsSlice';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from '@/renderer/components/ui/context-menu';
import { Input } from '@/renderer/components/ui/input';

interface TabBarProps {
	className?: string;
}

export function TabBar({ className }: TabBarProps) {
	const dispatch = useAppDispatch();

	// Get tabs and active tab from Redux
	const { tabs, activeTabId } = useAppSelector(
		(state) => state.tabs,
	);

	// TODO: do we really need it?
	const { endpoints, activeEndpoint } = useAppSelector(
		(state) => state.endpoints,
	);

	const [newEndpointLabel, setNewEndpointLabel] = useState('');

	const handleTabClick = (tabId: string) => {
		dispatch(setActiveTab(tabId));
	};

	const handleCloseTab = (
		tabId: string,
		e: React.MouseEvent,
	) => {
		e.stopPropagation();
		dispatch(closeTab(tabId));
	};

	const handleAddTab = () => {
		dispatch(addTab({}));
	};

	const handleRenameTab = (uuid: string) => {
		dispatch(updateTabRenamingState({ tabId: uuid, isRenaming: true }));
	};

	return (
		<div
			className={cn(
				'flex items-center border-b border-border bg-background',
				className,
			)}
		>
			<div className="scrollbar-none flex items-center overflow-x-auto">
				{tabs.map((tab) => (
					<ContextMenu
						key={tab.uuid}
						// open={}
						// onOpenChange={(open) => setOpenDropdownId(open ? tab.uuid : null)}
					>
						<ContextMenuTrigger asChild>
							<div
								onClick={() => handleTabClick(tab.uuid)}
								className={cn(
									'group relative flex cursor-pointer items-center gap-2 border-r border-border px-3 py-2',
									'w-48 min-w-48 max-w-48', // Fixed width of 192px
									'transition-colors duration-150 hover:bg-muted/50',
									activeTabId === tab.uuid
										? 'border-b-2 border-b-primary bg-background'
										: 'bg-muted/30',
								)}
							>
								{/* Method badge */}
								{tab.method && (
									<div className="text-xs">
										<MethodText method={tab.method} />
									</div>
								)}

								{/* Tab label */}
								{tab.isRenaming ? (
									<Input
										value={newEndpointLabel}
										onChange={(e) =>
											setNewEndpointLabel(e.target.value)
										}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												dispatch(updateTabRenamingState({ tabId: tab.uuid, isRenaming: false }));
											}
										}}
									/>
								) : (
									<span className="min-w-0 flex-1 truncate text-sm">New Request</span>
								)}

								{/* Close button */}
								<button
									onClick={(e) =>
										handleCloseTab(tab.uuid, e)
									}
									className="rounded p-0.5 opacity-0 transition-all duration-150 hover:bg-muted group-hover:opacity-100"
								>
									<X
										size={14}
										className="text-muted-foreground hover:text-foreground"
									/>
								</button>
							</div>
						</ContextMenuTrigger>
						<ContextMenuContent className="min-w-32">
							<ContextMenuItem
								className="flex cursor-pointer items-center gap-2"
								onClick={() => handleRenameTab(tab.uuid)}
							>
								<Edit3 size={14} />
								Rename
							</ContextMenuItem>
						</ContextMenuContent>
					</ContextMenu>
				))}
			</div>

			{/* Add new tab button */}
			<button
				onClick={handleAddTab}
				className="flex items-center justify-center border-r border-border p-2 transition-colors duration-150 hover:bg-muted/50"
				title="Add new tab"
			>
				<Plus
					size={16}
					className="text-muted-foreground hover:text-foreground"
				/>
			</button>
		</div>
	);
}
