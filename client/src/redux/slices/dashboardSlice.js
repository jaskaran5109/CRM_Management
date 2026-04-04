import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const BASE = import.meta.env.VITEPI_URL  + "/api/dashboard";

// 🔹 Helper
const getHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

// ─────────────────────────────────────────────
// 📊 DASHBOARD THUNKS
// ─────────────────────────────────────────────

export const fetchDashboardAnalytics = createAsyncThunk(
  "dashboard/analytics",
  async (range = "12m", { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.user?.token;
      const res = await fetch(`${BASE}/analytics?range=${range}`, {
        headers: getHeaders(token),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data;
    } catch {
      return rejectWithValue("Failed to fetch dashboard analytics");
    }
  }
);

export const fetchDashboardTrends = createAsyncThunk(
  "dashboard/trends",
  async (days = 30, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.user?.token;
      const res = await fetch(`${BASE}/trends?days=${days}`, {
        headers: getHeaders(token),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);
      return data?.data;
    } catch {
      return rejectWithValue("Failed to fetch dashboard trends");
    }
  }
);

export const fetchDashboardStats = createAsyncThunk(
  "dashboard/stats",
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.user?.token;

      const res = await fetch(`${BASE}/stats`, {
        headers: getHeaders(token),
      });

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);

      return data?.data;
    } catch {
      return rejectWithValue("Failed to fetch dashboard stats");
    }
  }
);

export const fetchRevenueAnalytics = createAsyncThunk(
  "dashboard/revenue",
  async (range = "12m", { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.user?.token;

      const res = await fetch(`${BASE}/revenue-analytics?range=${range}`, {
        headers: getHeaders(token),
      });

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);

      return data?.data;
    } catch {
      return rejectWithValue("Failed to fetch revenue analytics");
    }
  }
);

export const fetchCustomerDistribution = createAsyncThunk(
  "dashboard/customerDistribution",
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.user?.token;

      const res = await fetch(`${BASE}/customer-distribution`, {
        headers: getHeaders(token),
      });

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);

      return  data?.data;
    } catch {
      return rejectWithValue("Failed to fetch customer distribution");
    }
  }
);

export const fetchTopModels = createAsyncThunk(
  "dashboard/topModels",
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.user?.token;

      const res = await fetch(`${BASE}/top-models`, {
        headers: getHeaders(token),
      });

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);

      return  data?.data;
    } catch {
      return rejectWithValue("Failed to fetch top models");
    }
  }
);

export const fetchServiceStats = createAsyncThunk(
  "dashboard/serviceStats",
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.user?.token;

      const res = await fetch(`${BASE}/service-stats`, {
        headers: getHeaders(token),
      });

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);

      return data?.data;
    } catch {
      return rejectWithValue("Failed to fetch service stats");
    }
  }
);

export const fetchStateDistribution = createAsyncThunk(
  "dashboard/stateDistribution",
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.user?.token;

      const res = await fetch(`${BASE}/state-distribution`, {
        headers: getHeaders(token),
      });

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);

      return data?.data;
    } catch {
      return rejectWithValue("Failed to fetch state distribution");
    }
  }
);

export const fetchRecentLeads = createAsyncThunk(
  "dashboard/recentLeads",
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.user?.token;

      const res = await fetch(`${BASE}/recent-leads`, {
        headers: getHeaders(token),
      });

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);

      return data?.data;
    } catch {
      return rejectWithValue("Failed to fetch recent leads");
    }
  }
);


// ─────────────────────────────────────────────
// 🧠 SLICE
// ─────────────────────────────────────────────

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    loading: false,
    error: null,

    dashboardStats: null,
    dashboardAnalytics: null,
    dashboardTrends: null,
    revenueAnalytics: null,
    customerDistribution: null,
    topModels: null,
    serviceStats: null,
    stateDistribution: null,
    recentLeads: null,
  },

  reducers: {
    clearDashboardError(state) {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    const pending = (state) => {
      state.loading = true;
      state.error = null;
    };

    const rejected = (state, action) => {
      state.loading = false;
      state.error = action.payload;
    };

    builder
      .addCase(fetchDashboardStats.pending, pending)
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardStats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, rejected)

      .addCase(fetchDashboardAnalytics.pending, pending)
      .addCase(fetchDashboardAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardAnalytics = action.payload;
      })
      .addCase(fetchDashboardAnalytics.rejected, rejected)

      .addCase(fetchDashboardTrends.pending, pending)
      .addCase(fetchDashboardTrends.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardTrends = action.payload;
      })
      .addCase(fetchDashboardTrends.rejected, rejected)

      .addCase(fetchRevenueAnalytics.pending, pending)
      .addCase(fetchRevenueAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.revenueAnalytics = action.payload;
      })
      .addCase(fetchRevenueAnalytics.rejected, rejected)

      .addCase(fetchCustomerDistribution.pending, pending)
      .addCase(fetchCustomerDistribution.fulfilled, (state, action) => {
        state.loading = false;
        state.customerDistribution = action.payload;
      })
      .addCase(fetchCustomerDistribution.rejected, rejected)

      .addCase(fetchTopModels.pending, pending)
      .addCase(fetchTopModels.fulfilled, (state, action) => {
        state.loading = false;
        state.topModels = action.payload;
      })
      .addCase(fetchTopModels.rejected, rejected)

      .addCase(fetchServiceStats.pending, pending)
      .addCase(fetchServiceStats.fulfilled, (state, action) => {
        state.loading = false;
        state.serviceStats = action.payload;
      })
      .addCase(fetchServiceStats.rejected, rejected)

      .addCase(fetchStateDistribution.pending, pending)
      .addCase(fetchStateDistribution.fulfilled, (state, action) => {
        state.loading = false;
        state.stateDistribution = action.payload;
      })
      .addCase(fetchStateDistribution.rejected, rejected)

      .addCase(fetchRecentLeads.pending, pending)
      .addCase(fetchRecentLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.recentLeads = action.payload;
      })
      .addCase(fetchRecentLeads.rejected, rejected);
  },
});

export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;