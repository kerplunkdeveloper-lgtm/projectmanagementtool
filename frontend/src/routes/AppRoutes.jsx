import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import ScrollToTop from "../components/common/ScrollToTop";

// Synchronous core wrappers
import ProtectedRoute from "../components/common/ProtectedRoute.jsx";

// Lazy Loaded Pages & Layouts
const Login = React.lazy(() => import("../pages/auth/Login.jsx"));
const DashboardLayout = React.lazy(() => import("../components/layout/DashboardLayout.jsx"));
const Dashboardmain = React.lazy(() => import("../pages/Dashboard/Dashboardmain.jsx"));
const Project = React.lazy(() => import("../pages/projects/Project.jsx"));
const AdminUsers = React.lazy(() => import("../pages/admin/AdminUsers.jsx"));
const PartnerHub = React.lazy(() => import("../pages/admin/partnerhub/PartnerHub.jsx"));
const Profile = React.lazy(() => import("../pages/profile/Profile.jsx"));
const Settings = React.lazy(() => import("../pages/settings/Settings.jsx"));
const OperationHome = React.lazy(() => import("../pages/OperationMananger/OperationHome.jsx"));
const OperationProjects = React.lazy(() => import("../pages/OperationMananger/OperationProjects.jsx"));
const TeamHome = React.lazy(() => import("../pages/team/TeamHome.jsx"));
const EodReports = React.lazy(() => import("../pages/team/EodReports.jsx"));
const AdminEodReports = React.lazy(() => import("../pages/admin/AdminEodReports.jsx"));
const Templatelib = React.lazy(() => import("../pages/admin/templatelibrary/Templatelib.jsx"));
const Clients = React.lazy(() => import("../pages/admin/clients/Clients.jsx"));
const CalendarPage = React.lazy(() => import("../pages/calendar/CalendarPage.jsx"));
const Notifications = React.lazy(() => import("../pages/notifications/Notifications.jsx"));
const Task = React.lazy(() => import("../pages/tasks/Task.jsx"));
const ChatPage = React.lazy(() => import("../pages/chat/ChatPage.jsx"));
const Portfolio = React.lazy(() => import("../pages/admin/portfolio/Portfolio.jsx"));
const Workload = React.lazy(() => import("../pages/workload/Workload.jsx"));

// Elegant, premium animated page loader
const PageLoader = () => (
  <div className="fixed inset-0 bg-slate-50 dark:bg-[#020710] flex flex-col items-center justify-center z-[9999]">
    <div className="relative w-12 h-12 flex items-center justify-center">
      <div className="absolute inset-0 rounded-full border-[3px] border-slate-200 dark:border-slate-800/80" />
      <div className="absolute inset-0 rounded-full border-[3px] border-indigo-500 dark:border-indigo-400 border-t-transparent animate-spin" />
    </div>
    <span className="mt-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase animate-pulse select-none">
      Loading...
    </span>
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <ScrollToTop />
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

        <Route
          path="workload"
          element={<Workload />}
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

        <Route
          path="workload"
          element={<Workload />}
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
    </Suspense>
  );
};

export default AppRoutes;