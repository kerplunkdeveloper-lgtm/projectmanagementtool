import React from "react";

import {
  Routes,
  Route,
} from "react-router-dom";

import Login from "../pages/auth/Login.jsx";

import DashboardLayout from "../components/layout/DashboardLayout.jsx";

import Dashboardmain from "../pages/Dashboard/Dashboardmain.jsx";
import Project from "../pages/projects/Project.jsx";
import AdminUsers from "../pages/admin/AdminUsers.jsx";
import PartnerHub from "../pages/admin/partnerhub/PartnerHub.jsx";


import Profile from "../pages/profile/Profile.jsx";
import Settings from "../pages/settings/Settings.jsx";

import OperationHome from "../pages/OperationMananger/OperationHome.jsx";
import OperationProjects from "../pages/OperationMananger/OperationProjects.jsx";


import TeamHome from "../pages/team/TeamHome.jsx";
import EodReports from "../pages/team/EodReports.jsx";
import AdminEodReports from "../pages/admin/AdminEodReports.jsx";

import ProtectedRoute from "../components/common/ProtectedRoute.jsx";
import Templatelib from "../pages/admin/templatelibrary/Templatelib.jsx";
import Clients from "../pages/admin/clients/Clients.jsx";
import CalendarPage from "../pages/calendar/CalendarPage.jsx";
import Notifications from "../pages/notifications/Notifications.jsx";
import Task from "../pages/tasks/Task.jsx";
import ChatPage from "../pages/chat/ChatPage.jsx";
import Portfolio from "../pages/admin/portfolio/Portfolio.jsx";

const AppRoutes = () => {
  return (
    <Routes>

      {/* LOGIN */}
      <Route
        path="/"
        element={<Login />}
      />

      {/* ADMIN ROUTES */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout role="admin" />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<Dashboardmain />}
        />

        <Route
          path="clients"
          element={<ProtectedRoute requiredPermission="manage_clients"><Clients /></ProtectedRoute>}
        />

        <Route
          path="portfolio"
          element={<ProtectedRoute requiredPermission="manage_settings"><Portfolio /></ProtectedRoute>}
        />

        <Route
          path="projects"
          element={<ProtectedRoute requiredPermission="manage_projects"><Project /></ProtectedRoute>} 
        />

        <Route
          path="tasks"
          element={<ProtectedRoute requiredPermission="manage_tasks"><Task /></ProtectedRoute>} 
        />

        <Route
          path="users"
          element={<ProtectedRoute requiredPermission="manage_users"><AdminUsers /></ProtectedRoute>}
        />

        <Route
          path="eod-reports"
          element={<ProtectedRoute requiredPermission="view_reports"><AdminEodReports /></ProtectedRoute>}
        />

        
        <Route
          path="profile"
          element={<Profile />}
        />

        <Route
          path="settings"
          element={<Settings />}
        />

   
        <Route
          path="template-library"
          element={<ProtectedRoute requiredPermission="manage_settings"><Templatelib /></ProtectedRoute>}
        />
        
        <Route
          path="calendar"
          element={<CalendarPage />}
        />

        <Route
          path="partnerhub"
          element={<ProtectedRoute requiredPermission="manage_settings"><PartnerHub /></ProtectedRoute>}
        />
        
        <Route
          path="notifications"
          element={<Notifications />}
        />
        
        <Route
          path="chat"
          element={<ChatPage />}
        />
        
      
        
      </Route>

      {/* OPERATION MANAGER ROUTES */}
      <Route
        path="/operationmanager"
        element={
          <ProtectedRoute
            allowedRoles={["operationmanager"]}
          >
            <DashboardLayout role="operationmanager" />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<Dashboardmain/>}
        />

         <Route
          path="clients"
          element={<ProtectedRoute requiredPermission="manage_clients"><Clients /></ProtectedRoute>}
        />

           <Route
          path="portfolio"
          element={<ProtectedRoute requiredPermission="manage_settings"><Portfolio /></ProtectedRoute>}
        />

        <Route
          path="projects"
          element={<ProtectedRoute requiredPermission="manage_projects"><Project /></ProtectedRoute>} 
        />

        <Route
          path="tasks"
          element={<ProtectedRoute requiredPermission="manage_tasks"><Task /></ProtectedRoute>}   
        />

         <Route
          path="eod-reports"
          element={<ProtectedRoute requiredPermission="view_reports"><AdminEodReports /></ProtectedRoute>}
        />

        <Route
          path="profile"
          element={<Profile />}
        />

        <Route
          path="settings"
          element={<Settings />}
        />

        <Route
          path="calendar"
          element={<CalendarPage />}
        />



        <Route
          path="users"
          element={<ProtectedRoute requiredPermission="manage_users"><AdminUsers /></ProtectedRoute>}
        />

        <Route
          path="notifications"
          element={<Notifications />}
        />

        <Route
          path="chat"
          element={<ChatPage />}
        />




      </Route>



      {/* TEAM ROUTES */}
      <Route
        path="/team"
        element={
          <ProtectedRoute allowedRoles={["team"]}>
            <DashboardLayout role="team" />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<Dashboardmain />}
        />

        <Route
          path="clients"
          element={<ProtectedRoute requiredPermission="manage_clients"><Clients /></ProtectedRoute>}
        />



             <Route
          path="portfolio"
          element={<ProtectedRoute requiredPermission="manage_settings"><Portfolio /></ProtectedRoute>}
        />

        <Route
          path="projects"
          element={<ProtectedRoute requiredPermission="manage_projects"><Project /></ProtectedRoute>} 
        />

        

        <Route
          path="tasks"
          element={<ProtectedRoute requiredPermission="manage_tasks"><Task /></ProtectedRoute>}   
        />

        <Route
          path="eod-reports"
          element={<ProtectedRoute requiredPermission="view_reports"><EodReports /></ProtectedRoute>}
        />

        <Route
          path="users"
          element={<ProtectedRoute requiredPermission="manage_users"><AdminUsers /></ProtectedRoute>}
        />

        <Route
          path="profile"
          element={<Profile />}
        />

        <Route
          path="settings"
          element={<Settings />}
        />

        <Route
          path="notifications"
          element={<Notifications />}
        />

        <Route
          path="chat"
          element={<ChatPage />}
        />
      </Route>
     

    </Routes>
  );
};

export default AppRoutes;