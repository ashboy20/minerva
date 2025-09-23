import { configureStore } from '@reduxjs/toolkit';
import urlReducer from '@/store/slices/urlSlice';
import headersAuthReducer from '@/store/slices/headersAuthSlice';
import endpointsReducer from '@/store/slices/endpointsSlice';

export const store = configureStore({
  reducer: {
    url: urlReducer,
    headersAuth: headersAuthReducer,
    endpoints: endpointsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
