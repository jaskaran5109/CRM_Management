import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getApiBaseUrl } from "../../../config/apiConfig";

const BASE = `${getApiBaseUrl()}/cx-service-categories`;

// ── Async Thunks ──────────────────────────────────────────

// GET ALL CX SERVICE CATEGORIES
export const fetchAllCXServiceCategories = createAsyncThunk(
  "cxServiceCategories/fetchAll",
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
      return rejectWithValue("Failed to fetch CX service categories.");
    }
  }
);

// CREATE SINGLE CX SERVICE CATEGORY
export const createCXServiceCategory = createAsyncThunk(
  "cxServiceCategories/create",
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
      return rejectWithValue("Failed to create CX service category.");
    }
  }
);

// CREATE MULTIPLE CX SERVICE CATEGORIES
export const createMultipleCXServiceCategories = createAsyncThunk(
  "cxServiceCategories/createMultiple",
  async ({ cxServiceCategories, status }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;

      const res = await fetch(`${BASE}/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cxServiceCategories,
          status: status || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch {
      return rejectWithValue("Failed to create CX service categories.");
    }
  }
);

// UPDATE CX SERVICE CATEGORY
export const updateCXServiceCategory = createAsyncThunk(
  "cxServiceCategories/update",
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
      return rejectWithValue("Failed to update CX service category.");
    }
  }
);

// DELETE CX SERVICE CATEGORY
export const deleteCXServiceCategory = createAsyncThunk(
  "cxServiceCategories/delete",
  async (cxServiceCategoryId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;

      const res = await fetch(`${BASE}/${cxServiceCategoryId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) return rejectWithValue(data.message);
      return cxServiceCategoryId;
    } catch {
      return rejectWithValue("Failed to delete CX service category.");
    }
  }
);

// ── Slice ─────────────────────────────────────────────────

const cxServiceCategoriesSlice = createSlice({
  name: "cxServiceCategories",
  initialState: {
    list: [],
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearCXServiceCategoryMessages(state) {
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
      .addCase(fetchAllCXServiceCategories.pending, pending)
      .addCase(fetchAllCXServiceCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchAllCXServiceCategories.rejected, rejected)

      // CREATE SINGLE
      .addCase(createCXServiceCategory.pending, pending)
      .addCase(createCXServiceCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.list.unshift(action.payload);
        state.successMessage = "CX service category created successfully.";
      })
      .addCase(createCXServiceCategory.rejected, rejected)

      // CREATE MULTIPLE
      .addCase(createMultipleCXServiceCategories.pending, pending)
      .addCase(createMultipleCXServiceCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.list = [...action.payload, ...state.list];
        state.successMessage = "CX service categories created successfully.";
      })
      .addCase(createMultipleCXServiceCategories.rejected, rejected)

      // UPDATE
      .addCase(updateCXServiceCategory.pending, pending)
      .addCase(updateCXServiceCategory.fulfilled, (state, action) => {
        state.loading = false;

        const index = state.list.findIndex(
          (item) => item._id === action.payload._id
        );

        if (index !== -1) {
          state.list[index] = action.payload;
        }

        state.successMessage = "CX service category updated successfully.";
      })
      .addCase(updateCXServiceCategory.rejected, rejected)

      // DELETE
      .addCase(deleteCXServiceCategory.pending, pending)
      .addCase(deleteCXServiceCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter((item) => item._id !== action.payload);
        state.successMessage = "CX service category deleted successfully.";
      })
      .addCase(deleteCXServiceCategory.rejected, rejected);
  },
});

export const { clearCXServiceCategoryMessages } =
  cxServiceCategoriesSlice.actions;

export default cxServiceCategoriesSlice.reducer;
