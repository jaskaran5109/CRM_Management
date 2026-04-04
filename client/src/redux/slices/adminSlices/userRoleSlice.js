import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const BASE = import.meta.env.VITE_API_URL  + "/api/user-roles";

// ── Async Thunks ──────────────────────────────────────────

// GET ALL USER ROLES
export const fetchAllUserRoles = createAsyncThunk(
  "userRoles/fetchAll",
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
      return rejectWithValue("Failed to fetch user roles.");
    }
  }
);

// CREATE SINGLE USER ROLE
export const createUserRole = createAsyncThunk(
  "userRoles/create",
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
      return rejectWithValue("Failed to create user role.");
    }
  }
);

// CREATE MULTIPLE USER ROLES
export const createMultipleUserRoles = createAsyncThunk(
  "userRoles/createMultiple",
  async ({ userRoles, status }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;

      const res = await fetch(`${BASE}/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userRoles,
          status: status || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch {
      return rejectWithValue("Failed to create user roles.");
    }
  }
);

// UPDATE USER ROLE
export const updateUserRole = createAsyncThunk(
  "userRoles/update",
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
      return rejectWithValue("Failed to update user role.");
    }
  }
);

// DELETE USER ROLE
export const deleteUserRole = createAsyncThunk(
  "userRoles/delete",
  async (userRoleId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;

      const res = await fetch(`${BASE}/${userRoleId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) return rejectWithValue(data.message);
      return userRoleId;
    } catch {
      return rejectWithValue("Failed to delete user role.");
    }
  }
);

// ── Slice ─────────────────────────────────────────────────

const userRolesSlice = createSlice({
  name: "userRoles",
  initialState: {
    list: [],
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearUserRolesMessages(state) {
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
      .addCase(fetchAllUserRoles.pending, pending)
      .addCase(fetchAllUserRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchAllUserRoles.rejected, rejected)

      // CREATE SINGLE
      .addCase(createUserRole.pending, pending)
      .addCase(createUserRole.fulfilled, (state, action) => {
        state.loading = false;
        state.list.unshift(action.payload);
        state.successMessage = "User role created successfully.";
      })
      .addCase(createUserRole.rejected, rejected)

      // CREATE MULTIPLE
      .addCase(createMultipleUserRoles.pending, pending)
      .addCase(createMultipleUserRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.list = [...action.payload, ...state.list];
        state.successMessage = "User roles created successfully.";
      })
      .addCase(createMultipleUserRoles.rejected, rejected)

      // UPDATE
      .addCase(updateUserRole.pending, pending)
      .addCase(updateUserRole.fulfilled, (state, action) => {
        state.loading = false;

        const index = state.list.findIndex(
          (item) => item._id === action.payload._id
        );

        if (index !== -1) {
          state.list[index] = action.payload;
        }

        state.successMessage = "User role updated successfully.";
      })
      .addCase(updateUserRole.rejected, rejected)

      // DELETE
      .addCase(deleteUserRole.pending, pending)
      .addCase(deleteUserRole.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter((item) => item._id !== action.payload);
        state.successMessage = "User role deleted successfully.";
      })
      .addCase(deleteUserRole.rejected, rejected);
  },
});

export const { clearUserRolesMessages } = userRolesSlice.actions;
export default userRolesSlice.reducer;