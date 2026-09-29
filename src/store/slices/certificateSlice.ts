import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  CertificateDto,
  getMyCertificates,
  getCertificateById,
  downloadCertificatePdf,
  generateCourseCertificate,
} from '../../api/certificateApi';

interface CertificateState {
  myCertificates: CertificateDto[];
  activeCertificate: CertificateDto | null;
  loading: boolean;
  downloadingId: number | null;
  error: string | null;
}

const initialState: CertificateState = {
  myCertificates: [],
  activeCertificate: null,
  loading: false,
  downloadingId: null,
  error: null,
};

export const fetchMyCertificatesThunk = createAsyncThunk(
  'certificate/fetchMyCertificates',
  async (_, { rejectWithValue }) => {
    try {
      return await getMyCertificates();
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Failed to fetch certificates'
      );
    }
  }
);

export const fetchCertificateByIdThunk = createAsyncThunk(
  'certificate/fetchCertificateById',
  async (id: number | string, { rejectWithValue }) => {
    try {
      return await getCertificateById(id);
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Failed to fetch certificate details'
      );
    }
  }
);

export const generateCertificateThunk = createAsyncThunk(
  'certificate/generateCertificate',
  async (courseId: number | string, { rejectWithValue }) => {
    try {
      return await generateCourseCertificate(courseId);
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Failed to generate certificate'
      );
    }
  }
);

export const downloadCertificateThunk = createAsyncThunk(
  'certificate/downloadCertificate',
  async (
    { id, certificateNumber }: { id: number | string; certificateNumber?: string },
    { rejectWithValue }
  ) => {
    try {
      await downloadCertificatePdf(id, certificateNumber);
      return Number(id);
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Failed to download certificate PDF'
      );
    }
  }
);

export const certificateSlice = createSlice({
  name: 'certificate',
  initialState,
  reducers: {
    clearActiveCertificate: (state) => {
      state.activeCertificate = null;
      state.error = null;
    },
    clearCertificateError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch My Certificates
    builder.addCase(fetchMyCertificatesThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      fetchMyCertificatesThunk.fulfilled,
      (state, action: PayloadAction<CertificateDto[]>) => {
        state.loading = false;
        state.myCertificates = action.payload;
      }
    );
    builder.addCase(fetchMyCertificatesThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Certificate By ID
    builder.addCase(fetchCertificateByIdThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      fetchCertificateByIdThunk.fulfilled,
      (state, action: PayloadAction<CertificateDto>) => {
        state.loading = false;
        state.activeCertificate = action.payload;
      }
    );
    builder.addCase(fetchCertificateByIdThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Generate Certificate
    builder.addCase(generateCertificateThunk.fulfilled, (state, action: PayloadAction<CertificateDto>) => {
      state.activeCertificate = action.payload;
      const exists = state.myCertificates.some((c) => c.id === action.payload.id);
      if (!exists) {
        state.myCertificates.unshift(action.payload);
      }
    });

    // Download Certificate
    builder.addCase(downloadCertificateThunk.pending, (state, action) => {
      state.downloadingId = Number(action.meta.arg.id);
    });
    builder.addCase(downloadCertificateThunk.fulfilled, (state) => {
      state.downloadingId = null;
    });
    builder.addCase(downloadCertificateThunk.rejected, (state, action) => {
      state.downloadingId = null;
      state.error = action.payload as string;
    });
  },
});

export const { clearActiveCertificate, clearCertificateError } = certificateSlice.actions;
export default certificateSlice.reducer;
