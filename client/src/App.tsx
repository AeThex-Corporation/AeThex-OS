import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Passport from "@/pages/passport";
import Terminal from "@/pages/terminal";
import Dashboard from "@/pages/dashboard";
import Curriculum from "@/pages/curriculum";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/passport" component={Passport} />
      <Route path="/terminal" component={Terminal} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/curriculum" component={Curriculum} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;
