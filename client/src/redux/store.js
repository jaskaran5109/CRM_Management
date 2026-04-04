import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import userReducer from "./slices/userSlice";
import statusReducer from "./slices/adminSlices/statusSlice";
import userRoleReducer from "./slices/adminSlices/userRoleSlice";
import roleStatusesReducer from "./slices/adminSlices/roleStatusSlice";
import stateCitiesReducer from "./slices/adminSlices/stateCitiesSlice";
import cxModelsReducer from "./slices/adminSlices/cxModelSlice";
import cxServiceCategoryReducer from "./slices/adminSlices/cxServiceCategorySlice";
import cxDataReducer from "./slices/cxDataSlice";
import dashboardReducer from "./slices/dashboardSlice";
import themeReducer from "./slices/themeSlice";
import complaintReducer from "./slices/complaintSlice";
import { applyTheme } from "../utils/themeUtils";

const store = configureStore({
  reducer: {
    auth: authReducer,
    users: userReducer,
    statuses: statusReducer,
    userRoles: userRoleReducer,
    roleStatuses: roleStatusesReducer,
    stateCities: stateCitiesReducer,
    cxModels: cxModelsReducer,
    cxServiceCategories: cxServiceCategoryReducer,
    cxData: cxDataReducer,
    dashboard: dashboardReducer,
    theme: themeReducer,
    complaints: complaintReducer,
  },
});

store.subscribe(() => {
  const state = store.getState();
  const user = state.auth.user;
  const theme = state.theme.mode;

  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  } else {
    localStorage.removeItem("user");
  }

  // Apply theme to document
  applyTheme(theme);
});

export default store;
