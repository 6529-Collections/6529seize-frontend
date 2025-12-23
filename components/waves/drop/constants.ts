
/**
 * Shared constants for SingleWaveDrop components
 * Extracted to prevent object re-creation on each render
 */

export const TOOLTIP_STYLES = {
  padding: "4px 8px",
  background: "#37373E",
  color: "white",
  fontSize: "13px",
  fontWeight: 500,
  borderRadius: "6px",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  zIndex: 99999,
  pointerEvents: "none" as const,
} as const;
