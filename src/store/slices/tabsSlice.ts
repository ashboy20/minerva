import {
	createSlice,
	PayloadAction,
} from '@reduxjs/toolkit';
import { Endpoint } from '@/types/backend/endpoint-management/endpoint';
import { getUUID } from '@/utils/getUUID';
import { updateItem } from '@/store/slices/collectionSlice';

interface Tab {
	endpoint: Endpoint;
	activeCaseId: string;
	notSaved: boolean;
	new: boolean;
	isRenaming?: boolean;
}

interface TabsState {
	tabs: Tab[];
	activeTabId: string | null; // This will store endpoint.uuid
}

const initialState: TabsState = {
	tabs: [],
	activeTabId: null,
};

export const tabsSlice = createSlice({
	name: 'tabs',
	initialState,
	reducers: {
		addTab: (
			state,
			action: PayloadAction<Endpoint | undefined>,
		) => {
			const endpoint = action.payload;
			if (endpoint && endpoint.uuid) {
				// Check if tab for this endpoint already exists
				const existingTab = state.tabs.find(
					(tab) => tab.endpoint.uuid === endpoint.uuid,
				);

				if (!existingTab) {
					const newTab: Tab = {
						endpoint,
						activeCaseId: endpoint.cases[0]?.uuid || '',
						notSaved: false,
						new: false,
						isRenaming: false,
					};
					state.tabs.push(newTab);
					state.activeTabId = endpoint.uuid;
				} else {
					state.activeTabId = existingTab.endpoint.uuid;
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

				const newEndpoint: Endpoint = {
					id: 0,
					uuid: getUUID(),
					name: 'New Request',
					summary: '',
					description: '',
					method: 'GET',
					url: '',
					cases: [newCase],
				};

				const newTab: Tab = {
					endpoint: newEndpoint,
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
			action: PayloadAction<string>, // endpoint UUID
		) => {
			const endpointId = action.payload;
			if (
				state.tabs.find(
					(tab) => tab.endpoint.uuid === endpointId,
				)
			) {
				state.activeTabId = endpointId;
			}
		},

		closeTab: (state, action: PayloadAction<string>) => {
			// endpoint UUID
			const endpointId = action.payload;
			const tabIndex = state.tabs.findIndex(
				(tab) => tab.endpoint.uuid === endpointId,
			);

			if (tabIndex === -1) return;

			// Remove the tab
			state.tabs.splice(tabIndex, 1);

			// If we closed the active tab, set a new active tab
			if (state.activeTabId === endpointId) {
				if (state.tabs.length > 0) {
					// Set the previous tab as active, or first tab if it was the first tab
					const newActiveIndex = Math.max(0, tabIndex - 1);
					state.activeTabId =
						state.tabs[newActiveIndex].endpoint.uuid;
				} else {
					state.activeTabId = null;
				}
			}
		},

		updateTabSavedState: (
			state,
			action: PayloadAction<{
				endpointId: string;
				notSaved: boolean;
			}>,
		) => {
			const { endpointId, notSaved } = action.payload;
			const tab = state.tabs.find(
				(tab) => tab.endpoint.uuid === endpointId,
			);
			if (tab) {
				tab.notSaved = notSaved;
			}
		},

		updateTabRenamingState: (
			state,
			action: PayloadAction<{
				endpointId: string;
				isRenaming: boolean;
			}>,
		) => {
			const { endpointId, isRenaming } = action.payload;
			const tab = state.tabs.find(
				(tab) => tab.endpoint.uuid === endpointId,
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
				(tab) => tab.endpoint.uuid === endpointId,
			);
			if (tab) {
				tab.endpoint.name = name;
				tab.notSaved = true;
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
				(tab) => tab.endpoint.uuid === endpointId,
			);
			if (tab) {
				tab.notSaved = notSaved;
			}
		},

		clearTabs: (state) => {
			state.tabs = [];
			state.activeTabId = null;
		},
	},
	extraReducers: (builder) => {
		builder.addCase(
			updateItem.fulfilled,
			(state, action) => {
				const { uuid, fields } = action.payload;
				const tab = state.tabs.find(
					(tab) => tab.endpoint.uuid === uuid,
				);
				if (tab) {
					tab.endpoint.name = fields.name;
				}
			},
		);
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
} = tabsSlice.actions;

export default tabsSlice.reducer;
