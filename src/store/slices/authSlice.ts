import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { UserProfile } from '../../types';
import {
  getCurrentUser,
  loginUser as apiLoginUser,
  registerUser as apiRegisterUser,
  logoutUser as apiLogoutUser,
  uploadProfileImageApi,
  removeProfileImageApi,
  LoginRequest,
  RegisterRequest,
  getAuthErrorMessage,
  getAccessibleImageUrl,
} from '../../api/authApi';

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Synchronously restore authentication state from localStorage on initial store creation
const getInitialAuthState = (): AuthState => {
  if (typeof window === 'undefined') {
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    };
  }

  const token = localStorage.getItem('ingage_token');
  const savedUser = localStorage.getItem('ingage_user');

  if (token && savedUser) {
    try {
      const user = JSON.parse(savedUser) as UserProfile;
      if (user.avatarUrl) {
        user.avatarUrl = getAccessibleImageUrl(user.avatarUrl);
      }
      return {
        user,
        token,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    } catch {
      // JSON parse error, continue
    }
  }

  if (token && !savedUser) {
    return {
      user: null,
      token,
      isAuthenticated: false,
      loading: true, // will be resolved by fetchCurrentUser
      error: null,
    };
  }

  return {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  };
};

const initialState: AuthState = getInitialAuthState();

export const fetchCurrentUser = createAsyncThunk<UserProfile, void, { rejectValue: string }>(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('ingage_token');
    if (!token) {
      return rejectWithValue('No token found');
    }

    try {
      const res = await getCurrentUser();
      const savedUserStr = localStorage.getItem('ingage_user');
      let existingPaths: string[] = [];
      if (savedUserStr) {
        try {
          const parsed = JSON.parse(savedUserStr);
          existingPaths = parsed.enrolledPaths || [];
        } catch {
          // ignore
        }
      }

      const rawAvatar = res.avatarUrl || res.profileImage || res.avatar;
      let resolvedAvatarUrl: string | undefined = undefined;
      if (rawAvatar && rawAvatar.trim() !== '') {
        resolvedAvatarUrl = getAccessibleImageUrl(rawAvatar);
      }

      const profile: UserProfile = {
        id: res.userId,
        name: res.name,
        email: res.email,
        role: res.role,
        avatarUrl: resolvedAvatarUrl || (savedUserStr ? JSON.parse(savedUserStr).avatarUrl : undefined),
        enrolledPaths: existingPaths,
      };

      localStorage.setItem('ingage_user', JSON.stringify(profile));
      return profile;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem('ingage_token');
        localStorage.removeItem('ingage_user');
        return rejectWithValue('Session expired');
      }
      return rejectWithValue(getAuthErrorMessage(err, 'Failed to fetch current user'));
    }
  }
);

export const loginUserThunk = createAsyncThunk<
  { token: string; user: UserProfile },
  LoginRequest,
  { rejectValue: string }
>('auth/loginUser', async (payload, { rejectWithValue }) => {
  try {
    const res = await apiLoginUser(payload);
    const token = res.token || '';
    if (!token) {
      return rejectWithValue('No token returned from server');
    }

    const user: UserProfile = {
      id: res.userId || '1',
      name: res.name || payload.email.split('@')[0],
      email: res.email || payload.email,
      role: res.role || 'LEARNER',
      enrolledPaths: [],
    };

    localStorage.setItem('ingage_token', token);
    localStorage.setItem('ingage_user', JSON.stringify(user));
    return { token, user };
  } catch (err: any) {
    return rejectWithValue(getAuthErrorMessage(err, 'Login failed. Please check your credentials.'));
  }
});

export const registerUserThunk = createAsyncThunk<
  { token?: string; user: UserProfile },
  RegisterRequest,
  { rejectValue: string }
>('auth/registerUser', async (payload, { rejectWithValue }) => {
  try {
    const res = await apiRegisterUser(payload);
    const token = res.token;
    const user: UserProfile = {
      id: res.userId || '1',
      name: res.name || payload.name,
      email: res.email || payload.email,
      role: res.role || 'LEARNER',
      enrolledPaths: [],
    };

    if (token) {
      localStorage.setItem('ingage_token', token);
      localStorage.setItem('ingage_user', JSON.stringify(user));
    }
    return { token: token || undefined, user };
  } catch (err: any) {
    return rejectWithValue(getAuthErrorMessage(err, 'Registration failed.'));
  }
});

export const logoutUserThunk = createAsyncThunk('auth/logoutUser', async () => {
  try {
    await apiLogoutUser();
  } catch {
    // ignore
  } finally {
    localStorage.removeItem('ingage_token');
    localStorage.removeItem('ingage_user');
    try {
      sessionStorage.removeItem('ingage_redirect_after_auth');
    } catch {
      // ignore
    }
  }
});

export const uploadProfileImageThunk = createAsyncThunk<
  string,
  File,
  { rejectValue: string }
>('auth/uploadProfileImage', async (file, { rejectWithValue }) => {
  try {
    const res = await uploadProfileImageApi(file);
    const rawUrl = res.profileImage || res.avatarUrl || '';
    if (!rawUrl) {
      return rejectWithValue('No profile image URL returned from server.');
    }
    const finalUrl = getAccessibleImageUrl(rawUrl);
    return finalUrl;
  } catch (err: any) {
    return rejectWithValue(getAuthErrorMessage(err, 'Failed to upload profile image.'));
  }
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: UserProfile }>
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      localStorage.setItem('ingage_token', action.payload.token);
      localStorage.setItem('ingage_user', JSON.stringify(action.payload.user));
    },
    clearCredentials: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('ingage_token');
      localStorage.removeItem('ingage_user');
    },
    updateUserProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('ingage_user', JSON.stringify(state.user));
      }
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Current User
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        if (!state.user) {
          state.loading = true;
        }
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        if (action.payload === 'Session expired' || action.payload === 'No token found') {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
        }
      });

    // Login User
    builder
      .addCase(loginUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUserThunk.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
      })
      .addCase(loginUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed';
      });

    // Register User
    builder
      .addCase(registerUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUserThunk.fulfilled, (state, action) => {
        if (action.payload.token) {
          state.token = action.payload.token;
          state.user = action.payload.user;
          state.isAuthenticated = true;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(registerUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Registration failed';
      });

    // Logout User
    builder.addCase(logoutUserThunk.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    });

    // Upload Profile Image
    builder.addCase(uploadProfileImageThunk.fulfilled, (state, action) => {
      if (state.user) {
        state.user.avatarUrl = action.payload;
        state.user.profileImage = action.payload;
        localStorage.setItem('ingage_user', JSON.stringify(state.user));
      }
    });
  },
});

export const { setCredentials, clearCredentials, updateUserProfile, clearAuthError } =
  authSlice.actions;

export default authSlice.reducer;
