import React from "react";

import {
  Routes,
  Route,
} from "react-router-dom";

import Login from "../pages/auth/Login.jsx";

import DashboardLayout from "../components/layout/DashboardLayout.jsx";

import AdminHome from "../pages/admin/AdminHome.jsx";
import AdminProjects from "../pages/admin/AdminProjects.jsx";
import AdminUsers from "../pages/admin/AdminUsers.jsx";
import AdminReports from "../pages/admin/AdminReports.jsx";

import Profile from "../pages/profile/Profile.jsx";

import OperationHome from "../pages/OperationMananger/OperationHome.jsx";
import OperationProjects from "../pages/OperationMananger/OperationProjects.jsx";
import OperationTasks from "../pages/OperationMananger/OperationTasks.jsx";

import TeamHome from "../pages/team/TeamHome.jsx";
import TeamTasks from "../pages/team/TeamTasks.jsx";


import ProtectedRoute from "../components/common/ProtectedRoute.jsx";
import Templatelib from "../pages/admin/templatelibrary/Templatelib.jsx";
import Clients from "../pages/admin/clients/Clients.jsx";

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
          element={<AdminHome />}
        />

        <Route
          path="projects"
          element={<AdminProjects />}
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
          path="reports"
          element={<AdminReports />}
        />

        
        <Route
          path="profile"
          element={<Profile />}
        />

   
        <Route
          path="template-library"
          element={<Templatelib />}
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
          element={<OperationHome />}
        />

        <Route
          path="projects"
          element={<OperationProjects />}
        />

        <Route
          path="tasks"
          element={<OperationTasks />}
        />


         <Route
          path="profile"
          element={<Profile />}
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
          element={<TeamHome />}
        />

        <Route
          path="tasks"
          element={<TeamTasks />}
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