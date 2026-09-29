import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  OpportunityItem,
  ApplicationItem,
  OpportunityType,
  WorkMode,
  OpportunityStats,
  getOpportunitiesApi,
  getOpportunityStatsApi,
  getMyApplicationsApi,
  getSavedOpportunityIdsApi,
  applyToOpportunityApi,
  saveOpportunityApi,
  unsaveOpportunityApi,
} from '../../api/opportunityApi';

export interface OpportunityState {
  opportunities: OpportunityItem[];
  applications: ApplicationItem[];
  savedIds: string[];
  availableCount: number;
  appliedCount: number;
  savedCount: number;
  partnersCount: number;
  activeTab: 'all' | 'my-applications' | 'saved';
  selectedType: 'all' | OpportunityType;
  workModeFilter: 'all' | WorkMode;
  searchQuery: string;
  selectedOpportunity: OpportunityItem | null;
  loading: boolean;
  error: string | null;
  applyingId: string | null;
}

const initialState: OpportunityState = {
  opportunities: [],
  applications: [],
  savedIds: [],
  availableCount: 0,
  appliedCount: 0,
  savedCount: 0,
  partnersCount: 0,
  activeTab: 'all',
  selectedType: 'all',
  workModeFilter: 'all',
  searchQuery: '',
  selectedOpportunity: null,
  loading: false,
  error: null,
  applyingId: null,
};

export const fetchOpportunitiesThunk = createAsyncThunk<
  OpportunityItem[],
  { type?: string; workMode?: string; search?: string } | void
>('opportunity/fetchOpportunities', async (params, { rejectWithValue }) => {
  try {
    const data = await getOpportunitiesApi(params || undefined);
    return data;
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to fetch opportunities from server');
  }
});

export const fetchOpportunityStatsThunk = createAsyncThunk<OpportunityStats>(
  'opportunity/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const data = await getOpportunityStatsApi();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch opportunity stats');
    }
  }
);

export const fetchMyApplicationsThunk = createAsyncThunk<ApplicationItem[]>(
  'opportunity/fetchMyApplications',
  async (_, { rejectWithValue }) => {
    try {
      const data = await getMyApplicationsApi();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch user applications');
    }
  }
);

export const fetchSavedOpportunitiesThunk = createAsyncThunk<string[]>(
  'opportunity/fetchSavedOpportunities',
  async (_, { rejectWithValue }) => {
    try {
      const data = await getSavedOpportunityIdsApi();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch saved opportunities');
    }
  }
);

export const applyToOpportunityThunk = createAsyncThunk<
  ApplicationItem,
  { opportunityId: string | number; notes?: string },
  { rejectValue: string }
>('opportunity/applyToOpportunity', async ({ opportunityId, notes }, { rejectWithValue }) => {
  try {
    const application = await applyToOpportunityApi(opportunityId, notes);
    return application;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to submit application');
  }
});

export const toggleSaveOpportunityThunk = createAsyncThunk<
  { id: string; saved: boolean },
  string | number,
  { rejectValue: string }
>('opportunity/toggleSaveOpportunity', async (opportunityId, { getState, rejectWithValue }) => {
  try {
    const state = getState() as { opportunity: OpportunityState };
    const idStr = String(opportunityId);
    const isCurrentlySaved = state.opportunity.savedIds.includes(idStr);

    let saved: boolean;
    if (isCurrentlySaved) {
      saved = await unsaveOpportunityApi(opportunityId);
    } else {
      saved = await saveOpportunityApi(opportunityId);
    }
    return { id: idStr, saved };
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to toggle save opportunity');
  }
});

export const opportunitySlice = createSlice({
  name: 'opportunity',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<'all' | 'my-applications' | 'saved'>) => {
      state.activeTab = action.payload;
    },
    setSelectedType: (state, action: PayloadAction<'all' | OpportunityType>) => {
      state.selectedType = action.payload;
    },
    setWorkModeFilter: (state, action: PayloadAction<'all' | WorkMode>) => {
      state.workModeFilter = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSelectedOpportunity: (state, action: PayloadAction<OpportunityItem | null>) => {
      state.selectedOpportunity = action.payload;
    },
    clearFilters: (state) => {
      state.selectedType = 'all';
      state.workModeFilter = 'all';
      state.searchQuery = '';
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Opportunities
      .addCase(fetchOpportunitiesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOpportunitiesThunk.fulfilled, (state, action: PayloadAction<OpportunityItem[]>) => {
        state.loading = false;
        state.opportunities = action.payload;
        if (state.availableCount === 0) {
          state.availableCount = action.payload.length;
        }
      })
      .addCase(fetchOpportunitiesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Could not load opportunities from database.';
      })
      // Stats
      .addCase(fetchOpportunityStatsThunk.fulfilled, (state, action: PayloadAction<OpportunityStats>) => {
        state.availableCount = action.payload.availableCount;
        state.appliedCount = action.payload.appliedCount;
        state.savedCount = action.payload.savedCount;
        state.partnersCount = action.payload.partnersCount;
      })
      // User Applications
      .addCase(fetchMyApplicationsThunk.fulfilled, (state, action: PayloadAction<ApplicationItem[]>) => {
        state.applications = action.payload;
        state.appliedCount = action.payload.length;
      })
      // User Saved IDs
      .addCase(fetchSavedOpportunitiesThunk.fulfilled, (state, action: PayloadAction<string[]>) => {
        state.savedIds = action.payload;
        state.savedCount = action.payload.length;
      })
      // Apply
      .addCase(applyToOpportunityThunk.pending, (state, action) => {
        state.applyingId = String(action.meta.arg.opportunityId);
      })
      .addCase(applyToOpportunityThunk.fulfilled, (state, action: PayloadAction<ApplicationItem>) => {
        state.applyingId = null;
        const exists = state.applications.some((app) => String(app.opportunityId) === String(action.payload.opportunityId));
        if (!exists) {
          state.applications.unshift(action.payload);
          state.appliedCount += 1;
        }
      })
      .addCase(applyToOpportunityThunk.rejected, (state) => {
        state.applyingId = null;
      })
      // Toggle Save
      .addCase(toggleSaveOpportunityThunk.fulfilled, (state, action) => {
        const { id, saved } = action.payload;
        if (saved) {
          if (!state.savedIds.includes(id)) {
            state.savedIds.push(id);
            state.savedCount += 1;
          }
        } else {
          state.savedIds = state.savedIds.filter((item) => item !== id);
          state.savedCount = Math.max(0, state.savedCount - 1);
        }
      });
  },
});

export const {
  setActiveTab,
  setSelectedType,
  setWorkModeFilter,
  setSearchQuery,
  setSelectedOpportunity,
  clearFilters,
} = opportunitySlice.actions;

export default opportunitySlice.reducer;
