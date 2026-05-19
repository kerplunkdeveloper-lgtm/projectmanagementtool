import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import userReducer from "../features/users/userSlice";
import profileReducer from "../features/profile/profileSlice";
import clientReducer from "../features/clients/clientslice";
import templateReducer from "../features/template/templateSlice";
import projectReducer from "../features/projects/projectSlice";
import eodReportReducer from "../features/eodReports/eodReportSlice";
import eventReducer from "../features/events/eventSlice";
import taskReducer from "../features/tasks/taskSlice";
import notificationReducer from "../features/notifications/notificationSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: userReducer,
    profile: profileReducer, 
    clients: clientReducer,
    templates: templateReducer,
    projects: projectReducer,
    eodReports: eodReportReducer,
    events: eventReducer,
    tasks: taskReducer,
    notifications: notificationReducer,
  },
});