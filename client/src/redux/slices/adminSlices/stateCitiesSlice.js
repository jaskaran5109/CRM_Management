import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const BASE = import.meta.env.VITE_API_URL  + "/api/state-cities";

// ── Async Thunks ──────────────────────────────────────────

// FETCH ALL STATES
export const fetchAllStates = createAsyncThunk(
  "stateCities/fetchAllStates",
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
      return rejectWithValue("Failed to fetch states.");
    }
  }
);

// FETCH CITIES BY STATE
export const fetchCitiesByState = createAsyncThunk(
  "stateCities/fetchCitiesByState",
  async (stateName, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth.user;

      const res = await fetch(`${BASE}/${encodeURIComponent(stateName)}/cities`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) return rejectWithValue(data.message);

      return {
        state: stateName,
        cities: data,
      };
    } catch {
      return rejectWithValue("Failed to fetch cities.");
    }
  }
);

// ── Slice ─────────────────────────────────────────────────

const stateCitiesSlice = createSlice({
  name: "stateCities",
  initialState: {
    states: [],
    cities: [],
    selectedState: "",
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearStateCityMessages(state) {
      state.error = null;
      state.successMessage = null;
    },
    clearCities(state) {
      state.cities = [];
      state.selectedState = "";
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
      .addCase(fetchAllStates.pending, pending)
      .addCase(fetchAllStates.fulfilled, (state, action) => {
        state.loading = false;
        state.states = action.payload;
      })
      .addCase(fetchAllStates.rejected, rejected)

      .addCase(fetchCitiesByState.pending, pending)
      .addCase(fetchCitiesByState.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedState = action.payload.state;
        state.cities = action.payload.cities;
      })
      .addCase(fetchCitiesByState.rejected, rejected);
  },
});

export const { clearStateCityMessages, clearCities } = stateCitiesSlice.actions;
export default stateCitiesSlice.reducer;