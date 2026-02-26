import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const loadingStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  background: "#0f172a",
  color: "#6366f1",
  fontSize: "1rem",
  fontFamily: "inherit",
};

export default function RoleRouter() {
  const { user, role, loading } = useAuth();
  if (loading) return <div style={loadingStyle}>Loading…</div>;
  if (!user) return <Navigate to="/" replace />;
  if (role === "admin")    return <Navigate to="/admin"    replace />;
  if (role === "driver")   return <Navigate to="/driver"   replace />;
  if (role === "customer") return <Navigate to="/customer" replace />;
  // role not yet assigned — send back to login
  return <Navigate to="/" replace />;
}
