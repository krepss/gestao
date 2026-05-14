import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ColaboradorProvider } from "./contexts/ColaboradorContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { PrivateRoute } from "./components/PrivateRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Efetivo from "./pages/Efetivo";
import Ferias from "./pages/Ferias";
import Medidas from "./pages/Medidas";
import Afastamentos from "./pages/Afastamentos";
import Rotatividade from "./pages/Rotatividade";

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <Switch>
      <Route path={"/login"} component={Login} />
      <Route path={"/"} component={() => <PrivateRoute component={Dashboard} />} />
      <Route path={"/efetivo"} component={() => <PrivateRoute component={Efetivo} />} />
      <Route path={"/ferias"} component={() => <PrivateRoute component={Ferias} />} />
      <Route path={"/medidas"} component={() => <PrivateRoute component={Medidas} />} />
      <Route path={"/afastamentos"} component={() => <PrivateRoute component={Afastamentos} />} />
      <Route path={"/rotatividade"} component={() => <PrivateRoute component={Rotatividade} />} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider
          defaultTheme="light"
          // switchable
        >
          <ColaboradorProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </ColaboradorProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
