import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ColaboradorProvider } from "./contexts/ColaboradorContext";
import Dashboard from "./pages/Dashboard";
import Efetivo from "./pages/Efetivo";
import Ferias from "./pages/Ferias";
import Medidas from "./pages/Medidas";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path={"/efetivo"} component={Efetivo} />
      <Route path={"/ferias"} component={Ferias} />
      <Route path={"/medidas"} component={Medidas} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;
