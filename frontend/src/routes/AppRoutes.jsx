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

import OperationHome from "../pages/OperationMananger/OperationHome.jsx";
import OperationProjects from "../pages/OperationMananger/OperationProjects.jsx";
import TaskManagement from "../pages/tasks/TaskManagement.jsx";

import TeamHome from "../pages/team/TeamHome.jsx";
import TeamTasks from "../pages/team/TeamTasks.jsx";
import EodReports from "../pages/team/EodReports.jsx";
import AdminEodReports from "../pages/admin/AdminEodReports.jsx";

import ProtectedRoute from "../components/common/ProtectedRoute.jsx";
import Templatelib from "../pages/admin/templatelibrary/Templatelib.jsx";
import Clients from "../pages/admin/clients/Clients.jsx";
import CalendarPage from "../pages/calendar/CalendarPage.jsx";

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
          path="projects"
          element={<Project />} 
        />

        
          <Route
          path="tasks"
          element={<TaskManagement />}
        />


          <Route
          path="clients"
          element={<Clients />}
        />

        <Route
          path="users"
          element={<AdminUsers />}
        />

   

        <Route
          path="eod-reports"
          element={<AdminEodReports />}
        />

        
        <Route
          path="profile"
          element={<Profile />}
        />

   
        <Route
          path="template-library"
          element={<Templatelib />}
        />
        
        <Route
          path="calendar"
          element={<CalendarPage />}
        />

        <Route
          path="partnerhub"
          element={<PartnerHub />}
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
          path="projects"
          element={<Project />} 
        />

        <Route
          path="tasks"
          element={<TaskManagement />}
        />


          <Route
          path="profile"
          element={<Profile />}
        />

        <Route
          path="calendar"
          element={<CalendarPage />}
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
          path="tasks"
          element={<TeamTasks />}
        />

        <Route
          path="eod-reports"
          element={<EodReports />}
        />

        <Route
          path="profile"
          element={<Profile />}
        />
      </Route>
     

    </Routes>
  );
};

export default AppRoutes;