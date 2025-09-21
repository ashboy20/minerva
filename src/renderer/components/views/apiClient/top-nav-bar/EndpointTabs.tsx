import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { MethodText } from '@/renderer/components/common-ui/MethodText';
import { LayoutSwitcher } from '@/renderer/components/views/apiClient/components/LayoutSwitcher';
import { Endpoint } from '@/types/backend/endpoint-management/endpoint';

export interface EndpointTab {
  id: string;
  endpoint: Endpoint;
  isActive: boolean;
  hasUnsavedChanges?: boolean;
}

interface EndpointTabsProps {
  /** Array of open endpoint tabs */
  tabs: EndpointTab[];
  /** ID of the currently active tab */
  activeTabId?: string;
  /** Callback when a tab is clicked */
  onTabClick: (tabId: string) => void;
  /** Callback when a tab is closed */
  onTabClose: (tabId: string) => void;
  /** Callback when the new tab button is clicked */
  onNewTab: () => void;
  /** Show the layout switcher */
  showLayoutSwitcher?: boolean;
}

export function EndpointTabs({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onNewTab,
  showLayoutSwitcher = true
}: EndpointTabsProps) {
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    onTabClose(tabId);
  };

  const handleNewTab = () => {
    onNewTab();
  };

  return (
    <div className="flex items-center border-b border-border bg-background">
      {/* Tabs Container */}
      <div className="flex flex-1 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`
              group relative flex items-center px-3 py-1.5 border-r border-border cursor-pointer transition-colors
              w-52 flex-shrink-0
              ${tab.isActive 
                ? 'bg-background border-b-2 border-b-primary' 
                : 'bg-muted/30 hover:bg-muted/50'
              }
            `}
            onClick={() => onTabClick(tab.id)}
            onMouseEnter={() => setHoveredTabId(tab.id)}
            onMouseLeave={() => setHoveredTabId(null)}
          >
            {/* Tab Content */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
              {/* HTTP Method Badge */}
              <div className="flex-shrink-0">
                <MethodText method={tab.endpoint.method} className="text-xs"/>
              </div>
              
              {/* Endpoint Name */}
              <span 
                className={`
                  text-xs font-medium truncate flex-1 min-w-0
                  ${tab.isActive ? 'text-foreground' : 'text-muted-foreground'}
                `}
                title={tab.endpoint.summary || tab.endpoint.name}
              >
                {tab.endpoint.summary || tab.endpoint.name}
              </span>
              
              {/* Unsaved Changes Indicator */}
              {tab.hasUnsavedChanges && (
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0" />
              )}
            </div>

            {/* Close Button */}
            <button
              className={`
                ml-1.5 p-0.5 rounded-sm transition-colors flex-shrink-0
                ${(hoveredTabId === tab.id || tab.isActive)
                  ? 'opacity-100 hover:bg-muted' 
                  : 'opacity-0 group-hover:opacity-100'
                }
              `}
              onClick={(e) => handleTabClose(e, tab.id)}
              aria-label={`Close ${tab.endpoint.name} tab`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* New Tab Button */}
        <button
          className="flex items-center justify-center px-2.5 py-1.5 border-r border-border hover:bg-muted/50 transition-colors flex-shrink-0"
          onClick={handleNewTab}
          aria-label="Open new tab"
        >
          <Plus className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Right Side Actions */}
      {showLayoutSwitcher && (
        <div className="flex items-center px-3 py-1.5">
          <LayoutSwitcher />
        </div>
      )}
    </div>
  );
}

// Helper function to create a new tab
export function createEndpointTab(endpoint: Endpoint, isActive = false): EndpointTab {
  return {
    id: `tab-${endpoint.id}-${Date.now()}`,
    endpoint,
    isActive,
    hasUnsavedChanges: false
  };
}

// Helper function to update tab active state
export function updateTabActiveState(tabs: EndpointTab[], activeTabId: string): EndpointTab[] {
  return tabs.map(tab => ({
    ...tab,
    isActive: tab.id === activeTabId
  }));
}
