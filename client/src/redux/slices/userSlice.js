import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { updateLoggedInUser } from "./authSlice";
import { getApiBaseUrl } from "../../config/apiConfig";

const BASE = `${getApiBaseUrl()}/users`;

// ── Async Thunks ──────────────────────────────────────────

export const fetchAllUsers = createAsyncThunk(
  "users/fetchAll",
  async (
    {
      search = "",
      role = "",
      status = "",
      page = 1,
      limit = 100,
      sort = "createdAt",
      order = "desc",
    } = {},
    { getState, rejectWithValue },
  ) => {
    try {
      const { token } = getState().auth.user;
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (role) params.append("role", role);
      if (status) params.append("status", status);
      params.append("page", page);
      params.append("limit", limit);
      params.append("sort", sort);
      params.append("order", order);

      const res = await fetch(`${BASE}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch {
      return rejectWithValue("Failed to fetch users.");
    }
  },
);

export const deleteUser = createAsyncThunk(
  "users/delete",
  async (userId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;
      const res = await fetch(`${BASE}/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return userId; // return id to remove from state
    } catch {
      return rejectWithValue("Failed to delete user.");
    }
  },
);

export const changeUserRole = createAsyncThunk(
  "users/changeRole",
  async (
    { userId, role, userRoles, status },
    { dispatch, getState, rejectWithValue },
  ) => {
    try {
      const { token } = getState().auth.user;

      const res = await fetch(`${BASE}/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role,
          userRoles,
          status,
        }),
      });

      const data = await res.json();

      const currentUser = getState().auth.user;

      if (currentUser?._id === data._id) {
        dispatch(updateLoggedInUser(data));
      }

      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch {
      return rejectWithValue("Failed to update user.");
    }
  },
);

export const createUser = createAsyncThunk(
  "users/create",
  async (userData, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;
      const res = await fetch(`${getApiBaseUrl()}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data; // Created user object
    } catch (err) {
      return rejectWithValue("Failed to create user");
    }
  },
);

// 👉 Update User
export const updateUser = createAsyncThunk(
  "users/update",
  async ({ id, updates }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;
      const res = await fetch(`${getApiBaseUrl()}/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data; // Updated user object
    } catch (err) {
      return rejectWithValue("Failed to update user");
    }
  },
);

// ✅ NEW THUNK: BULK UPLOAD USERS
export const bulkUploadUsers = createAsyncThunk(
  "users/bulkUpload",
  async (usersArray, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;

      const res = await fetch(`${getApiBaseUrl()}/users/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ users: usersArray }), // Backend expects { users: [...] }
      });

      const data = await res.json();

      if (!res.ok) return rejectWithValue(data.message);
      return data.users; // Array of created users
    } catch (err) {
      return rejectWithValue("Bulk upload failed");
    }
  },
);

// ── Slice ─────────────────────────────────────────────────

const usersSlice = createSlice({
  name: "users",
  initialState: {
    list: [],
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearUserMessages(state) {
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
      // CREATE USER
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.list.push(action.payload);
        state.successMessage = "User created successfully!";
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // UPDATE USER
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.list.findIndex((u) => u._id === action.payload._id);
        if (index !== -1) state.list[index] = action.payload;
        state.successMessage = "User updated successfully!";
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetch all
      .addCase(fetchAllUsers.pending, pending)
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.users || [];
        state.users = action.payload.users || [];
        state.total = action.payload.total || 0;
        state.page = action.payload.page || 1;
        state.limit = action.payload.limit || 100;
        state.totalPages = action.payload.totalPages || 1;
      })
      .addCase(fetchAllUsers.rejected, rejected)
      // delete
      .addCase(deleteUser.pending, pending)
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter((u) => u._id !== action.payload);
        state.successMessage = "User deleted successfully.";
      })
      .addCase(deleteUser.rejected, rejected)
      // change role
      .addCase(changeUserRole.pending, pending)
      .addCase(changeUserRole.fulfilled, (state, action) => {
        state.loading = false;

        const index = state.list.findIndex((u) => u._id === action.payload._id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }

        state.successMessage = "User updated successfully.";
      })
      .addCase(changeUserRole.rejected, rejected)
      // ✅ bulk upload
      .addCase(bulkUploadUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(bulkUploadUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = [...state.list, ...action.payload]; // Append new users
        state.successMessage = `✅ ${action.payload.length} user(s) uploaded successfully!`;
      })
      .addCase(bulkUploadUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearUserMessages } = usersSlice.actions;
export default usersSlice.reducer;
