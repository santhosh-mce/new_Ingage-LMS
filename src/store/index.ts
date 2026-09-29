import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import careerReducer from './slices/careerSlice';
import courseReducer from './slices/courseSlice';
import opportunityReducer from './slices/opportunitySlice';
import projectReducer from './slices/projectSlice';
import certificateReducer from './slices/certificateSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    career: careerReducer,
    course: courseReducer,
    opportunity: opportunityReducer,
    project: projectReducer,
    certificate: certificateReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
