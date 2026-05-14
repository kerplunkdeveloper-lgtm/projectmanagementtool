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

import OperationHome from "../pages/OperationMananger/OperationHome.jsx";
import OperationProjects from "../pages/OperationMananger/OperationProjects.jsx";
import OperationTasks from "../pages/OperationMananger/OperationTasks.jsx";

import TeamHome from "../pages/team/TeamHome.jsx";
import TeamTasks from "../pages/team/TeamTasks.jsx";

import ProtectedRoute from "../components/common/ProtectedRoute.jsx";

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
          path="users"
          element={<AdminUsers />}
        />

        <Route
          path="reports"
          element={<AdminReports />}
        />
      </Route>

      {/* OPERATION MANAGER ROUTES */}
      <Route
        path="/operation"
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
      </Route>

    </Routes>
  );
};

export default AppRoutes;