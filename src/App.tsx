import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAccount } from 'wagmi';
import { WalletGuard } from "@/components/WalletGuard";
import { UserProvider } from "@/contexts/UserContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const App = () => {
  const { isConnected } = useAccount();

  return (
    <UserProvider>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route 
              path="/" 
              element={
                isConnected ? <Navigate to="/dashboard" replace /> : <Index />
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <WalletGuard fallback={<Navigate to="/" replace />}>
                  <Dashboard />
                </WalletGuard>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </UserProvider>
  );
};

export default App;
