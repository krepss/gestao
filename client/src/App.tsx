import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ColaboradorProvider } from "./contexts/ColaboradorContext";
import { supabase } from "./lib/supabase"; 

// Páginas Originais e Novas
import Dashboard from "./pages/Dashboard";
import Efetivo from "./pages/Efetivo";
import Ferias from "./pages/Ferias";
import Medidas from "./pages/Medidas";
import Afastamentos from "./pages/Afastamentos"; 
import Rotatividade from "./pages/Rotatividade"; 
import Login from "./components/Login";

function Router() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Pega sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Escuta Login/Logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) setLocation("/"); // Redireciona para a raiz (que mostrará o login)
    });

    return () => subscription.unsubscribe();
  }, [setLocation]);

  if (loading) return null;

  // Se NÃO estiver logado, o Switch só conhece a rota de Login
  if (!session) {
    return (
      <Switch>
        <Route component={Login} />
      </Switch>
    );
  }

  // Se ESTIVER logado, mantém todas as tuas rotas originais + as novas
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/efetivo" component={Efetivo} />
      <Route path="/ferias" component={Ferias} />
      <Route path="/medidas" component={Medidas} />
      <Route path="/afastamentos" component={Afastamentos} />
      <Route path="/rotatividade" component={Rotatividade} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <ColaboradorProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ColaboradorProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
