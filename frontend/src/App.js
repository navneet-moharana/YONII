import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import AgeGate from "@/components/AgeGate";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Chat from "@/pages/Chat";
import Hub from "@/pages/Hub";
import SymptomChecker from "@/pages/SymptomChecker";
import ImageCheck from "@/pages/ImageCheck";
import PeriodTracker from "@/pages/PeriodTracker";
import Legal from "@/pages/Legal";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";

function AdminRoute({ children }) {
  const token = localStorage.getItem("yonii_admin_token");
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function ShellRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/symptom-checker" element={<SymptomChecker />} />
        <Route path="/image-check" element={<ImageCheck />} />
        <Route path="/period-tracker" element={<PeriodTracker />} />
        <Route path="/hub/:slug" element={<Hub />} />
        <Route path="/privacy" element={<Legal page="privacy" />} />
        <Route path="/terms" element={<Legal page="terms" />} />
        <Route path="/disclaimer" element={<Legal page="disclaimer" />} />
        <Route path="/refund" element={<Legal page="refund" />} />
        <Route path="/image-privacy" element={<Legal page="imagePrivacy" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/*"
            element={
              <AgeGate>
                <ShellRoutes />
              </AgeGate>
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
