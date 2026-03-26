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
import NotFound from "./pages/NotFound";

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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
