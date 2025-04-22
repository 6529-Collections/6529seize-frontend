import { useCallback, useEffect } from "react";

/**
 * Props for the useAccessibility hook
 */
interface UseAccessibilityProps {
  /** Whether the component is in an active/enabled state */
  isActive: boolean;
  /** Callback to handle area click */
  onAreaClick: () => void;
  /** Whether reduced motion is preferred */
  prefersReducedMotion?: boolean;
}

/**
 * Interface for the return value of the useAccessibility hook
 */
interface AccessibilityHandlers {
  /** Handler for keyboard events */
  handleKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  /** Handler for touch start events */
  handleTouchStart: () => void;
  /** Handler for touch end events */
  handleTouchEnd: () => void;
}

/**
 * Hook for managing accessibility features
 *
 * Provides keyboard navigation, touch handling, and focus management
 * to ensure the component is accessible.
 *
 * @param props Hook props
 * @returns Object with ref and event handlers
 */
const useAccessibility = ({
  isActive,
  onAreaClick,
  prefersReducedMotion = false,
}: UseAccessibilityProps): AccessibilityHandlers => {
  // Check for reduced motion preference if not provided
  const detectedReducedMotion =
    typeof prefersReducedMotion !== "undefined"
      ? prefersReducedMotion
      : typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  // Keyboard event handler for accessibility
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>): void => {
      if ((e.key === "Enter" || e.key === " ") && isActive) {
        e.preventDefault();
        onAreaClick();
      }
    },
    [isActive, onAreaClick]
  );

  // Define touch event handlers
  const handleTouchStart = useCallback((): void => {
    // Optional visual feedback for touch
    if (isActive && !detectedReducedMotion) {
      // Any touch-specific visual feedback can be triggered here
    }
  }, [isActive, detectedReducedMotion]);

  const handleTouchEnd = useCallback((): void => {
    // Reset visual feedback
    if (isActive && !detectedReducedMotion) {
      // Any touch-specific cleanup can be done here
    }
  }, [isActive, detectedReducedMotion]);

  // Add touch event listeners for mobile devices
  useEffect(() => {
    return () => {
      // Cleanup if needed
    };
  }, [isActive, handleTouchStart, handleTouchEnd]);

  return {
    handleKeyDown,
    handleTouchStart,
    handleTouchEnd,
  };
};

export default useAccessibility;
