import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const BASE = "/api/cx-data";

// ── Async Thunks ──────────────────────────────────────────

// GET ALL CX DATA
export const fetchAllCXData = createAsyncThunk(
  "cxData/fetchAll",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;

      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(
          ([_, value]) => value !== "" && value !== undefined && value !== null,
        ),
      );

      const query = new URLSearchParams(cleanParams).toString();

      const res = await fetch(`${BASE}?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch {
      return rejectWithValue("Failed to fetch customer data.");
    }
  },
);

// CREATE SINGLE CX DATA
export const createCXData = createAsyncThunk(
  "cxData/create",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;

      const res = await fetch(BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch {
      return rejectWithValue("Failed to create customer data.");
    }
  },
);

// CREATE MULTIPLE CX DATA
export const createMultipleCXData = createAsyncThunk(
  "cxData/createMultiple",
  async ({ customers }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;

      const res = await fetch(`${BASE}/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ customers }),
      });

      const data = await res.json();

      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch {
      return rejectWithValue("Failed to create customer data.");
    }
  },
);

// UPDATE CX DATA
export const updateCXData = createAsyncThunk(
  "cxData/update",
  async ({ id, ...payload }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;

      const res = await fetch(`${BASE}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch {
      return rejectWithValue("Failed to update customer data.");
    }
  },
);

// DELETE CX DATA
export const deleteCXData = createAsyncThunk(
  "cxData/delete",
  async (customerId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;

      const res = await fetch(`${BASE}/${customerId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) return rejectWithValue(data.message);
      return customerId;
    } catch {
      return rejectWithValue("Failed to delete customer data.");
    }
  },
);

// BULK DELETE CX DATA
export const bulkDeleteCXData = createAsyncThunk(
  "cxData/bulkDelete",
  async (customerIds, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;

      const res = await fetch(`${BASE}/bulk-delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: customerIds }),
      });

      const data = await res.json();

      if (!res.ok) return rejectWithValue(data.message);
      return customerIds;
    } catch {
      return rejectWithValue("Failed to delete customer data.");
    }
  },
);

// ── Slice ─────────────────────────────────────────────────

const cxDataSlice = createSlice({
  name: "cxData",
  initialState: {
    list: [],
    total: 0,
    page: 1,
    totalPages: 1,
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearCXDataMessages(state) {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    const pending = (state) => {
      state.loading = true;
      state.error = null;
      state.successMessage = null;
    };

    const rejected = (state, action) => {
      state.loading = false;
      state.error = action.payload;
    };

    builder
      // FETCH ALL
      .addCase(fetchAllCXData.pending, pending);
    builder
      .addCase(fetchAllCXData.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchAllCXData.rejected, rejected)

      // CREATE SINGLE
      .addCase(createCXData.pending, pending)
      .addCase(createCXData.fulfilled, (state, action) => {
        state.loading = false;
        state.list.unshift(action.payload);
      })
      .addCase(createCXData.rejected, rejected)

      // CREATE MULTIPLE
      .addCase(createMultipleCXData.pending, pending)
      .addCase(createMultipleCXData.fulfilled, (state, action) => {
        state.loading = false;
        state.list = [...action.payload, ...state.list];
      })
      .addCase(createMultipleCXData.rejected, rejected)

      // UPDATE
      .addCase(updateCXData.pending, pending)
      .addCase(updateCXData.fulfilled, (state, action) => {
        state.loading = false;

        const index = state.list.findIndex(
          (item) => item._id === action.payload._id,
        );

        if (index !== -1) {
          state.list[index] = action.payload;
        }

        state.successMessage = "Customer data updated successfully.";
      })
      .addCase(updateCXData.rejected, rejected)

      // DELETE
      .addCase(deleteCXData.pending, pending)
      .addCase(deleteCXData.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter((item) => item._id !== action.payload);
        state.successMessage = "Customer data deleted successfully.";
      })
      .addCase(deleteCXData.rejected, rejected)

      // BULK DELETE
      .addCase(bulkDeleteCXData.pending, pending)
      .addCase(bulkDeleteCXData.fulfilled, (state, action) => {
        state.loading = false;
        const idsToDelete = new Set(action.payload);
        state.list = state.list.filter((item) => !idsToDelete.has(item._id));
        state.successMessage = `${action.payload.length} customer(s) deleted successfully.`;
      })
      .addCase(bulkDeleteCXData.rejected, rejected);
  },
});

export const { clearCXDataMessages } = cxDataSlice.actions;
export default cxDataSlice.reducer;
