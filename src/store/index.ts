import { configureStore } from '@reduxjs/toolkit';
import urlReducer from '@/store/slices/urlSlice';
import headersAuthReducer from '@/store/slices/headersAuthSlice';
import endpointsReducer from '@/store/slices/endpointsSlice';
import tabsReducer from '@/store/slices/tabsSlice';
import collectionsReducer from '@/store/slices/collectionSlice';

export const store = configureStore({
  reducer: {
    url: urlReducer,
    headersAuth: headersAuthReducer,
    endpoints: endpointsReducer,
    tabs: tabsReducer,  
    collections: collectionsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
