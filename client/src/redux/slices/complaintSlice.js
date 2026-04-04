import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createComplaint,
  fetchComplaints,
  fetchComplaintById,
  updateComplaint,
  deleteComplaint,
  fetchHistory,
  fetchComplaintStats,
  buildFormDataForComplaint,
} from "../../services/complaintService";

export const createComplaintAction = createAsyncThunk(
  "complaints/create",
  async ({ formData }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.user?.token;
      const data = await createComplaint(formData, token);
      if (data?.message && data?.error) return rejectWithValue(data.message || "Failed");
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Network error");
    }
  },
);

export const listComplaints = createAsyncThunk(
  "complaints/list",
  async (
    {
      filters = {},
      pagination = { page: 1, limit: 10, sortBy: "createdAt", order: "desc" },
    } = {},
    { getState, rejectWithValue }
  ) => {
    try {
      const token = getState().auth.user?.token;
      const data = await fetchComplaints(filters, pagination, token);
      if (data?.error || (data?.message && data?.message.includes("error"))) {
        return rejectWithValue(data.message || "Failed to fetch complaints");
      }
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Network error");
    }
  }
);

export const getComplaint = createAsyncThunk(
  "complaints/detail",
  async ({ id }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.user?.token;
      const data = await fetchComplaintById(id, token);
      if (data?.message && data?.error) return rejectWithValue(data.message || "Failed");
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Network error");
    }
  },
);

export const updateComplaintAction = createAsyncThunk(
  "complaints/update",
  async ({ id, updates }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.user?.token;
      const data = await updateComplaint(id, updates, token);
      if (data?.message && data?.error) return rejectWithValue(data.message || "Failed");
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Network error");
    }
  },
);

export const deleteComplaintAction = createAsyncThunk(
  "complaints/delete",
  async ({ id }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.user?.token;
      const data = await deleteComplaint(id, token);
      if (data?.message && data?.message !== "Complaint deleted") return rejectWithValue(data.message || "Failed");
      return id;
    } catch (err) {
      return rejectWithValue(err.message || "Network error");
    }
  },
);

export const fetchComplaintHistoryAction = createAsyncThunk(
  "complaints/history",
  async ({ id }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.user?.token;
      const data = await fetchHistory(id, token);
      if (data?.message && data?.error) return rejectWithValue(data.message || "Failed");
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Network error");
    }
  },
);

export const fetchComplaintStatsAction = createAsyncThunk(
  "complaints/stats",
  async ({ filters = {} } = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.user?.token;
      const data = await fetchComplaintStats(filters, token);
      if (data?.error || (data?.message && data?.message.includes("error"))) {
        return rejectWithValue(data.message || "Failed to fetch stats");
      }
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Network error");
    }
  },
);

const complaintSlice = createSlice({
  name: "complaints",
  initialState: {
    list: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    current: null,
    history: [],
    stats: null,
    loading: false,
    error: null,
    success: null,
  },
  reducers: {
    clearComplaintStatus(state) {
      state.error = null;
      state.success = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    const pending = (state) => {
      state.loading = true;
      state.error = null;
      state.success = null;
    };

    const rejected = (state, action) => {
      state.loading = false;
      state.error = action.payload || action.error.message;
    };

    builder
      .addCase(createComplaintAction.pending, pending)
      .addCase(createComplaintAction.fulfilled, (state, action) => {
        state.loading = false;
        state.success = "Complaint created successfully";
        state.list.unshift(action.payload);
      })
      .addCase(createComplaintAction.rejected, rejected)

      .addCase(listComplaints.pending, pending)
      .addCase(listComplaints.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data || [];
        state.total = action.payload.pagination?.total || 0;
        state.page = action.payload.pagination?.page || 1;
        state.limit = action.payload.pagination?.limit || 10;
        state.totalPages = action.payload.pagination?.totalPages || 1;
      })
      .addCase(listComplaints.rejected, rejected)

      .addCase(getComplaint.pending, pending)
      .addCase(getComplaint.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(getComplaint.rejected, rejected)

      .addCase(updateComplaintAction.pending, pending)
      .addCase(updateComplaintAction.fulfilled, (state, action) => {
        state.loading = false;
        state.success = "Complaint updated successfully";
        // Update in current detail view
        if (state.current && state.current._id === action.payload._id) {
          state.current = action.payload;
        }
        // Update in list
        const index = state.list.findIndex((item) => item._id === action.payload._id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      .addCase(updateComplaintAction.rejected, rejected)

      .addCase(deleteComplaintAction.pending, pending)
      .addCase(deleteComplaintAction.fulfilled, (state, action) => {
        state.loading = false;
        state.success = "Complaint deleted successfully";
        state.list = state.list.filter((item) => item._id !== action.payload);
      })
      .addCase(deleteComplaintAction.rejected, rejected)

      .addCase(fetchComplaintHistoryAction.pending, pending)
      .addCase(fetchComplaintHistoryAction.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload.data || [];
      })
      .addCase(fetchComplaintHistoryAction.rejected, rejected)

      .addCase(fetchComplaintStatsAction.pending, pending)
      .addCase(fetchComplaintStatsAction.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.data || null;
      })
      .addCase(fetchComplaintStatsAction.rejected, rejected);
  },
});

export const { clearComplaintStatus } = complaintSlice.actions;
export default complaintSlice.reducer;
