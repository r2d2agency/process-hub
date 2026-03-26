import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Clients from "./pages/Clients";
import Rules from "./pages/Rules";
import Sources from "./pages/Sources";
import Publications from "./pages/Publications";
import MatchesPage from "./pages/Matches";
import Notifications from "./pages/Notifications";
import Integrations from "./pages/Integrations";
import SettingsPage from "./pages/SettingsPage";
import Users from "./pages/Users";
import Logs from "./pages/Logs";
import DatajudConsulta from "./pages/DatajudConsulta";
import NotFound from "./pages/NotFound";

// Legal Monitoring
import LegalMonitoringDashboard from "./pages/legal-monitoring/Dashboard";
import ProcessList from "./pages/legal-monitoring/ProcessList";
import ProcessForm from "./pages/legal-monitoring/ProcessForm";
import ProcessDetail from "./pages/legal-monitoring/ProcessDetail";
import ProcessImport from "./pages/legal-monitoring/ProcessImport";
import AlertCenter from "./pages/legal-monitoring/AlertCenter";
import IntegrationLogs from "./pages/legal-monitoring/IntegrationLogs";
import MonitoringSettings from "./pages/legal-monitoring/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
            <Route path="/rules" element={<ProtectedRoute><Rules /></ProtectedRoute>} />
            <Route path="/sources" element={<ProtectedRoute><Sources /></ProtectedRoute>} />
            <Route path="/publications" element={<ProtectedRoute><Publications /></ProtectedRoute>} />
            <Route path="/matches" element={<ProtectedRoute><MatchesPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
            <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
            <Route path="/datajud" element={<ProtectedRoute><DatajudConsulta /></ProtectedRoute>} />

            {/* Legal Monitoring */}
            <Route path="/legal-monitoring" element={<ProtectedRoute><LegalMonitoringDashboard /></ProtectedRoute>} />
            <Route path="/legal-monitoring/processes" element={<ProtectedRoute><ProcessList /></ProtectedRoute>} />
            <Route path="/legal-monitoring/new" element={<ProtectedRoute><ProcessForm /></ProtectedRoute>} />
            <Route path="/legal-monitoring/processes/:id" element={<ProtectedRoute><ProcessDetail /></ProtectedRoute>} />
            <Route path="/legal-monitoring/import" element={<ProtectedRoute><ProcessImport /></ProtectedRoute>} />
            <Route path="/legal-monitoring/alerts" element={<ProtectedRoute><AlertCenter /></ProtectedRoute>} />
            <Route path="/legal-monitoring/logs" element={<ProtectedRoute><IntegrationLogs /></ProtectedRoute>} />
            <Route path="/legal-monitoring/settings" element={<ProtectedRoute><MonitoringSettings /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
