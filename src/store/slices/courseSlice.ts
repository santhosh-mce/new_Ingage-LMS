import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CourseDto, getCourses, getCourseById } from '../../api/courseApi';
import { CourseContentDetail, getCourseContent, getMyEnrollments, UserEnrollmentRecord } from '../../api/paymentApi';
import {
  markLessonComplete,
  saveLessonProgress,
  createAdminCourse,
  updateAdminCourse,
  deleteAdminCourse,
  publishAdminCourse,
  unpublishAdminCourse,
} from '../../api/adminApi';

export interface CourseState {
  courses: CourseDto[];
  selectedCourse: CourseDto | null;
  selectedCourseContent: CourseContentDetail | null;
  loading: boolean;
  contentLoading: boolean;
  actionLoading: boolean;
  actionSuccess: string | null;
  error: string | null;
  enrollments: UserEnrollmentRecord[];
  enrollmentsLoading: boolean;
  enrollmentsError: string | null;

  // Learning flow state
  activeLessonId: number | null;
  completedLessonIds: number[];
  courseProgress: number;
  lessonPlayback: Record<number, { currentTime: number; duration: number; watchDuration: number }>;
}

const initialState: CourseState = {
  courses: [],
  selectedCourse: null,
  selectedCourseContent: null,
  loading: false,
  contentLoading: false,
  actionLoading: false,
  actionSuccess: null,
  error: null,
  enrollments: [],
  enrollmentsLoading: false,
  enrollmentsError: null,

  activeLessonId: null,
  completedLessonIds: [],
  courseProgress: 0,
  lessonPlayback: {},
};

export const fetchCourses = createAsyncThunk<CourseDto[], string | void, { rejectValue: string }>(
  'course/fetchCourses',
  async (search, { rejectWithValue }) => {
    try {
      const response = await getCourses(search || undefined);
      return response;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to load courses');
    }
  }
);

export const fetchCourseByIdThunk = createAsyncThunk<CourseDto, number | string, { rejectValue: string }>(
  'course/fetchCourseById',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await getCourseById(courseId);
      return response;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to load course');
    }
  }
);

export const createCourseThunk = createAsyncThunk<CourseDto, Record<string, any>, { rejectValue: string }>(
  'course/createCourse',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await createAdminCourse(payload);
      return response;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to create course');
    }
  }
);

export const updateCourseThunk = createAsyncThunk<CourseDto, { id: number | string; payload: Record<string, any> }, { rejectValue: string }>(
  'course/updateCourse',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await updateAdminCourse(id, payload);
      return response;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to update course');
    }
  }
);

export const deleteCourseThunk = createAsyncThunk<{ id: number | string; res: any }, number | string, { rejectValue: string }>(
  'course/deleteCourse',
  async (id, { rejectWithValue }) => {
    try {
      const res = await deleteAdminCourse(id);
      return { id, res };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to delete course');
    }
  }
);

export const publishCourseThunk = createAsyncThunk<number | string, number | string, { rejectValue: string }>(
  'course/publishCourse',
  async (id, { rejectWithValue }) => {
    try {
      const res = await publishAdminCourse(id);
      if (res && res.success === false) {
        return rejectWithValue(res.errors?.join(', ') || res.message || 'Publishing failed');
      }
      return id;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to publish course');
    }
  }
);

export const unpublishCourseThunk = createAsyncThunk<number | string, number | string, { rejectValue: string }>(
  'course/unpublishCourse',
  async (id, { rejectWithValue }) => {
    try {
      await unpublishAdminCourse(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to unpublish course');
    }
  }
);

export const fetchCourseContent = createAsyncThunk<CourseContentDetail, number | string, { rejectValue: string }>(
  'course/fetchCourseContent',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await getCourseContent(courseId);
      return response;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.error || err?.message || 'Failed to load course details');
    }
  }
);

export const fetchMyEnrollments = createAsyncThunk<UserEnrollmentRecord[], void, { rejectValue: string }>(
  'course/fetchMyEnrollments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMyEnrollments();
      return response;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to load enrolled courses');
    }
  }
);

export const completeLessonThunk = createAsyncThunk<
  any,
  {
    lessonId: number;
    currentTime?: number;
    duration?: number;
    watchDurationSeconds?: number;
    lessonProgress?: number;
  },
  { rejectValue: string }
>('course/completeLesson', async ({ lessonId, ...payload }, { rejectWithValue }) => {
  try {
    const response = await markLessonComplete(lessonId, payload);
    return { ...response, lessonId };
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to complete lesson');
  }
});

export const saveLessonProgressThunk = createAsyncThunk<
  any,
  {
    lessonId: number;
    currentTime: number;
    duration: number;
    watchDurationSeconds?: number;
  },
  { rejectValue: string }
>('course/saveLessonProgress', async ({ lessonId, ...payload }, { rejectWithValue }) => {
  try {
    const response = await saveLessonProgress(lessonId, payload);
    return { ...response, lessonId };
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to save progress');
  }
});

