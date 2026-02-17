import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import MapInsights from "./pages/MapInsights";
import Arbitrage from "./pages/Arbitrage";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { ProtectedRoute, PublicOnlyRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import { RoleRoute } from "./components/RoleRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicOnlyRoute>
                <Signup />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicOnlyRoute>
                <ForgotPassword />
              </PublicOnlyRoute>
            }
          />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/"
              element={<Index />}
            />
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />
            <Route
              path="/analytics"
              element={
                <RoleRoute route="/analytics">
                  <Analytics />
                </RoleRoute>
              }
            />
            <Route
              path="/map"
              element={
                <RoleRoute route="/map">
                  <MapInsights />
                </RoleRoute>
              }
            />
            <Route
              path="/arbitrage"
              element={
                <RoleRoute route="/arbitrage">
                  <Arbitrage />
                </RoleRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <RoleRoute route="/reports">
                  <Reports />
                </RoleRoute>
              }
            />
            <Route
              path="/profile"
              element={<Profile />}
            />
            <Route
              path="/profile/:role"
              element={<Profile />}
            />
          </Route>
          <Route
            path="*"
            element={
              <NotFound />
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
