import {
	createSlice,
	PayloadAction,
} from '@reduxjs/toolkit';
import { EndpointDetail } from '@/types/backend/common';
import { getUUID } from '@/utils/getUUID';
// TODO: Import from collectionSlice when implemented
// import { updateItem } from '@/store/slices/collectionSlice';

// Base interface for all tab types
interface BaseTab {
	id: string; // Unique identifier for the tab (could be endpoint.uuid, folder.uuid, etc.)
	type: 'endpoint' | 'folder' | 'collection'; // Discriminator
	notSaved: boolean;
	new: boolean;
	isRenaming?: boolean;
}

// Endpoint tab (current implementation)
interface EndpointTab extends BaseTab {
	type: 'endpoint';
	endpoint: EndpointDetail;
	originalEndpoint: EndpointDetail; // Store original state for comparison
	activeCaseId: string;
}

// Future: Folder tab
interface FolderTab extends BaseTab {
	type: 'folder';
	// Add folder-specific properties here
	// folder: FolderDetail;
	// originalFolder: FolderDetail;
}

// Future: Collection tab
interface CollectionTab extends BaseTab {
	type: 'collection';
	// Add collection-specific properties here
	// collection: CollectionDetail;
	// originalCollection: CollectionDetail;
}

// Discriminated union of all tab types
type Tab = EndpointTab | FolderTab | CollectionTab;

interface TabsState {
	tabs: Tab[];
	activeTabId: string | null; // This will store the tab's id (endpoint.uuid, folder.uuid, etc.)
}

const initialState: TabsState = {
	tabs: [],
	activeTabId: null,
};

// Helper function to deep clone an endpoint
const cloneEndpoint = (
	endpoint: EndpointDetail,
): EndpointDetail => {
	return JSON.parse(JSON.stringify(endpoint));
};

// Helper function to check if endpoint has changed
const hasEndpointChanged = (
	current: EndpointDetail,
	original: EndpointDetail,
): boolean => {
	// Compare relevant fields
	return (
		current.method !== original.method ||
		current.url !== original.url ||
		current.name !== original.name ||
		JSON.stringify(current.cases) !==
			JSON.stringify(original.cases)
	);
};

