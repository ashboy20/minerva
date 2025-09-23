import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Endpoint } from '@/types/backend/endpoint-management/endpoint';

interface Tab {
	id: string;
	label: string;
	method: string;
	endpointId: number;
	notSaved: boolean;
}

interface TabsState {
	tabs: Tab[];
	activeTabId: string | null;
}

const initialState: TabsState = {
	tabs: [],
	activeTabId: null,
};

// Helper function to generate tab label from endpoint
const generateTabLabel = (endpoint: Endpoint): string => {
    return endpoint.name ?? `${endpoint.method} ${endpoint.path}`;
};

// Helper function to generate unique tab ID
const generateTabId = (endpointId: number): string => {
	return `tab-${endpointId}`;
};

export const tabsSlice = createSlice({
	name: 'tabs',
	initialState,
	reducers: {
		// Add a new tab from an endpoint
		addTab: (state, action: PayloadAction<{ endpoint: Endpoint; setAsActive?: boolean }>) => {
			const { endpoint, setAsActive = true } = action.payload;
			const tabId = generateTabId(endpoint.id);
			
			// Check if tab already exists
			const existingTab = state.tabs.find(tab => tab.id === tabId);
			
			if (!existingTab) {
				const newTab: Tab = {
					id: tabId,
					label: generateTabLabel(endpoint),
					method: endpoint.method,
					endpointId: endpoint.id,
					notSaved: false,
				};
				
				state.tabs.push(newTab);
			}
			
			// Set as active if requested
			if (setAsActive) {
				state.activeTabId = tabId;
			}
		},

		// Set active tab
		setActiveTab: (state, action: PayloadAction<string>) => {
			const tabId = action.payload;
			if (state.tabs.find(tab => tab.id === tabId)) {
				state.activeTabId = tabId;
			}
		},

		// Close a tab
		closeTab: (state, action: PayloadAction<string>) => {
			const tabId = action.payload;
			const tabIndex = state.tabs.findIndex(tab => tab.id === tabId);
			
			if (tabIndex === -1) return;
			
			// Don't close if it's the last tab
			if (state.tabs.length === 1) return;
			
			// Remove the tab
			state.tabs.splice(tabIndex, 1);
			
			// If we closed the active tab, set a new active tab
			if (state.activeTabId === tabId) {
				if (state.tabs.length > 0) {
					// Set the previous tab as active, or first tab if it was the first tab
					const newActiveIndex = Math.max(0, tabIndex - 1);
					state.activeTabId = state.tabs[newActiveIndex].id;
				} else {
					state.activeTabId = null;
				}
			}
		},

		// Update tab's saved state
		updateTabSavedState: (state, action: PayloadAction<{ tabId: string; notSaved: boolean }>) => {
			const { tabId, notSaved } = action.payload;
			const tab = state.tabs.find(tab => tab.id === tabId);
			if (tab) {
				tab.notSaved = notSaved;
			}
		},

		// Update tab label (when endpoint changes)
		updateTabLabel: (state, action: PayloadAction<{ endpointId: number; endpoint: Endpoint }>) => {
			const { endpointId, endpoint } = action.payload;
			const tab = state.tabs.find(tab => tab.endpointId === endpointId);
			if (tab) {
				tab.label = generateTabLabel(endpoint);
				tab.method = endpoint.method;
			}
		},

		// Add a new empty tab
		addNewTab: (state) => {
			const newId = `new-tab-${Date.now()}`;
			const newTab: Tab = {
				id: newId,
				label: 'New Request',
				method: 'GET',
				endpointId: -1, // Temporary ID for new tabs
				notSaved: true,
			};
			
			state.tabs.push(newTab);
			state.activeTabId = newId;
		},

		// Clear all tabs
		clearTabs: (state) => {
			state.tabs = [];
			state.activeTabId = null;
		},
	},
});

export const {
	addTab,
	setActiveTab,
	closeTab,
	updateTabSavedState,
	updateTabLabel,
	addNewTab,
	clearTabs,
} = tabsSlice.actions;

export default tabsSlice.reducer;
