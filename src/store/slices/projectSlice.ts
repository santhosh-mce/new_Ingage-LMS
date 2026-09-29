import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  ProjectDto,
  LearnerProjectProgress,
  ProjectStatus,
  getProjectsApi,
  getLearnerProjectsProgress,
  saveLearnerProjectProgress,
} from '../../api/projectApi';

export interface ProjectState {
  projects: ProjectDto[];
  learnerProgress: Record<string, LearnerProjectProgress>;
  searchQuery: string;
  statusFilter: 'All' | ProjectStatus;
  selectedCategory: string;
  selectedProject: ProjectDto | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProjectState = {
  projects: [],
  learnerProgress: {},
  searchQuery: '',
  statusFilter: 'All',
  selectedCategory: 'All',
  selectedProject: null,
  loading: false,
  error: null,
};

export const fetchProjectsThunk = createAsyncThunk(
  'project/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      const data = await getProjectsApi();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch projects');
    }
  }
);

export const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setStatusFilter: (state, action: PayloadAction<'All' | ProjectStatus>) => {
      state.statusFilter = action.payload;
    },
    setSelectedCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload;
    },
    setSelectedProject: (state, action: PayloadAction<ProjectDto | null>) => {
      state.selectedProject = action.payload;
    },
    clearFilters: (state) => {
      state.searchQuery = '';
      state.statusFilter = 'All';
      state.selectedCategory = 'All';
    },
    loadUserProgress: (state, action: PayloadAction<string | number | undefined>) => {
      state.learnerProgress = getLearnerProjectsProgress(action.payload);
    },
    startProject: (
      state,
      action: PayloadAction<{ userId?: string | number; project: ProjectDto }>
    ) => {
      const { userId, project } = action.payload;
      const pid = String(project.id);
      const existing = state.learnerProgress[pid];

      if (!existing || existing.status === 'Not Started') {
        const defaultTasks = (project.whatYouWillBuild && project.whatYouWillBuild.length > 0
          ? project.whatYouWillBuild
          : [
              'Requirement Analysis & Wireframing',
              'UI Component Development',
              'Core Business Logic & State Integration',
              'Testing & Validation',
              'Final Project Deployment'
            ]
        ).map((t, i) => ({
          id: `task-${i + 1}`,
          title: t,
          completed: false,
        }));

        const newProgress: LearnerProjectProgress = {
          projectId: project.id,
          projectSlug: project.slug,
          status: 'In Progress',
          progressPercentage: 0,
          completedTasks: 0,
          totalTasks: defaultTasks.length,
          tasks: defaultTasks,
          startedAt: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          lastUpdated: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
        };

        state.learnerProgress[pid] = newProgress;
        saveLearnerProjectProgress(userId, newProgress);
      }
    },
    toggleTaskCompletion: (
      state,
      action: PayloadAction<{ userId?: string | number; projectId: number | string; taskId: string }>
    ) => {
      const { userId, projectId, taskId } = action.payload;
      const pid = String(projectId);
      const current = state.learnerProgress[pid];

      if (current && current.tasks) {
        const updatedTasks = current.tasks.map((t) =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        );
        const completedCount = updatedTasks.filter((t) => t.completed).length;
        const totalCount = updatedTasks.length;
        const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        const newStatus: ProjectStatus =
          percent === 100 ? 'Completed' : percent > 0 ? 'In Progress' : 'In Progress';

        const updatedProgress: LearnerProjectProgress = {
          ...current,
          tasks: updatedTasks,
          completedTasks: completedCount,
          totalTasks: totalCount,
          progressPercentage: percent,
          status: newStatus,
          lastUpdated: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
        };

        state.learnerProgress[pid] = updatedProgress;
        saveLearnerProjectProgress(userId, updatedProgress);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjectsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectsThunk.fulfilled, (state, action: PayloadAction<ProjectDto[]>) => {
        state.loading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjectsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Unable to load your projects. Please try again.';
      });
  },
});

export const {
  setSearchQuery,
  setStatusFilter,
  setSelectedCategory,
  setSelectedProject,
  clearFilters,
  loadUserProgress,
  startProject,
  toggleTaskCompletion,
} = projectSlice.actions;

export default projectSlice.reducer;
