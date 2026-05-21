import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({
  children,
  allowedRoles,
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

  if (!isPrimaryAdmin && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;