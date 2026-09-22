import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { AuthProvider, useAuth } from "./lib/auth";
import { ToastProvider } from "./components/ui";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppShell } from "./components/layout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { ParticipantDashboard, ProfilePage, TeamPage, TeamAccessPage } from "./pages/ParticipantPages";
import { AdminDashboard, StudentsPage, TeamsPage, MentorsPage, AllocationPage, ExportsPage, MessagesPage } from "./pages/AdminPages";
import { MentorDashboard, MentorTeamsPage, MentorTeamDetail } from "./pages/MentorPages";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
        <span className="text-sm font-semibold text-slate-600">Loading SelfE Hackathon…</span>
      </div>
    </div>
  );
}

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoleGate({ role, children }: { role: "ADMIN" | "MENTOR" | "TEAM_LEADER" | "TEAM_MEMBER"; children: React.ReactNode }) {
  const { user } = useAuth();
  const allowed = role === "TEAM_MEMBER"
    ? user?.role === "TEAM_MEMBER" || user?.role === "TEAM_LEADER"
    : user?.role === role;
  if (!allowed) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<Protected><AppShell /></Protected>}>
            <Route path="/app" element={<RoleGate role="TEAM_MEMBER"><ParticipantDashboard /></RoleGate>} />
            <Route path="/app/create-team" element={<RoleGate role="TEAM_MEMBER"><TeamAccessPage initialMode="create" /></RoleGate>} />
            <Route path="/app/join-team" element={<RoleGate role="TEAM_MEMBER"><TeamAccessPage initialMode="join" /></RoleGate>} />
            <Route path="/app/team" element={<RoleGate role="TEAM_MEMBER"><TeamPage /></RoleGate>} />
            <Route path="/app/profile" element={<RoleGate role="TEAM_MEMBER"><ProfilePage /></RoleGate>} />
            <Route path="/admin" element={<RoleGate role="ADMIN"><AdminDashboard /></RoleGate>} />
            <Route path="/admin/students" element={<RoleGate role="ADMIN"><StudentsPage /></RoleGate>} />
            <Route path="/admin/teams" element={<RoleGate role="ADMIN"><TeamsPage /></RoleGate>} />
            <Route path="/admin/mentors" element={<RoleGate role="ADMIN"><MentorsPage /></RoleGate>} />
            <Route path="/admin/mentor-allocation" element={<RoleGate role="ADMIN"><AllocationPage /></RoleGate>} />
            <Route path="/admin/messages" element={<RoleGate role="ADMIN"><MessagesPage /></RoleGate>} />
            <Route path="/admin/exports" element={<RoleGate role="ADMIN"><ExportsPage /></RoleGate>} />
            <Route path="/mentor" element={<RoleGate role="MENTOR"><MentorDashboard /></RoleGate>} />
            <Route path="/mentor/teams" element={<RoleGate role="MENTOR"><MentorTeamsPage /></RoleGate>} />
            <Route path="/mentor/teams/:id" element={<RoleGate role="MENTOR"><MentorTeamDetail /></RoleGate>} />
            <Route path="/mentor/profile" element={<RoleGate role="MENTOR"><ProfilePage /></RoleGate>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);