export const courseSlice = createSlice({
  name: 'course',
  initialState,
  reducers: {
    setSelectedCourseContent: (state, action: PayloadAction<CourseContentDetail | null>) => {
      state.selectedCourseContent = action.payload;
    },
    clearSelectedCourseContent: (state) => {
      state.selectedCourseContent = null;
      state.error = null;
    },
    markCourseAsEnrolled: (state, action: PayloadAction<number>) => {
      if (state.selectedCourseContent && state.selectedCourseContent.id === action.payload) {
        state.selectedCourseContent.isEnrolled = true;
      }
    },
    setActiveLessonId: (state, action: PayloadAction<number | null>) => {
      state.activeLessonId = action.payload;
    },
    setCompletedLessonIds: (state, action: PayloadAction<number[]>) => {
      state.completedLessonIds = action.payload;
    },
    setCourseProgress: (state, action: PayloadAction<number>) => {
      state.courseProgress = action.payload;
    },
    markLessonCompletedLocally: (
      state,
      action: PayloadAction<{ lessonId: number; courseProgress?: number }>
    ) => {
      if (!state.completedLessonIds.includes(action.payload.lessonId)) {
        state.completedLessonIds.push(action.payload.lessonId);
      }
      if (action.payload.courseProgress !== undefined) {
        state.courseProgress = action.payload.courseProgress;
      }
    },
    updateLessonPlayback: (
      state,
      action: PayloadAction<{ lessonId: number; currentTime: number; duration: number; watchDuration: number }>
    ) => {
      state.lessonPlayback[action.payload.lessonId] = {
        currentTime: action.payload.currentTime,
        duration: action.payload.duration,
        watchDuration: action.payload.watchDuration,
      };
    },
  },
  extraReducers: (builder) => {
    // Fetch Courses List
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.courses = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load courses';
      });

    // Fetch Course Content
    builder
      .addCase(fetchCourseContent.pending, (state) => {
        state.contentLoading = true;
        state.error = null;
      })
      .addCase(fetchCourseContent.fulfilled, (state, action) => {
        state.selectedCourseContent = action.payload;
        state.contentLoading = false;
        state.error = null;
        if (action.payload.completedLessonIds) {
          state.completedLessonIds = action.payload.completedLessonIds;
        }
        if (action.payload.progressPercentage !== undefined) {
          state.courseProgress = action.payload.progressPercentage;
        }
      })
      .addCase(fetchCourseContent.rejected, (state, action) => {
        state.contentLoading = false;
        state.error = action.payload || 'Failed to load course content';
      });

    // Fetch User Enrollments
    builder
      .addCase(fetchMyEnrollments.pending, (state) => {
        state.enrollmentsLoading = true;
        state.enrollmentsError = null;
      })
      .addCase(fetchMyEnrollments.fulfilled, (state, action) => {
        state.enrollments = action.payload;
        state.enrollmentsLoading = false;
        state.enrollmentsError = null;
      })
      .addCase(fetchMyEnrollments.rejected, (state, action) => {
        state.enrollmentsLoading = false;
        state.enrollmentsError = action.payload || 'Failed to load enrolled courses';
      });

    // Complete Lesson Thunk
    builder
      .addCase(completeLessonThunk.fulfilled, (state, action) => {
        const lessonId = action.payload.lessonId;
        if (lessonId && !state.completedLessonIds.includes(lessonId)) {
          state.completedLessonIds.push(lessonId);
        }
        if (action.payload.progressPercentage !== undefined) {
          state.courseProgress = action.payload.progressPercentage;
        }
      });

    // Fetch Course By ID
    builder
      .addCase(fetchCourseByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourseByIdThunk.fulfilled, (state, action) => {
        state.selectedCourse = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchCourseByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load course';
      });

    // Create Course
    builder
      .addCase(createCourseThunk.pending, (state) => {
        state.actionLoading = true;
        state.actionSuccess = null;
        state.error = null;
      })
      .addCase(createCourseThunk.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.actionSuccess = 'Course created successfully';
        state.courses.unshift(action.payload);
      })
      .addCase(createCourseThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || 'Failed to create course';
      });

    // Update Course
    builder
      .addCase(updateCourseThunk.pending, (state) => {
        state.actionLoading = true;
        state.actionSuccess = null;
        state.error = null;
      })
      .addCase(updateCourseThunk.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.actionSuccess = 'Course updated successfully';
        const index = state.courses.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.courses[index] = action.payload;
        }
        if (state.selectedCourse && state.selectedCourse.id === action.payload.id) {
          state.selectedCourse = action.payload;
        }
      })
      .addCase(updateCourseThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || 'Failed to update course';
      });

    // Delete Course
    builder
      .addCase(deleteCourseThunk.pending, (state) => {
        state.actionLoading = true;
        state.actionSuccess = null;
        state.error = null;
      })
      .addCase(deleteCourseThunk.fulfilled, (state, action) => {
        state.actionLoading = false;
        const { id, res } = action.payload;
        if (res && res.archived) {
          state.actionSuccess = 'Course archived successfully';
          const target = state.courses.find((c) => c.id === Number(id));
          if (target) {
            target.published = false;
            target.status = 'ARCHIVED';
          }
        } else {
          state.actionSuccess = 'Course deleted successfully';
          state.courses = state.courses.filter((c) => c.id !== Number(id));
        }
      })
      .addCase(deleteCourseThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || 'Failed to delete course';
      });

    // Publish Course
    builder
      .addCase(publishCourseThunk.fulfilled, (state, action) => {
        const id = Number(action.payload);
        const target = state.courses.find((c) => c.id === id);
        if (target) {
          target.published = true;
          target.status = 'PUBLISHED';
        }
      });

    // Unpublish Course
    builder
      .addCase(unpublishCourseThunk.fulfilled, (state, action) => {
        const id = Number(action.payload);
        const target = state.courses.find((c) => c.id === id);
        if (target) {
          target.published = false;
          target.status = 'UNPUBLISHED';
        }
      });
  },
});

export const {
  setSelectedCourseContent,
  clearSelectedCourseContent,
  markCourseAsEnrolled,
  setActiveLessonId,
  setCompletedLessonIds,
  setCourseProgress,
  markLessonCompletedLocally,
  updateLessonPlayback,
} = courseSlice.actions;

export default courseSlice.reducer;
