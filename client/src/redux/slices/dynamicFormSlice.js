import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  createDynamicForm,
  createFormSubmission,
  deleteDynamicForm,
  fetchDynamicForm,
  fetchDynamicForms,
  fetchFormSubmissions,
  updateDynamicForm,
  updateDynamicFormStatus,
  updateFormSubmission,
} from "../../services/dynamicFormService";

const initialState = {
  forms: [],
  currentForm: null,
  submissions: [],
  currentSubmission: null,
  pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
  submissionPagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
  loading: false,
  saving: false,
  error: null,
  success: null,
};

export const fetchDynamicFormsAction = createAsyncThunk(
  "dynamicForms/list",
  async (query = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.user?.token;
      return await fetchDynamicForms({ token, query });
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch dynamic forms");
    }
  },
);

export const fetchDynamicFormAction = createAsyncThunk(
  "dynamicForms/detail",
  async (idOrSlug, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.user?.token;
      return await fetchDynamicForm(idOrSlug, token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch dynamic form");
    }
  },
);

export const createDynamicFormAction = createAsyncThunk(
  "dynamicForms/create",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.user?.token;
      return await createDynamicForm(payload, token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to create dynamic form");
    }
  },
);

export const updateDynamicFormAction = createAsyncThunk(
  "dynamicForms/update",
  async ({ id, payload }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.user?.token;
      return await updateDynamicForm(id, payload, token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update dynamic form");
    }
  },
);

export const toggleDynamicFormStatusAction = createAsyncThunk(
  "dynamicForms/toggleStatus",
  async ({ id, isActive }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.user?.token;
      return await updateDynamicFormStatus(id, isActive, token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update form status");
    }
  },
);

export const deleteDynamicFormAction = createAsyncThunk(
  "dynamicForms/delete",
  async (id, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.user?.token;
      await deleteDynamicForm(id, token);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete dynamic form");
    }
  },
);

export const fetchFormSubmissionsAction = createAsyncThunk(
  "dynamicForms/submissions",
  async (query = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.user?.token;
      return await fetchFormSubmissions({ token, query });
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch form submissions");
    }
  },
);

export const createFormSubmissionAction = createAsyncThunk(
  "dynamicForms/submit",
  async ({ slug, payload }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.user?.token;
      return await createFormSubmission(slug, payload, token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to submit form");
    }
  },
);

export const updateFormSubmissionAction = createAsyncThunk(
  "dynamicForms/updateSubmission",
  async ({ id, payload }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.user?.token;
      return await updateFormSubmission(id, payload, token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update submission");
    }
  },
);

const dynamicFormSlice = createSlice({
  name: "dynamicForms",
  initialState,
  reducers: {
    clearDynamicFormStatus(state) {
      state.error = null;
      state.success = null;
    },
    setCurrentDynamicForm(state, action) {
      state.currentForm = action.payload;
    },
  },
  extraReducers: (builder) => {
    const pending = (state) => {
      state.loading = true;
      state.error = null;
      state.success = null;
    };

    const saving = (state) => {
      state.saving = true;
      state.error = null;
      state.success = null;
    };

    const rejected = (state, action) => {
      state.loading = false;
      state.saving = false;
      state.error = action.payload || action.error.message;
    };

    builder
      .addCase(fetchDynamicFormsAction.pending, pending)
      .addCase(fetchDynamicFormsAction.fulfilled, (state, action) => {
        state.loading = false;
        state.forms = action.payload.data || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(fetchDynamicFormsAction.rejected, rejected)
      .addCase(fetchDynamicFormAction.pending, pending)
      .addCase(fetchDynamicFormAction.fulfilled, (state, action) => {
        state.loading = false;
        state.currentForm = action.payload.data || null;
      })
      .addCase(fetchDynamicFormAction.rejected, rejected)
      .addCase(createDynamicFormAction.pending, saving)
      .addCase(createDynamicFormAction.fulfilled, (state, action) => {
        state.saving = false;
        state.forms = [action.payload.data, ...state.forms];
        state.currentForm = action.payload.data;
        state.success = action.payload.message || "Dynamic form created successfully";
      })
      .addCase(createDynamicFormAction.rejected, rejected)
      .addCase(updateDynamicFormAction.pending, saving)
      .addCase(updateDynamicFormAction.fulfilled, (state, action) => {
        state.saving = false;
        state.currentForm = action.payload.data;
        state.forms = state.forms.map((form) =>
          form._id === action.payload.data._id ? action.payload.data : form,
        );
        state.success = action.payload.message || "Dynamic form updated successfully";
      })
      .addCase(updateDynamicFormAction.rejected, rejected)
      .addCase(toggleDynamicFormStatusAction.pending, saving)
      .addCase(toggleDynamicFormStatusAction.fulfilled, (state, action) => {
        state.saving = false;
        state.forms = state.forms.map((form) =>
          form._id === action.payload.data._id ? action.payload.data : form,
        );
        if (state.currentForm?._id === action.payload.data._id) {
          state.currentForm = action.payload.data;
        }
        state.success = action.payload.message || "Dynamic form status updated successfully";
      })
      .addCase(toggleDynamicFormStatusAction.rejected, rejected)
      .addCase(deleteDynamicFormAction.pending, saving)
      .addCase(deleteDynamicFormAction.fulfilled, (state, action) => {
        state.saving = false;
        state.forms = state.forms.filter((form) => form._id !== action.payload);
        if (state.currentForm?._id === action.payload) {
          state.currentForm = null;
        }
        state.success = "Dynamic form deleted successfully";
      })
      .addCase(deleteDynamicFormAction.rejected, rejected)
      .addCase(fetchFormSubmissionsAction.pending, pending)
      .addCase(fetchFormSubmissionsAction.fulfilled, (state, action) => {
        state.loading = false;
        state.submissions = action.payload.data || [];
        state.submissionPagination =
          action.payload.pagination || initialState.submissionPagination;
      })
      .addCase(fetchFormSubmissionsAction.rejected, rejected)
      .addCase(createFormSubmissionAction.pending, saving)
      .addCase(createFormSubmissionAction.fulfilled, (state, action) => {
        state.saving = false;
        state.currentSubmission = action.payload.data;
        state.submissions = [action.payload.data, ...state.submissions];
        state.success = action.payload.message || "Form submitted successfully";
      })
      .addCase(createFormSubmissionAction.rejected, rejected)
      .addCase(updateFormSubmissionAction.pending, saving)
      .addCase(updateFormSubmissionAction.fulfilled, (state, action) => {
        state.saving = false;
        state.currentSubmission = action.payload.data;
        state.submissions = state.submissions.map((submission) =>
          submission._id === action.payload.data._id ? action.payload.data : submission,
        );
        state.success = action.payload.message || "Submission updated successfully";
      })
      .addCase(updateFormSubmissionAction.rejected, rejected);
  },
});

export const { clearDynamicFormStatus, setCurrentDynamicForm } = dynamicFormSlice.actions;
export default dynamicFormSlice.reducer;
