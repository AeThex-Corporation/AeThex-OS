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
import Achievements from "@/pages/achievements";
import Opportunities from "@/pages/opportunities";
import Events from "@/pages/events";
import Terminal from "@/pages/terminal";
import Dashboard from "@/pages/dashboard";
import Curriculum from "@/pages/curriculum";
import Login from "@/pages/login";
import Admin from "@/pages/admin";
import Pitch from "@/pages/pitch";
import Builds from "@/pages/builds";
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
import Lab from "@/pages/lab";
import HubProjects from "@/pages/hub/projects";
import HubMessaging from "@/pages/hub/messaging";
import HubMarketplace from "@/pages/hub/marketplace";
import HubSettings from "@/pages/hub/settings";
import HubFileManager from "@/pages/hub/file-manager";
import HubCodeGallery from "@/pages/hub/code-gallery";
import HubNotifications from "@/pages/hub/notifications";
import HubAnalytics from "@/pages/hub/analytics";
import OsLink from "@/pages/os/link";
import MobileDashboard from "@/pages/mobile-dashboard"; 
import SimpleMobileDashboard from "@/pages/mobile-simple"; 
import MobileCamera from "@/pages/mobile-camera"; 
import MobileNotifications from "@/pages/mobile-notifications"; 
import MobileProjects from "@/pages/mobile-projects"; 
import MobileMessaging from "@/pages/mobile-messaging"; 
import MobileModules from "@/pages/mobile-modules"; 
import { LabTerminalProvider } from "@/hooks/use-lab-terminal";


function HomeRoute() {
  // On mobile devices, show the native mobile app
  // On desktop/web, show the web OS
  return <AeThexOS />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRoute} />
      <Route path="/camera" component={MobileCamera} />
      <Route path="/notifications" component={MobileNotifications} />
      <Route path="/hub/projects" component={MobileProjects} />
      <Route path="/hub/messaging" component={MobileMessaging} />
      <Route path="/hub/code-gallery" component={MobileModules} />
      <Route path="/home" component={Home} />
      <Route path="/passport" component={Passport} />
      <Route path="/achievements" component={Achievements} />
      <Route path="/opportunities" component={Opportunities} />
      <Route path="/events" component={Events} />
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
      <Route path="/builds" component={Builds} />
      <Route path="/os" component={AeThexOS} />
      <Route path="/os/link">{() => <ProtectedRoute><OsLink /></ProtectedRoute>}</Route>
      <Route path="/network" component={Network} />
      <Route path="/network/:slug" component={NetworkProfile} />
      <Route path="/lab" component={Lab} />
      <Route path="/hub/projects">{() => <ProtectedRoute><HubProjects /></ProtectedRoute>}</Route>
      <Route path="/hub/messaging">{() => <ProtectedRoute><HubMessaging /></ProtectedRoute>}</Route>
      <Route path="/hub/marketplace">{() => <ProtectedRoute><HubMarketplace /></ProtectedRoute>}</Route>
      <Route path="/hub/settings">{() => <ProtectedRoute><HubSettings /></ProtectedRoute>}</Route>
      <Route path="/hub/file-manager">{() => <ProtectedRoute><HubFileManager /></ProtectedRoute>}</Route>
      <Route path="/hub/code-gallery">{() => <ProtectedRoute><HubCodeGallery /></ProtectedRoute>}</Route>
      <Route path="/hub/notifications">{() => <ProtectedRoute><HubNotifications /></ProtectedRoute>}</Route>
      <Route path="/hub/analytics">{() => <ProtectedRoute><HubAnalytics /></ProtectedRoute>}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LabTerminalProvider>
          <TutorialProvider>
            <Toaster />
            <Router />
          </TutorialProvider>
        </LabTerminalProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
