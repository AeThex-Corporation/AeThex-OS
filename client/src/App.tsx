import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth";
import { TutorialProvider } from "@/components/Tutorial";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
import AdminActivity from "@/pages/admin-activity";
import AdminNotifications from "@/pages/admin-notifications";
import AeThexOS from "@/pages/os";
import Network from "@/pages/network";
import NetworkProfile from "@/pages/network-profile";

function Router() {
  return (
    <Switch>
      <Route path="/" component={AeThexOS} />
      <Route path="/home" component={Home} />
      <Route path="/passport" component={Passport} />
      <Route path="/terminal" component={Terminal} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/curriculum" component={Curriculum} />
      <Route path="/login" component={Login} />
      <Route path="/admin">{() => <ProtectedRoute><Admin /></ProtectedRoute>}</Route>
      <Route path="/admin/architects">{() => <ProtectedRoute><AdminArchitects /></ProtectedRoute>}</Route>
      <Route path="/admin/projects">{() => <ProtectedRoute><AdminProjects /></ProtectedRoute>}</Route>
      <Route path="/admin/credentials">{() => <ProtectedRoute><AdminCredentials /></ProtectedRoute>}</Route>
      <Route path="/admin/aegis">{() => <ProtectedRoute><AdminAegis /></ProtectedRoute>}</Route>
      <Route path="/admin/sites">{() => <ProtectedRoute><AdminSites /></ProtectedRoute>}</Route>
      <Route path="/admin/logs">{() => <ProtectedRoute><AdminLogs /></ProtectedRoute>}</Route>
      <Route path="/admin/achievements">{() => <ProtectedRoute><AdminAchievements /></ProtectedRoute>}</Route>
      <Route path="/admin/applications">{() => <ProtectedRoute><AdminApplications /></ProtectedRoute>}</Route>
      <Route path="/admin/activity">{() => <ProtectedRoute><AdminActivity /></ProtectedRoute>}</Route>
      <Route path="/admin/notifications">{() => <ProtectedRoute><AdminNotifications /></ProtectedRoute>}</Route>
      <Route path="/pitch" component={Pitch} />
      <Route path="/os" component={AeThexOS} />
      <Route path="/network" component={Network} />
      <Route path="/network/:slug" component={NetworkProfile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TutorialProvider>
          <Toaster />
          <Router />
        </TutorialProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
