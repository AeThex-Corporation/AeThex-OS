import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePlatformLayout, usePlatformClasses, PlatformSwitch } from '@/hooks/use-platform-layout';
import { Home, Users, Settings, Plus } from 'lucide-react';

/**
 * Example component showing how to adapt UI for different platforms
 */
export function PlatformAdaptiveExample() {
  const layout = usePlatformLayout();
  const classes = usePlatformClasses();

  return (
    <div className={classes.container}>
      {/* Platform-specific header */}
      <PlatformSwitch
        mobile={<MobileHeader />}
        desktop={<DesktopHeader />}
        web={<WebHeader />}
      />

      {/* Content that adapts to platform */}
      <div className={classes.spacing}>
        <Card className={classes.card}>
          <CardHeader>
            <CardTitle className={classes.heading}>
              Platform: {layout.isMobile ? 'Mobile' : layout.isDesktop ? 'Desktop' : 'Web'}
            </CardTitle>
          </CardHeader>
          <CardContent className={classes.spacing}>
            <p className={classes.fontSize}>
              This component automatically adapts its layout and styling based on the platform.
            </p>
            
            {/* Platform-specific buttons */}
            <div className="flex gap-2">
              <Button className={classes.button}>
                <Plus className="mr-2 h-4 w-4" />
                {layout.isMobile ? 'Add' : 'Add New Item'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Grid that adapts to screen size and platform */}
        <div className={`grid gap-4 ${
          layout.isMobile ? 'grid-cols-1' : 
          layout.isDesktop ? 'grid-cols-3' : 
          'grid-cols-2'
        }`}>
          <Card className={classes.card}>
            <CardContent className="pt-6">
              <Home className="h-8 w-8 mb-2" />
              <h3 className={classes.subheading}>Dashboard</h3>
            </CardContent>
          </Card>
          <Card className={classes.card}>
            <CardContent className="pt-6">
              <Users className="h-8 w-8 mb-2" />
              <h3 className={classes.subheading}>Team</h3>
            </CardContent>
          </Card>
          <Card className={classes.card}>
            <CardContent className="pt-6">
              <Settings className="h-8 w-8 mb-2" />
              <h3 className={classes.subheading}>Settings</h3>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Platform-specific navigation */}
      <PlatformSwitch
        mobile={<MobileBottomNav />}
        desktop={<DesktopTopNav />}
        web={<WebStickyNav />}
      />
    </div>
  );
}

// Mobile: Bottom navigation bar
function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t">
      <div className="flex justify-around items-center h-16 px-4">
        <NavItem icon={<Home />} label="Home" />
        <NavItem icon={<Users />} label="Team" />
        <NavItem icon={<Settings />} label="Settings" />
      </div>
    </nav>
  );
}

// Desktop: Top navigation bar
function DesktopTopNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-background border-b">
      <div className="flex items-center justify-between h-16 px-8">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold">AeThex OS</span>
          <NavItem icon={<Home />} label="Dashboard" />
          <NavItem icon={<Users />} label="Team" />
        </div>
        <NavItem icon={<Settings />} label="Settings" />
      </div>
    </nav>
  );
}

// Web: Sticky navigation
function WebStickyNav() {
  return (
    <nav className="sticky top-0 bg-background/95 backdrop-blur border-b z-50">
      <div className="flex items-center justify-between h-14 px-6">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold">AeThex OS</span>
          <NavItem icon={<Home />} label="Home" />
          <NavItem icon={<Users />} label="Team" />
        </div>
        <NavItem icon={<Settings />} label="Settings" />
      </div>
    </nav>
  );
}

function NavItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}

// Mobile-specific header
function MobileHeader() {
  return (
    <header className="sticky top-0 bg-background border-b z-10 px-4 py-3">
      <h1 className="text-xl font-bold">AeThex OS</h1>
    </header>
  );
}

// Desktop-specific header
function DesktopHeader() {
  return (
    <header className="mb-6">
      <h1 className="text-3xl font-bold mb-2">AeThex OS Desktop</h1>
      <p className="text-muted-foreground">Native desktop experience</p>
    </header>
  );
}

// Web-specific header
function WebHeader() {
  return (
    <header className="mb-4">
      <h1 className="text-2xl font-bold mb-1">AeThex OS</h1>
      <p className="text-sm text-muted-foreground">Web desktop platform</p>
    </header>
  );
}
