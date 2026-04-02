import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/client/LandingPage";
import AuthPage from "./pages/client/AuthPage";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardHome from "./pages/client/dashboard/DashboardHome";
import ContractsPage from "./pages/client/dashboard/ContractsPage";
import ContractRequestPage from "./pages/client/dashboard/ContractRequestPage";
import ClaimsPage from "./pages/client/dashboard/ClaimsPage";
import OffersPage from "./pages/client/OffersPage";
import OfferDetailPage from "./pages/client/OfferDetailPage";
import AgentDashboard from "./pages/agent/AgentDashboard";
import AdminAgentsPage from "./pages/admin/AdminAgentsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="contracts" element={<ContractsPage />} />
            <Route path="contracts/new" element={<ContractRequestPage />} />
            <Route path="claims" element={<ClaimsPage />} />
            <Route path="offers" element={<OffersPage />} />
            <Route path="offers/:id" element={<OfferDetailPage />} />
          </Route>
          
          <Route path="/agent" element={<AgentDashboard />} />
          <Route path="/admin" element={<AdminAgentsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
