import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NotFound from "./pages/NotFound";
import { APMCLayout } from "./components/apmc/APMCLayout";
import APMCDashboard from "./pages/apmc/APMCDashboard";
import SubmitPrice from "./pages/apmc/SubmitPrice";
import BulkUpload from "./pages/apmc/BulkUpload";
import SubmissionHistory from "./pages/apmc/SubmissionHistory";
import MyMandiProfile from "./pages/apmc/MyMandiProfile";
import IntegrationSettings from "./pages/apmc/IntegrationSettings";
import MandiRegistration from "./pages/apmc/MandiRegistration";
import { APMC_ROUTES } from "./lib/routes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to={APMC_ROUTES.root} replace />} />
          <Route path={APMC_ROUTES.root} element={<APMCLayout />}>
            <Route index element={<APMCDashboard />} />
            <Route path="dashboard" element={<Navigate to={APMC_ROUTES.dashboard} replace />} />
            <Route path="submit-price" element={<SubmitPrice />} />
            <Route path="bulk-upload" element={<BulkUpload />} />
            <Route path="history" element={<SubmissionHistory />} />
            <Route path="profile" element={<MyMandiProfile />} />
            <Route path="settings" element={<IntegrationSettings />} />
          </Route>
          <Route path={APMC_ROUTES.register} element={<MandiRegistration />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
