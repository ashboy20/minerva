import React, { useEffect, useState, useRef } from 'react';
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
	updateTabRenamingState,
	updateTabName,
} from '@/store/slices/tabsSlice';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from '@/renderer/components/ui/context-menu';
import { Input } from '@/renderer/components/ui/input';
import { updateItem } from '@/store/slices/collectionSlice';

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

	const [newEndpointLabel, setNewEndpointLabel] =
		useState('');
	const inputRef = useRef<HTMLInputElement>(null);

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

	const handleStartRenameTab = (uuid: string) => {
		dispatch(
			updateTabRenamingState({
				endpointId: uuid,
				isRenaming: true,
			}),
		);
	};

	const handleTabRename = async (
		uuid: string,
		newName: string,
	) => {
		// First update the tab name in the UI
		dispatch(
			updateTabName({
				endpointId: uuid,
				name: newName,
			}),
		);

		// Then update the backend and refresh collections
		try {
			await dispatch(
				updateItem({
					uuid: uuid,
					fields: {
						name: newName,
					},
				}),
			).unwrap();
		} catch (error) {
			console.error('Failed to update item name:', error);
		}
	};

	useEffect(() => {
		setNewEndpointLabel(
			tabs.find((tab) => tab.endpoint.uuid === activeTabId)
				?.endpoint.name || '',
		);
	}, [tabs, activeTabId]);

	// Focus input when renaming starts
	useEffect(() => {
		const renamingTab = tabs.find((tab) => tab.isRenaming);
		if (renamingTab && inputRef.current) {
			const timeoutId = setTimeout(() => {
				if (inputRef.current) {
					inputRef.current.focus();
					inputRef.current.select();
				}
			}, 200);
			return () => clearTimeout(timeoutId);
		}
	}, [tabs]);

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
						key={tab.endpoint.uuid}
						// open={}
						// onOpenChange={(open) => setOpenDropdownId(open ? tab.uuid : null)}
					>
						<ContextMenuTrigger asChild>
							<div
								onClick={() =>
									handleTabClick(tab.endpoint.uuid)
								}
								className={cn(
									'group relative flex cursor-pointer items-center gap-2 border-r border-border px-3 py-2',
									'w-48 min-w-48 max-w-48', // Fixed width of 192px
									'transition-colors duration-150 hover:bg-muted/50',
									activeTabId === tab.endpoint.uuid
										? 'border-b-2 border-b-primary bg-background'
										: 'bg-muted/30',
								)}
							>
								{/* Method badge */}
								{tab.endpoint.method && (
									<div className="text-xs">
										<MethodText
											method={tab.endpoint.method}
										/>
									</div>
								)}

								{/* Tab label */}
								{tab.isRenaming ? (
									<Input
										ref={inputRef}
										value={newEndpointLabel}
										onChange={(e) =>
											setNewEndpointLabel(e.target.value)
										}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												dispatch(
													updateTabRenamingState({
														endpointId: tab.endpoint.uuid,
														isRenaming: false,
													}),
												);
												handleTabRename(
													tab.endpoint.uuid,
													newEndpointLabel,
												);
											}
										}}
									/>
								) : (
									<span className="min-w-0 flex-1 truncate text-sm">
										{tab.endpoint.name
											? tab.endpoint.name
											: tab.endpoint.path}
									</span>
								)}

								{/* Close button */}
								<button
									onClick={(e) =>
										handleCloseTab(tab.endpoint.uuid, e)
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
								onClick={() =>
									handleStartRenameTab(tab.endpoint.uuid)
								}
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
