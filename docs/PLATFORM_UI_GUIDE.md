# Platform-Specific UI Guide

## Overview
AeThex OS now supports platform-adaptive UI that automatically adjusts for mobile, desktop, and web environments while maintaining the same core functionality.

## Quick Start

### 1. Use the Platform Layout Hook

```typescript
import { usePlatformLayout, usePlatformClasses } from '@/hooks/use-platform-layout';

function MyComponent() {
  const layout = usePlatformLayout();
  const classes = usePlatformClasses();

  return (
    <div className={classes.container}>
      {layout.isMobile ? (
        <MobileView />
      ) : (
        <DesktopView />
      )}
    </div>
  );
}
```

### 2. Platform-Specific Rendering

```typescript
import { PlatformSwitch } from '@/hooks/use-platform-layout';

<PlatformSwitch
  mobile={<MobileNavigation />}
  desktop={<DesktopNavigation />}
  web={<WebNavigation />}
  fallback={<DefaultNavigation />}
/>
```

### 3. Adaptive Styling

```typescript
const classes = usePlatformClasses();

<Button className={classes.button}>
  {/* Automatically h-12 on mobile, h-10 on desktop/web */}
  Click Me
</Button>
```

## Platform Detection

The app automatically detects:
- **Mobile**: Capacitor native apps (iOS/Android)
- **Desktop**: Tauri desktop apps (Windows/macOS/Linux)
- **Web**: Browser-based access

Detection is done via the existing [lib/platform.ts](../client/src/lib/platform.ts).

## Layout Patterns

### Mobile-First Approach

```typescript
// Mobile: Bottom navigation, full-width cards, larger touch targets
<div className="grid grid-cols-1 gap-3 px-4">
  <Card className="rounded-lg p-4">
    <Button className="h-12 text-base w-full">
      Large Touch Target
    </Button>
  </Card>
</div>
```

### Desktop Optimization

```typescript
// Desktop: Top navigation, multi-column layout, compact controls
<div className="grid grid-cols-3 gap-6 px-8">
  <Card className="rounded-xl p-6">
    <Button className="h-10 text-sm">
      Compact Button
    </Button>
  </Card>
</div>
```

## Responsive Design Strategy

### 1. Layout Changes
- **Mobile**: Single column, bottom navigation, full-screen modals
- **Desktop**: Multi-column, top/side navigation, floating dialogs
- **Web**: Adaptive columns, sticky navigation, responsive dialogs

### 2. Typography
- **Mobile**: Larger base font (16px+) for readability
- **Desktop**: Standard font (14px) for information density
- **Web**: Medium font (15px) for balance

### 3. Spacing
- **Mobile**: Tighter spacing (12px-16px) to maximize screen space
- **Desktop**: Generous spacing (24px-32px) for clarity
- **Web**: Balanced spacing (16px-24px)

### 4. Touch Targets
- **Mobile**: Minimum 44px height for buttons and interactive elements
- **Desktop**: Standard 40px height
- **Web**: 40px height

## Example Implementation

See [PlatformAdaptiveExample.tsx](../client/src/components/PlatformAdaptiveExample.tsx) for a complete example showing:
- Platform-specific headers
- Adaptive grids
- Conditional navigation styles
- Touch-optimized controls

## Common Patterns

### Adaptive Navigation

```typescript
function Navigation() {
  const { isMobile } = usePlatformLayout();

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 border-t">
        <BottomTabBar />
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 border-b">
      <TopMenuBar />
    </nav>
  );
}
```

### Responsive Cards

```typescript
function CardGrid() {
  const { isMobile, isDesktop } = usePlatformLayout();
  
  const columns = isMobile ? 'grid-cols-1' : 
                  isDesktop ? 'grid-cols-4' : 
                  'grid-cols-2';

  return <div className={`grid ${columns} gap-4`}>
    {/* Cards */}
  </div>;
}
```

### Adaptive Forms

```typescript
function Form() {
  const classes = usePlatformClasses();
  
  return (
    <form className={classes.spacing}>
      <Input className={classes.input} placeholder="Name" />
      <Button className={classes.button} type="submit">
        Submit
      </Button>
    </form>
  );
}
```

## Mobile-Specific Features

### Safe Area Support (iOS)
```css
/* In your CSS */
.mobile-container {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```

### Pull-to-Refresh
```typescript
import { isMobile } from '@/lib/platform';

if (isMobile()) {
  // Enable pull-to-refresh gesture
  window.addEventListener('touchstart', handlePullToRefresh);
}
```

### Native Gestures
```typescript
// Swipe navigation on mobile
if (isMobile()) {
  <SwipeableViews onChangeIndex={handleSwipe}>
    <Page1 />
    <Page2 />
  </SwipeableViews>
}
```

## Desktop-Specific Features

### Window Controls
```typescript
import { isDesktop } from '@/lib/platform';

if (isDesktop()) {
  // Custom title bar, minimize/maximize/close
  <TauriTitleBar />
}
```

### Keyboard Shortcuts
```typescript
if (isDesktop()) {
  useEffect(() => {
    // Ctrl+N for new item, etc.
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'n') {
        createNew();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
```

## Testing Platform Variants

### In Development
```typescript
// Force platform detection for testing
if (import.meta.env.DEV) {
  window.Capacitor = {}; // Test as mobile
  // or
  window.__TAURI__ = {}; // Test as desktop
}
```

### Chrome DevTools
- Open DevTools → Device Toolbar
- Select mobile device
- The app will detect as web but use mobile viewport

## Best Practices

1. **Design Mobile-First**: Start with mobile constraints, enhance for larger screens
2. **Use Touch-Friendly Sizes**: Minimum 44px tap targets on mobile
3. **Optimize Navigation**: Bottom tabs on mobile, top/side on desktop
4. **Adapt Typography**: Larger on mobile, more compact on desktop
5. **Test on Real Devices**: Emulators are good, but test on actual hardware
6. **Progressive Enhancement**: Core functionality works everywhere, enhancements per platform

## Migration Guide

To update existing components:

1. Import the hooks:
```typescript
import { usePlatformClasses } from '@/hooks/use-platform-layout';
```

2. Replace hardcoded classes:
```typescript
// Before
<div className="px-6 py-4">

// After
const classes = usePlatformClasses();
<div className={classes.container}>
```

3. Add platform switches where needed:
```typescript
<PlatformSwitch
  mobile={<MobileComponent />}
  fallback={<DesktopComponent />}
/>
```

## Resources

- [Platform Detection](../client/src/lib/platform.ts)
- [Layout Hook](../client/src/hooks/use-platform-layout.ts)
- [Example Component](../client/src/components/PlatformAdaptiveExample.tsx)
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Tauri Docs](https://tauri.app/v1/guides/)
