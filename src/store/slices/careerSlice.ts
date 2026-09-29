import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  CareerDto,
  CareerDetailDto,
  CareerStatsDto,
  getCareers,
  getCareerBySlug,
  getCareerStats,
  GetCareersParams,
} from '../../api/careerApi';

export interface CareerState {
  careers: CareerDto[];
  selectedCareer: CareerDetailDto | null;
  loading: boolean;
  detailLoading: boolean;
  error: string | null;
  stats: CareerStatsDto | null;
}

const initialState: CareerState = {
  careers: [],
  selectedCareer: null,
  loading: false,
  detailLoading: false,
  error: null,
  stats: null,
};

export const fetchCareers = createAsyncThunk<CareerDto[], GetCareersParams | void, { rejectValue: string }>(
  'career/fetchCareers',
  async (params, { rejectWithValue }) => {
    try {
      const response = await getCareers(params || undefined);
      return response.content || [];
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to load career paths');
    }
  }
);

export const fetchCareerBySlug = createAsyncThunk<CareerDetailDto, string, { rejectValue: string }>(
  'career/fetchCareerBySlug',
  async (slug, { rejectWithValue }) => {
    try {
      const response = await getCareerBySlug(slug);
      return response;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to load career detail');
    }
  }
);

export const fetchCareerStats = createAsyncThunk<CareerStatsDto, number | string, { rejectValue: string }>(
  'career/fetchCareerStats',
  async (id, { rejectWithValue }) => {
    try {
      const response = await getCareerStats(id);
      return response;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to load career statistics');
    }
  }
);

export const careerSlice = createSlice({
  name: 'career',
  initialState,
  reducers: {
    setSelectedCareer: (state, action: PayloadAction<CareerDetailDto | null>) => {
      state.selectedCareer = action.payload;
    },
    clearSelectedCareer: (state) => {
      state.selectedCareer = null;
      state.error = null;
    },
    updateCourseInSelectedCareer: (
      state,
      action: PayloadAction<{ courseId: number; enrollmentStatus: 'ENROLLED' | 'COMPLETED'; courseAccess?: boolean }>
    ) => {
      if (state.selectedCareer && state.selectedCareer.courses) {
        state.selectedCareer.courses = state.selectedCareer.courses.map((c) => {
          if (c.courseId === action.payload.courseId) {
            return {
              ...c,
              enrollmentStatus: action.payload.enrollmentStatus,
              courseAccess: action.payload.courseAccess !== undefined ? action.payload.courseAccess : true,
            };
          }
          return c;
        });
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Careers List
    builder
      .addCase(fetchCareers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCareers.fulfilled, (state, action) => {
        state.careers = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchCareers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load careers';
      });

    // Fetch Career Detail
    builder
      .addCase(fetchCareerBySlug.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchCareerBySlug.fulfilled, (state, action) => {
        state.selectedCareer = action.payload;
        state.detailLoading = false;
        state.error = null;
      })
      .addCase(fetchCareerBySlug.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload || 'Failed to load career detail';
      });

    // Fetch Career Stats
    builder
      .addCase(fetchCareerStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { setSelectedCareer, clearSelectedCareer, updateCourseInSelectedCareer } =
  careerSlice.actions;

export default careerSlice.reducer;
