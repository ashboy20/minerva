import {
	createSlice,
	PayloadAction,
} from '@reduxjs/toolkit';
import { Endpoint } from '@/types/backend/endpoint-management/endpoint';
import { getUUID } from '@/utils/getUUID';

interface Tab {
	uuid: string;
	endpointUuid: string | null;
	method: string;
	// TODO: notSaved only turn to true when any field from the endpoint is updated
	notSaved: boolean;
	new: boolean;
	isRenaming?: boolean;
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
	return (
		endpoint.name ?? `${endpoint.method} ${endpoint.path}`
	);
};

export const tabsSlice = createSlice({
	name: 'tabs',
	initialState,
	reducers: {
		// Add a new tab - either from an endpoint or create a new empty tab
		addTab: (
			state,
			action: PayloadAction<{ endpoint?: Endpoint }>,
		) => {
			const { endpoint } = action.payload;

			if (endpoint) {
				// Adding tab from existing endpoint
				const tabUuid = getUUID();

				// Check if tab for this endpoint already exists
				const existingTab = state.tabs.find(
					(tab) => tab.endpointUuid === endpoint.uuid,
				);

				if (!existingTab) {
					const newTab: Tab = {
						uuid: tabUuid,
						endpointUuid: endpoint.uuid,
						method: endpoint.method,
						notSaved: false,
						new: false,
					};

					state.tabs.push(newTab);
				}
				state.activeTabId = existingTab
					? existingTab.uuid
					: tabUuid;
			} else {
				// Adding new empty tab
				const tabUuid = getUUID();
				const newTab: Tab = {
					uuid: tabUuid,
					endpointUuid: null,
					method: 'GET',
					notSaved: true,
					new: true,
				};

				state.tabs.push(newTab);
				state.activeTabId = tabUuid;
			}
		},

		setActiveTab: (
			state,
			action: PayloadAction<string>,
		) => {
			const tabId = action.payload;
			if (state.tabs.find((tab) => tab.uuid === tabId)) {
				state.activeTabId = tabId;
			}
		},

		// TODO: when closing it if the tab is not saved yet, prompt to ask user if it is sure to close it
		closeTab: (state, action: PayloadAction<string>) => {
			const tabId = action.payload;
			const tabIndex = state.tabs.findIndex(
				(tab) => tab.uuid === tabId,
			);

			if (tabIndex === -1) return;

			// Remove the tab
			state.tabs.splice(tabIndex, 1);

			// If we closed the active tab, set a new active tab
			if (state.activeTabId === tabId) {
				if (state.tabs.length > 0) {
					// Set the previous tab as active, or first tab if it was the first tab
					const newActiveIndex = Math.max(0, tabIndex - 1);
					state.activeTabId =
						state.tabs[newActiveIndex].uuid;
				} else {
					state.activeTabId = null;
				}
			}
		},

		// Update tab's saved state
		updateTabSavedState: (
			state,
			action: PayloadAction<{
				tabId: string;
				notSaved: boolean;
			}>,
		) => {
			const { tabId, notSaved } = action.payload;
			const tab = state.tabs.find(
				(tab) => tab.uuid === tabId,
			);
			if (tab) {
				tab.notSaved = notSaved;
			}
		},

		updateTabRenamingState: (
			state,
			action: PayloadAction<{
				tabId: string;
				isRenaming: boolean;
			}>,
		) => {
			const { tabId, isRenaming } = action.payload;
			const tab = state.tabs.find(
				(tab) => tab.uuid === tabId,
			);
			if (tab) {
				tab.isRenaming = isRenaming;
			}
		},

		// TODO: will be useful when there is dropdown to close all tabs1
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
	updateTabRenamingState,
	clearTabs,
} = tabsSlice.actions;

export default tabsSlice.reducer;
