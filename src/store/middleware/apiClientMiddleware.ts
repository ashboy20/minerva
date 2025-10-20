import { Middleware, AnyAction } from '@reduxjs/toolkit';
import { updateTabName } from '@/store/slices/tabsSlice';
import { updateItem } from '@/store/slices/collectionSlice';
import { RootState } from '@/store';

interface UpdateItemAction extends AnyAction {
	payload: {
		uuid: string;
		fields: {
			name?: string;
			[key: string]: any;
		};
	};
}

// Middleware to sync the endpoint name with the tab name and the endpoint name in the collection list
export const syncEndpointNameMiddleware: Middleware =
	(store) => (next) => (action: unknown) => {
		// Call next first to process the action
		const result = next(action);

		// Then perform side effects
		const afterState = store.getState() as RootState;

		if (
			typeof action === 'object' &&
			action !== null &&
			'type' in action &&
			action.type === 'collection/updateItem/fulfilled'
		) {
			const { uuid, fields } = (action as UpdateItemAction)
				.payload;
			if (fields && fields.name) {
				// Get the tab before dispatching new actions
				const tab = afterState.tabs.tabs.find(
					(tab) => tab.endpoint.uuid === uuid,
				);
				if (tab) {
					store.dispatch(
						updateTabName({
							endpointId: uuid,
							name: fields.name,
						}),
					);
				}
			}
		}

		return result;
	};
