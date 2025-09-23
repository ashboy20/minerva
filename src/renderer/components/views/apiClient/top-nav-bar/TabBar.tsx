import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MethodText } from '@/renderer/components/common-ui/MethodText';

interface Tab {
	id: string;
	label: string;
	method?: string;
	isActive?: boolean;
	notSaved?: boolean;
}

interface TabBarProps {
	className?: string;
}

export function TabBar({ className }: TabBarProps) {
    // TODO: Remove this once the tabs are implemented
	const [tabs, setTabs] = useState<Tab[]>([
		{ id: '1', label: 'GET /users', method: 'GET', isActive: true, notSaved: false },
		{ id: '2', label: 'POST /auth/login', method: 'POST', isActive: false, notSaved: true },
		{ id: '3', label: 'PUT /users/123/profile/update', method: 'PUT', isActive: false, notSaved: false },
	]);
	const [activeTabId, setActiveTabId] = useState('1');


	const handleTabClick = (tabId: string) => {
		setActiveTabId(tabId);
		setTabs(tabs.map(tab => ({ ...tab, isActive: tab.id === tabId })));
	};

	const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		if (tabs.length === 1) return; // Don't close if it's the last tab
		
		const newTabs = tabs.filter(tab => tab.id !== tabId);
		setTabs(newTabs);
		
		// If we closed the active tab, make the first remaining tab active
		if (activeTabId === tabId && newTabs.length > 0) {
			setActiveTabId(newTabs[0].id);
			newTabs[0].isActive = true;
		}
	};

	const handleAddTab = () => {
		const newId = (tabs.length + 1).toString();
        // TODO: Remove this once the tabs are implemented
		const newTab: Tab = {
			id: newId,
			label: 'New Request',
			method: 'GET',
			isActive: false,
			notSaved: false,
		};
		setTabs([...tabs, newTab]);
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
							tab.isActive || activeTabId === tab.id
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
