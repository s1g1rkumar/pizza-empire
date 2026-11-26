import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { EmployeeQueryParams, employeeService } from '@/services/employeeService';
import { CandidateDTO, EmployeesDashboardData } from '@/types/employee.types';

interface EmployeeState {
  data: EmployeesDashboardData | null;
  candidates: CandidateDTO[];
  loading: boolean;
  acting: boolean;
  error: string | null;
}

const initialState: EmployeeState = {
  data: null,
  candidates: [],
  loading: false,
  acting: false,
  error: null,
};

function extractErr(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    const msg = (err.response?.data as { error?: { message?: string } } | undefined)?.error
      ?.message;
    if (msg) return msg;
  }
  return err instanceof Error ? err.message : fallback;
}

export const fetchEmployees = createAsyncThunk(
  'employees/fetch',
  async (params: EmployeeQueryParams = {}, { rejectWithValue }) => {
    try {
      const [dashboard, candidates] = await Promise.all([
        employeeService.getDashboard(params),
        employeeService.getCandidates(),
      ]);
      return { dashboard, candidates };
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Failed to load employees'));
    }
  }
);

export const refreshCandidates = createAsyncThunk(
  'employees/candidates',
  async (_, { rejectWithValue }) => {
    try {
      return await employeeService.getCandidates();
    } catch (err) {
      return rejectWithValue(extractErr(err, 'Failed to load candidates'));
    }
  }
);

const employeeSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    clearEmployeeError(state) {
      state.error = null;
    },
    setEmployeeError(state, action) {
      state.error = String(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.dashboard;
        state.candidates = action.payload.candidates;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.payload ?? 'Failed to load employees');
      })
      .addCase(refreshCandidates.fulfilled, (state, action) => {
        state.candidates = action.payload;
      });
  },
});

export const { clearEmployeeError, setEmployeeError } = employeeSlice.actions;
export default employeeSlice.reducer;
