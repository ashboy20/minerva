import { configureStore } from '@reduxjs/toolkit';
import urlReducer from '@/store/slices/urlSlice';
import headersAuthReducer from '@/store/slices/headersAuthSlice';

export const store = configureStore({
  reducer: {
    url: urlReducer,
    headersAuth: headersAuthReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
