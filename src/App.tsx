import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Clients from "./pages/Clients";
import Rules from "./pages/Rules";
import Sources from "./pages/Sources";
import Publications from "./pages/Publications";
import MatchesPage from "./pages/Matches";
import Notifications from "./pages/Notifications";
import Integrations from "./pages/Integrations";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/sources" element={<Sources />} />
          <Route path="/publications" element={<Publications />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