export const tabsSlice = createSlice({
	name: 'tabs',
	initialState,
	reducers: {
		addTab: (
			state,
			action: PayloadAction<EndpointDetail | undefined>,
		) => {
			const endpoint = action.payload;
			if (endpoint && endpoint.uuid) {
				// Check if tab for this endpoint already exists
				const existingTab = state.tabs.find(
					(tab) =>
						tab.type === 'endpoint' &&
						tab.endpoint.uuid === endpoint.uuid,
				);

				if (!existingTab) {
					const newTab: EndpointTab = {
						id: endpoint.uuid,
						type: 'endpoint',
						endpoint,
						originalEndpoint: cloneEndpoint(endpoint), // Store original state
						activeCaseId: endpoint.cases[0]?.uuid || '',
						notSaved: false,
						new: false,
						isRenaming: false,
					};
					state.tabs.push(newTab);
					state.activeTabId = endpoint.uuid;
				} else {
					state.activeTabId = existingTab.id;
				}
			} else {
				// Create a new empty endpoint
				const newCase = {
					id: 1,
					uuid: getUUID(),
					name: '200 OK Response',
					description: 'Successful response',
					request: {
						headers: [],
						query_params: [],
						path_params: [],
						body: null,
						auth: null,
					},
					response: {
						status_code: 200,
						headers: [],
						body: null,
					},
				};

				const newEndpoint: EndpointDetail = {
					id: 0,
					uuid: getUUID(),
					name: 'New Request',
					summary: '',
					description: '',
					method: 'GET',
					url: '',
					cases: [newCase],
				};

				const newTab: EndpointTab = {
					id: newEndpoint.uuid,
					type: 'endpoint',
					endpoint: newEndpoint,
					originalEndpoint: cloneEndpoint(newEndpoint), // Store original state
					activeCaseId: newCase.uuid,
					notSaved: true,
					new: true,
					isRenaming: false,
				};

				state.tabs.push(newTab);
				state.activeTabId = newEndpoint.uuid;
			}
		},

		setActiveTab: (
			state,
			action: PayloadAction<string>, // tab id (endpoint UUID, folder UUID, etc.)
		) => {
			const tabId = action.payload;
			if (state.tabs.find((tab) => tab.id === tabId)) {
				state.activeTabId = tabId;
			}
		},

		closeTab: (state, action: PayloadAction<string>) => {
			// tab id (endpoint UUID, folder UUID, etc.)
			const tabId = action.payload;
			const tabIndex = state.tabs.findIndex(
				(tab) => tab.id === tabId,
			);

			if (tabIndex === -1) return;

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

		updateTabSavedState: (
			state,
			action: PayloadAction<{
				tabId: string;
				notSaved: boolean;
			}>,
		) => {
			const { tabId, notSaved } = action.payload;
			const tab = state.tabs.find(
				(tab) => tab.id === tabId,
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
				(tab) => tab.id === tabId,
			);
			if (tab) {
				tab.isRenaming = isRenaming;
			}
		},

		updateTabName: (
			state,
			action: PayloadAction<{
				endpointId: string;
				name: string;
			}>,
		) => {
			const { endpointId, name } = action.payload;
			const tab = state.tabs.find(
				(tab) =>
					tab.type === 'endpoint' &&
					tab.endpoint.uuid === endpointId,
			);
			if (tab && tab.type === 'endpoint') {
				tab.endpoint.name = name;
			}
		},

		updateNotSaveState: (
			state,
			action: PayloadAction<{
				endpointId: string;
				notSaved: boolean;
			}>,
		) => {
			const { endpointId, notSaved } = action.payload;
			const tab = state.tabs.find(
				(tab) =>
					tab.type === 'endpoint' &&
					tab.endpoint.uuid === endpointId,
			);
			if (tab) {
				tab.notSaved = notSaved;
			}
		},

		updateEndpoint: (
			state,
			action: PayloadAction<{
				endpointId: string;
				fields: Partial<EndpointDetail>;
			}>,
		) => {
			const { endpointId, fields } = action.payload;

			const tab = state.tabs.find(
				(tab) =>
					tab.type === 'endpoint' &&
					tab.endpoint.uuid === endpointId,
			);
			if (tab && tab.type === 'endpoint') {
				// Update only the specified fields
				tab.endpoint = {
					...tab.endpoint,
					...fields,
				};

				console.log(tab.endpoint);

				// Check if the endpoint has changed from its original state
				tab.notSaved = hasEndpointChanged(
					tab.endpoint,
					tab.originalEndpoint,
				);

				console.log(tab.notSaved);
			}
		},

		updateCase: (
			state,
			action: PayloadAction<{
				endpointId: string;
				caseId: string;
				fields: Partial<EndpointDetail['cases'][0]>;
			}>,
		) => {
			const { endpointId, caseId, fields } = action.payload;
			const tab = state.tabs.find(
				(tab) =>
					tab.type === 'endpoint' &&
					tab.endpoint.uuid === endpointId,
			);
			if (tab && tab.type === 'endpoint') {
				const caseIndex = tab.endpoint.cases.findIndex(
					(c) => c.uuid === caseId,
				);
				if (caseIndex !== -1) {
					// Update only the specified fields in the case
					tab.endpoint.cases[caseIndex] = {
						...tab.endpoint.cases[caseIndex],
						...fields,
					};
					// Check if the endpoint has changed from its original state
					tab.notSaved = hasEndpointChanged(
						tab.endpoint,
						tab.originalEndpoint,
					);
				}
			}
		},

		// TODO: check this function
		updateOriginalState: (
			state,
			action: PayloadAction<{
				endpointId: string;
			}>,
		) => {
			const { endpointId } = action.payload;
			const tab = state.tabs.find(
				(tab) =>
					tab.type === 'endpoint' &&
					tab.endpoint.uuid === endpointId,
			);
			if (tab && tab.type === 'endpoint') {
				// Update the original state to match current state after saving
				tab.originalEndpoint = cloneEndpoint(tab.endpoint);
				tab.notSaved = false;
			}
		},

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
	updateTabName,
	updateNotSaveState,
	updateEndpoint,
	updateCase,
	updateOriginalState,
} = tabsSlice.actions;

export default tabsSlice.reducer;
