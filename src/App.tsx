import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { checkAndPerformDailyReset, setupAutoReset } from "@/utils/dailyReset";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ServiceSelection from "./pages/ServiceSelection";
import Dashboard from "./pages/Dashboard";
import UploadSlip from "./pages/UploadSlip";
import PaymentSuccess from "./pages/PaymentSuccess";
import History from "./pages/History";
import AdminPanel from "./pages/AdminPanel";
import AdminLogin from "./pages/AdminLogin";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // ตรวจสอบและทำ daily reset เมื่อแอปเริ่มต้น
    checkAndPerformDailyReset().catch(console.error);
    // Setup auto reset scheduler
    setupAutoReset();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/service-selection" element={<ServiceSelection />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload-slip" element={<UploadSlip />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/history" element={<History />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin" element={
              <ProtectedAdminRoute requiredRole="staff">
                <AdminPanel />
              </ProtectedAdminRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
