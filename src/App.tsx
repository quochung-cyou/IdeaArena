import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import CreateArena from "./pages/CreateArena";
import ManageGames from "./pages/ManageGames";
import AdminResults from "./pages/AdminResults";
import { BattleArena } from "./components/battle/BattleArena";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateArena />} />
            <Route path="/edit/:id" element={<CreateArena />} />
            <Route path="/manage" element={<ManageGames />} />
            <Route path="/results/:id" element={<AdminResults />} />
            <Route path="/arena/:id" element={<BattleArena />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
