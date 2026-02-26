import React from "react";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Props {
  children: ReactNode;
  requiredRole?: string;
}

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

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { user, role, loading } = useAuth();
  if (loading) return <div style={loadingStyle}>Loading…</div>;
  if (!user) return <Navigate to="/" replace />;
  if (requiredRole && role !== requiredRole) return <Navigate to="/" replace />;
  return <>{children}</>;
}
