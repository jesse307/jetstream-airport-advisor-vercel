import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import LeadIntake from "./pages/LeadIntake";
import LeadImport from "./pages/LeadImport";
import ImportHistory from "./pages/ImportHistory";
import CRM from "./pages/CRM";
import LeadAnalysis from "./pages/LeadAnalysis";
import MobileCapture from "./pages/MobileCapture";
import Settings from "./pages/Settings";
import AircraftTracking from "./pages/AircraftTracking";
import Quotes from "./pages/Quotes";
import Availability from "./pages/Availability";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/crm" element={<ProtectedRoute><CRM /></ProtectedRoute>} />
            <Route path="/leads/new" element={<ProtectedRoute><LeadIntake /></ProtectedRoute>} />
            <Route path="/leads/import" element={<ProtectedRoute><LeadImport /></ProtectedRoute>} />
            <Route path="/leads/import-history" element={<ProtectedRoute><ImportHistory /></ProtectedRoute>} />
            <Route path="/leads/:id" element={<ProtectedRoute><LeadAnalysis /></ProtectedRoute>} />
            <Route path="/mobile-capture" element={<ProtectedRoute><MobileCapture /></ProtectedRoute>} />
            <Route path="/aircraft-tracking" element={<ProtectedRoute><AircraftTracking /></ProtectedRoute>} />
            <Route path="/quotes" element={<ProtectedRoute><Quotes /></ProtectedRoute>} />
            <Route path="/availability" element={<ProtectedRoute><Availability /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
