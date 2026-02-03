import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { useHaptics } from "@/hooks/use-haptics";

export interface HapticButtonProps extends ButtonProps {
  hapticStyle?: 'light' | 'medium' | 'heavy';
  hapticOnPress?: boolean;
}

/**
 * Button wrapper that adds haptic feedback on mobile devices.
 * Falls back gracefully to normal button on web.
 */
export const HapticButton = React.forwardRef<HTMLButtonElement, HapticButtonProps>(
  ({ hapticStyle = 'light', hapticOnPress = true, onClick, ...props }, ref) => {
    const haptics = useHaptics();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (hapticOnPress) {
        haptics.impact(hapticStyle);
      }
      onClick?.(e);
    };

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        {...props}
      />
    );
  }
);

HapticButton.displayName = "HapticButton";

export default HapticButton;
