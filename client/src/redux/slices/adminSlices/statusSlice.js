import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const BASE = import.meta.env.VITE_API_URL  + "/api/statuses";

// ── Async Thunks ──────────────────────────────────────────

export const fetchAllStatuses = createAsyncThunk(
  "statuses/",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;
      const res = await fetch(BASE, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch {
      return rejectWithValue("Failed to fetch statuses.");
    }
  },
);

// CREATE SINGLE STATUS
export const createStatus = createAsyncThunk(
  "statuses/create",
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
      return rejectWithValue("Failed to create status.");
    }
  },
);

// ✅ CREATE MULTIPLE (BATCH)
export const createMultipleStatuses = createAsyncThunk(
  "statuses/createMultiple",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;

      const res = await fetch(`${BASE}/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload), // { statuses: ["Todo", "Done"] }
      });

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);

      return data;
    } catch {
      return rejectWithValue("Failed to create statuses.");
    }
  },
);

// UPDATE STATUS
export const updateStatus = createAsyncThunk(
  "statuses/update",
  async ({ id, name }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;

      const res = await fetch(`${BASE}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);

      return data;
    } catch {
      return rejectWithValue("Failed to update status.");
    }
  },
);

export const deleteStatus = createAsyncThunk(
  "statuses/delete",
  async (statusId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;
      const res = await fetch(`${BASE}/${statusId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return statusId; // return id to remove from state
    } catch {
      return rejectWithValue("Failed to delete status.");
    }
  },
);

// ── Slice ─────────────────────────────────────────────────

const statusesSlice = createSlice({
  name: "statuses",
  initialState: {
    list: [],
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearStatusMessages(state) {
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
      // fetch all
      .addCase(fetchAllStatuses.pending, pending)
      .addCase(fetchAllStatuses.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchAllStatuses.rejected, rejected)

      // ✅ CREATE MULTIPLE
      .addCase(createMultipleStatuses.pending, pending)
      .addCase(createMultipleStatuses.fulfilled, (state, action) => {
        state.loading = false;

        // assuming backend returns array
        state.list = [...state.list, ...action.payload];

        state.successMessage = "Statuses created successfully.";
      })
      .addCase(createMultipleStatuses.rejected, rejected)

      // UPDATE
      .addCase(updateStatus.pending, pending)
      .addCase(updateStatus.fulfilled, (state, action) => {
        state.loading = false;

        const index = state.list.findIndex((s) => s._id === action.payload._id);

        if (index !== -1) {
          state.list[index] = action.payload; // 👈 replace updated
        }

        state.successMessage = "Status updated successfully.";
      })
      .addCase(updateStatus.rejected, rejected)
      
      // delete
      .addCase(deleteStatus.pending, pending)
      .addCase(deleteStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter((u) => u._id !== action.payload);
        state.successMessage = "Status deleted successfully.";
      })
      .addCase(deleteStatus.rejected, rejected);
  },
});

export const { clearStatusMessages } = statusesSlice.actions;
export default statusesSlice.reducer;
