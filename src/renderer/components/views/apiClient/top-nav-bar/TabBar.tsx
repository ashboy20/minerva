import React, { useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MethodText } from '@/renderer/components/common-ui/MethodText';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addTab, setActiveTab, closeTab, addNewTab } from '@/store/slices/tabsSlice';
import { setActiveEndpoint } from '@/store/slices/endpointsSlice';

interface TabBarProps {
	className?: string;
}

export function TabBar({ className }: TabBarProps) {
	const dispatch = useAppDispatch();
	
	// Get tabs and active tab from Redux
	const { tabs, activeTabId } = useAppSelector(state => state.tabs);
	const { endpoints, activeEndpoint } = useAppSelector(state => state.endpoints);


	// When the active endpoint changes, ensure there's a corresponding tab
	useEffect(() => {
		if (activeEndpoint) {
			dispatch(addTab({ endpoint: activeEndpoint, setAsActive: true }));
		}
	}, [activeEndpoint, dispatch]);

	const handleTabClick = (tabId: string) => {
		dispatch(setActiveTab(tabId));
		
		// Find the corresponding endpoint and set it as active
		const tab = tabs.find(t => t.id === tabId);
		if (tab && tab.endpointId !== -1) {
			const endpoint = endpoints.find(ep => ep.id === tab.endpointId);
			if (endpoint) {
				dispatch(setActiveEndpoint({ endpoint }));
			}
		}
	};

	const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		dispatch(closeTab(tabId));
	};

	const handleAddTab = () => {
		dispatch(addNewTab());
	};

	return (
		<div className={cn('flex items-center bg-background border-b border-border', className)}>
			<div className="flex items-center overflow-x-auto scrollbar-none">
				{tabs.map((tab) => (
					<div
						key={tab.id}
						onClick={() => handleTabClick(tab.id)}
						className={cn(
							'flex items-center gap-2 px-3 py-2 border-r border-border cursor-pointer group relative',
							'w-48 min-w-48 max-w-48', // Fixed width of 192px
							'hover:bg-muted/50 transition-colors duration-150',
							activeTabId === tab.id
								? 'bg-background border-b-2 border-b-primary'
								: 'bg-muted/30'
						)}
					>
						{/* Method badge */}
						{tab.method && (
							<div className="text-xs">
								<MethodText method={tab.method} />
							</div>
						)}
						
						{/* Tab label */}
						<span className="text-sm truncate flex-1 min-w-0" title={tab.label}>
							{tab.label}
							{tab.notSaved && <span className="text-orange-500 ml-1">•</span>}
						</span>
						
						{/* Close button */}
						{tabs.length > 1 && (
							<button
								onClick={(e) => handleCloseTab(tab.id, e)}
								className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-all duration-150"
							>
								<X size={14} className="text-muted-foreground hover:text-foreground" />
							</button>
						)}
					</div>
				))}
			</div>
			
			{/* Add new tab button */}
			<button
				onClick={handleAddTab}
				className="flex items-center justify-center p-2 hover:bg-muted/50 transition-colors duration-150 border-r border-border"
				title="Add new tab"
			>
				<Plus size={16} className="text-muted-foreground hover:text-foreground" />
			</button>
		</div>
	);
}
