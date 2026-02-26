import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AlertNotificationsProvider } from "@/contexts/AlertNotificationsContext";
import Index from "./pages/Index";
import StoresPage from "./pages/StoresPage";
import POSDetailPage from "./pages/POSDetailPage";
import ActionsPage from "./pages/ActionsPage";
import ExecuteActionPage from "./pages/ExecuteActionPage";
import RequestActionPage from "./pages/RequestActionPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import CommandHistoryPage from "./pages/CommandHistoryPage";
import MyActionsPage from "./pages/MyActionsPage";
import IncidentsPage from "./pages/IncidentsPage";
import ObservabilityPage from "./pages/ObservabilityPage";
import AuditPageV2 from "./pages/AuditPageV2";
import AlertsPage from "./pages/AlertsPage";
import ExecutionDetailPage from "./pages/ExecutionDetailPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AlertNotificationsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/stores" element={<StoresPage />} />
              <Route path="/stores/pos/:posId" element={<POSDetailPage />} />
              <Route path="/actions" element={<ActionsPage />} />
              <Route path="/execute" element={<ExecuteActionPage />} />
              <Route path="/request" element={<RequestActionPage />} />
              <Route path="/approvals" element={<ApprovalsPage />} />
              <Route path="/history" element={<CommandHistoryPage />} />
              <Route path="/my-actions" element={<MyActionsPage />} />
              <Route path="/incidents" element={<IncidentsPage />} />
              <Route path="/observability" element={<ObservabilityPage />} />
              <Route path="/audit" element={<AuditPageV2 />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/executions/:id" element={<ExecutionDetailPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AlertNotificationsProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
