import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const BASE = import.meta.env.VITE_API_URL  + "/api/cx-models";

// ── Async Thunks ──────────────────────────────────────────

// GET ALL CX MODELS
export const fetchAllCXModels = createAsyncThunk(
  "cxModels/fetchAll",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;

      const res = await fetch(BASE, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch {
      return rejectWithValue("Failed to fetch CX models.");
    }
  }
);

// CREATE SINGLE CX MODEL
export const createCXModel = createAsyncThunk(
  "cxModels/create",
  async ({ name, status }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;

      const res = await fetch(BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          status: status || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch {
      return rejectWithValue("Failed to create CX model.");
    }
  }
);

// CREATE MULTIPLE CX MODELS
export const createMultipleCXModels = createAsyncThunk(
  "cxModels/createMultiple",
  async ({ cxModels, status }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;

      const res = await fetch(`${BASE}/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cxModels,
          status: status || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch {
      return rejectWithValue("Failed to create CX models.");
    }
  }
);

// UPDATE CX MODEL
export const updateCXModel = createAsyncThunk(
  "cxModels/update",
  async ({ id, name, status }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;

      const res = await fetch(`${BASE}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch {
      return rejectWithValue("Failed to update CX model.");
    }
  }
);

// DELETE CX MODEL
export const deleteCXModel = createAsyncThunk(
  "cxModels/delete",
  async (cxModelId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;

      const res = await fetch(`${BASE}/${cxModelId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) return rejectWithValue(data.message);
      return cxModelId;
    } catch {
      return rejectWithValue("Failed to delete CX model.");
    }
  }
);

// ── Slice ─────────────────────────────────────────────────

const cxModelsSlice = createSlice({
  name: "cxModels",
  initialState: {
    list: [],
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearCXModelMessages(state) {
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
      .addCase(fetchAllCXModels.pending, pending)
      .addCase(fetchAllCXModels.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchAllCXModels.rejected, rejected)

      // CREATE SINGLE
      .addCase(createCXModel.pending, pending)
      .addCase(createCXModel.fulfilled, (state, action) => {
        state.loading = false;
        state.list.unshift(action.payload);
        state.successMessage = "CX model created successfully.";
      })
      .addCase(createCXModel.rejected, rejected)

      // CREATE MULTIPLE
      .addCase(createMultipleCXModels.pending, pending)
      .addCase(createMultipleCXModels.fulfilled, (state, action) => {
        state.loading = false;
        state.list = [...action.payload, ...state.list];
        state.successMessage = "CX models created successfully.";
      })
      .addCase(createMultipleCXModels.rejected, rejected)

      // UPDATE
      .addCase(updateCXModel.pending, pending)
      .addCase(updateCXModel.fulfilled, (state, action) => {
        state.loading = false;

        const index = state.list.findIndex(
          (item) => item._id === action.payload._id
        );

        if (index !== -1) {
          state.list[index] = action.payload;
        }

        state.successMessage = "CX model updated successfully.";
      })
      .addCase(updateCXModel.rejected, rejected)

      // DELETE
      .addCase(deleteCXModel.pending, pending)
      .addCase(deleteCXModel.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter((item) => item._id !== action.payload);
        state.successMessage = "CX model deleted successfully.";
      })
      .addCase(deleteCXModel.rejected, rejected);
  },
});

export const { clearCXModelMessages } = cxModelsSlice.actions;
export default cxModelsSlice.reducer;