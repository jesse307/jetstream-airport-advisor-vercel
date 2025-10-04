import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import LeadIntake from "./pages/LeadIntake";
import LeadImport from "./pages/LeadImport";
import ImportHistory from "./pages/ImportHistory";
import LeadAnalysis from "./pages/LeadAnalysis";
import MobileCapture from "./pages/MobileCapture";
import Settings from "./pages/Settings";
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
          <Route path="/leads/new" element={<LeadIntake />} />
          <Route path="/leads/import" element={<LeadImport />} />
          <Route path="/leads/import-history" element={<ImportHistory />} />
          <Route path="/leads/:id" element={<LeadAnalysis />} />
          <Route path="/mobile-capture" element={<MobileCapture />} />
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
