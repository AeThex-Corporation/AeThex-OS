import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Passport from "@/pages/passport";
import Terminal from "@/pages/terminal";
import Dashboard from "@/pages/dashboard";
import Curriculum from "@/pages/curriculum";
import Login from "@/pages/login";
import Admin from "@/pages/admin";
import Pitch from "@/pages/pitch";
import AdminArchitects from "@/pages/admin-architects";
import AdminProjects from "@/pages/admin-projects";
import AdminCredentials from "@/pages/admin-credentials";
import AdminAegis from "@/pages/admin-aegis";
import AdminSites from "@/pages/admin-sites";
import AdminLogs from "@/pages/admin-logs";
import AdminAchievements from "@/pages/admin-achievements";
import AdminApplications from "@/pages/admin-applications";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/passport" component={Passport} />
      <Route path="/terminal" component={Terminal} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/curriculum" component={Curriculum} />
      <Route path="/login" component={Login} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/architects" component={AdminArchitects} />
      <Route path="/admin/projects" component={AdminProjects} />
      <Route path="/admin/credentials" component={AdminCredentials} />
      <Route path="/admin/aegis" component={AdminAegis} />
      <Route path="/admin/sites" component={AdminSites} />
      <Route path="/admin/logs" component={AdminLogs} />
      <Route path="/admin/achievements" component={AdminAchievements} />
      <Route path="/admin/applications" component={AdminApplications} />
      <Route path="/pitch" component={Pitch} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster />
        <Router />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
