import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getApiBaseUrl } from "../../../config/apiConfig";

const BASE = `${getApiBaseUrl()}/role-statuses`;

// FETCH ALL ROLE STATUSES
export const fetchAllRoleStatuses = createAsyncThunk(
  "roleStatuses/fetchAll",
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
      return rejectWithValue("Failed to fetch role statuses.");
    }
  },
);

// CREATE SINGLE ROLE STATUS
export const createRoleStatus = createAsyncThunk(
  "roleStatuses/create",
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
      return rejectWithValue("Failed to create role status.");
    }
  },
);

// CREATE MULTIPLE ROLE STATUSES
export const createMultipleRoleStatuses = createAsyncThunk(
  "roleStatuses/createMultiple",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;

      const res = await fetch(`${BASE}/bulk`, {
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
      return rejectWithValue("Failed to create role statuses.");
    }
  },
);

// UPDATE SINGLE ROLE STATUS
export const updateRoleStatus = createAsyncThunk(
  "roleStatuses/update",
  async ({ id, name, userRole, status }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;

      const res = await fetch(`${BASE}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, userRole, status }),
      });

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);

      return data;
    } catch {
      return rejectWithValue("Failed to update role status.");
    }
  },
);

// UPDATE GROUP ROLE STATUSES
export const updateRoleStatusGroup = createAsyncThunk(
  "roleStatuses/updateGroup",
  async ({ ids, names, userRole, status, nextRoles }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;

      const res = await fetch(`${BASE}/group-update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ids,
          names,
          userRole,
          status,
          nextRoles,
        }),
      });

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);

      return {
        updatedGroup: data,
        oldIds: ids,
      };
    } catch {
      return rejectWithValue("Failed to update role status group.");
    }
  },
);

// DELETE ROLE STATUS
export const deleteRoleStatus = createAsyncThunk(
  "roleStatuses/delete",
  async (roleStatusId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;

      const res = await fetch(`${BASE}/${roleStatusId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);

      return roleStatusId;
    } catch {
      return rejectWithValue("Failed to delete role status.");
    }
  },
);

export const deleteRoleStatusGroup = createAsyncThunk(
  "roleStatuses/deleteGroup",
  async ({ ids }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;

      const res = await fetch(`${BASE}/group-delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids }),
      });

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);

      return data.deletedIds;
    } catch {
      return rejectWithValue("Failed to delete role status group.");
    }
  },
);

const roleStatusSlice = createSlice({
  name: "roleStatuses",
  initialState: {
    list: [],
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearRoleStatusMessages(state) {
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
      .addCase(fetchAllRoleStatuses.pending, pending)
      .addCase(fetchAllRoleStatuses.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchAllRoleStatuses.rejected, rejected)

      .addCase(createRoleStatus.pending, pending)
      .addCase(createRoleStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.list.unshift(action.payload);
        state.successMessage = "Role status created successfully.";
      })
      .addCase(createRoleStatus.rejected, rejected)

      .addCase(createMultipleRoleStatuses.pending, pending)
      .addCase(createMultipleRoleStatuses.fulfilled, (state, action) => {
        state.loading = false;
        state.list = [...action.payload, ...state.list];
        state.successMessage = "Role statuses created successfully.";
      })
      .addCase(createMultipleRoleStatuses.rejected, rejected)

      .addCase(updateRoleStatus.pending, pending)
      .addCase(updateRoleStatus.fulfilled, (state, action) => {
        state.loading = false;

        const index = state.list.findIndex(
          (item) => item._id === action.payload._id,
        );

        if (index !== -1) {
          state.list[index] = action.payload;
        }

        state.successMessage = "Role status updated successfully.";
      })
      .addCase(updateRoleStatus.rejected, rejected)

      .addCase(updateRoleStatusGroup.pending, pending)
      .addCase(updateRoleStatusGroup.fulfilled, (state, action) => {
        state.loading = false;

        const { updatedGroup, oldIds } = action.payload;

        state.list = state.list.filter((item) => !oldIds.includes(item._id));
        state.list = [...updatedGroup, ...state.list];

        state.successMessage = "Role status group updated successfully.";
      })
      .addCase(updateRoleStatusGroup.rejected, rejected)

      .addCase(deleteRoleStatus.pending, pending)
      .addCase(deleteRoleStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter((item) => item._id !== action.payload);
        state.successMessage = "Role status deleted successfully.";
      })
      .addCase(deleteRoleStatus.rejected, rejected)
      
      .addCase(deleteRoleStatusGroup.pending, pending)
      .addCase(deleteRoleStatusGroup.fulfilled, (state, action) => {
        state.loading = false;

        state.list = state.list.filter(
          (item) => !action.payload.includes(item._id),
        );

        state.successMessage = "Role status group deleted successfully.";
      })
      .addCase(deleteRoleStatusGroup.rejected, rejected);
  },
});

export const { clearRoleStatusMessages } = roleStatusSlice.actions;
export default roleStatusSlice.reducer;
