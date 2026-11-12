import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const isSocialMediaHeadUser = (user) => {
  if (!user) return false;
  const dept = (user.department || "").toString().toLowerCase().trim();
  const role = (user.role?.name || user.role || "").toString().toLowerCase().replace(/[\s_]+/g, "");
  return dept.includes("social media head") || role === "socialmediamanager" || role === "socialmediahead";
};

const getEffectiveRole = (user) => {
  if (!user) return "";
  if (isSocialMediaHeadUser(user)) return "socialmediamanager";
  return (user.role?.name || user.role || "").toString();
};

const ProtectedRoute = ({
  children,
  allowedRoles,
  requiredPermission
}) => {

  const { user, originalAdminUser, originalRole } = useSelector(
    (state) => state.auth
  );

  if (!user) {
    return <Navigate to="/" />;
  }

  const isPrimaryAdmin =
    user.role === "admin" ||
    originalRole === "admin" ||
    originalAdminUser?.role === "admin";

  const isSMHead = isSocialMediaHeadUser(user);
  const effectiveRole = getEffectiveRole(user);

  if (!isPrimaryAdmin && allowedRoles) {
    // If route is restricted to team, but user is Social Media Head, do not allow /team -> redirect to /socialmediamanager
    if (isSMHead && allowedRoles.includes("team") && !allowedRoles.includes("socialmediamanager")) {
      return <Navigate to="/socialmediamanager" replace />;
    }

    const isAllowed =
      allowedRoles.includes(user.role) ||
      allowedRoles.includes(effectiveRole) ||
      (isSMHead && allowedRoles.includes("socialmediamanager"));

    if (!isAllowed) {
      return <Navigate to={`/${effectiveRole}`} replace />;
    }
  }

  const isPrivilegedRole =
    user.role === "admin" ||
    user.role === "operationmanager" ||
    isSMHead ||
    user.role === "socialmediamanager" ||
    user.role === "socialmediahead";

  // Strict permission check based only on current viewing user role
  if (!isPrivilegedRole && requiredPermission) {
    if (requiredPermission === "manage_clients") {
      return children;
    }
    const deptLower = (user?.department || "").toLowerCase();
    const isSocialMedia =
      deptLower.includes("social media") ||
      (user?.role || "").toLowerCase().includes("social");
    if (requiredPermission === "manage_projects" && isSocialMedia) {
      return children;
    }
    const perm =
      requiredPermission === "manage_shoots"
        ? user.permissions?.manage_shoots || user.permissions?.shoot_calendar
        : user.permissions?.[requiredPermission];

    if (perm !== true && !perm?.read) {
      return <Navigate to={`/${effectiveRole}`} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
