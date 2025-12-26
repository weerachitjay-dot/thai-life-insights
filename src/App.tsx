import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FilterProvider } from "./contexts/FilterContext";
import Overview from "./pages/Overview";
import CostProfit from "./pages/CostProfit";
import Creative from "./pages/Creative";
import Audience from "./pages/Audience";
import Optimization from "./pages/Optimization";
import LeadsAnalysis from "./pages/LeadsAnalysis";
import ProductMaster from "./pages/ProductMaster";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <FilterProvider>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/cost-profit" element={<CostProfit />} />
            <Route path="/creative" element={<Creative />} />
            <Route path="/audience" element={<Audience />} />
            <Route path="/optimization" element={<Optimization />} />
            <Route path="/leads" element={<LeadsAnalysis />} />
            <Route path="/products" element={<ProductMaster />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </FilterProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
