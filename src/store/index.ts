import { configureStore } from '@reduxjs/toolkit';
import urlReducer from '@/store/slices/urlSlice';
import headersAuthReducer from '@/store/slices/headersAuthSlice';
import tabsReducer from '@/store/slices/tabsSlice';
import collectionsReducer from '@/store/slices/collectionSlice';
import responseReducer from '@/store/slices/responseSlice';

export const store = configureStore({
	reducer: {
		url: urlReducer,
		headersAuth: headersAuthReducer,
		tabs: tabsReducer,
		collections: collectionsReducer,
		response: responseReducer,
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
