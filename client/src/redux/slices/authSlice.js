import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const BASE = import.meta.env.VITE_API_URL  + "/api/auth";

// ── Async Thunks ──────────────────────────────────────────

export const signupUser = createAsyncThunk(
  "auth/signup",
  async (
    { name, email, password, phoneNumber, status },
    { rejectWithValue },
  ) => {
    try {
      const res = await fetch(`${BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phoneNumber: phoneNumber || "",
          status: status || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      localStorage.setItem("user", JSON.stringify(data));
      return data;
    } catch {
      return rejectWithValue("Network error. Please try again.");
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      localStorage.setItem("user", JSON.stringify(data));
      return data;
    } catch {
      return rejectWithValue("Network error. Please try again.");
    }
  },
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async ({ name, phoneNumber, status }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;
      const res = await fetch(`${BASE}/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          phoneNumber: phoneNumber || "",
          status: status || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      localStorage.setItem("user", JSON.stringify(data));
      return data;
    } catch {
      return rejectWithValue("Network error.");
    }
  },
);

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async ({ currentPassword, newPassword }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;
      const res = await fetch(`${BASE}/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch {
      return rejectWithValue("Network error.");
    }
  },
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, { rejectWithValue }) => {
    try {
      const res = await fetch(`${BASE}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch {
      return rejectWithValue("Network error. Please try again.");
    }
  },
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${BASE}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch {
      return rejectWithValue("Network error. Please try again.");
    }
  },
);

// ── Slice ─────────────────────────────────────────────────

const storedUser = localStorage.getItem("user");

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: storedUser ? JSON.parse(storedUser) : null,
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.error = null;
      state.successMessage = null;
      localStorage.removeItem("user");
    },
    clearMessages(state) {
      state.error = null;
      state.successMessage = null;
    },
    updateLoggedInUser(state, action) {
      const updatedUser = action.payload;

      if (state.user && state.user._id === updatedUser._id) {
        state.user = {
          ...state.user,
          name: updatedUser.name,
          status: updatedUser.status,
          userRole: updatedUser.userRole,
        };
      }
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
      // signup
      .addCase(signupUser.pending, pending)
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(signupUser.rejected, rejected)
      // login
      .addCase(loginUser.pending, pending)
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, rejected)
      // update profile
      .addCase(updateProfile.pending, pending)
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = "Profile updated successfully!";
        state.user = {
          ...state.user,
          name: action.payload.name,
          phoneNumber: action.payload.phoneNumber,
          status: action.payload.status,
          userRole: action.payload.userRole,
        };
        localStorage.setItem("user", JSON.stringify(state.user));
      })
      .addCase(updateProfile.rejected, rejected)
      // change password
      .addCase(changePassword.pending, pending)
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
        state.successMessage = "Password changed successfully!";
      })
      .addCase(changePassword.rejected, rejected)
      // forgot password
      .addCase(forgotPassword.pending, pending)
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
        state.successMessage =
          "✅ Reset link sent! Check your email for instructions.";
      })
      .addCase(forgotPassword.rejected, rejected)
      // reset password
      .addCase(resetPassword.pending, pending)
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.successMessage =
          "✅ Password reset successful! Redirecting to login...";
      })
      .addCase(resetPassword.rejected, rejected);
  },
});

export const { logout, clearMessages, updateLoggedInUser } = authSlice.actions;
export default authSlice.reducer;
