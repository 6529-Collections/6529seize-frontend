import React from "react";
import { Tooltip as ReactTooltip, PlacesType } from "react-tooltip";

interface TooltipProps {
  id: string;
  place?: PlacesType;
  offset?: number;
  variant?: "default" | "sidebar";
}

/**
 * Centralized tooltip component with consistent styling
 */
export const Tooltip: React.FC<TooltipProps> = ({
  id,
  place = "bottom",
  offset = 8,
  variant = "default",
}) => {
  const isSidebar = variant === "sidebar";
  
  const baseStyles: React.CSSProperties = {
    padding: isSidebar ? "4px 8px" : "6px 10px",
    background: "linear-gradient(to bottom right, rgb(64, 64, 64), rgb(38, 38, 38))",
    color: "white",
    fontSize: isSidebar ? "13px" : "12px",
    fontWeight: "500",
    borderRadius: "6px",
    boxShadow: isSidebar 
      ? "0 25px 50px -12px rgba(0, 0, 0, 0.25)" 
      : "0 4px 12px rgba(0, 0, 0, 0.3)",
    zIndex: isSidebar ? 9999 : 10000,
  };
  
  const sidebarStyles: React.CSSProperties = isSidebar ? {
    pointerEvents: "none",
    filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))",
    backdropFilter: "blur(4px)",
  } : {};

  return (
    <ReactTooltip
      id={id}
      place={isSidebar ? "right" : place}
      offset={isSidebar ? 16 : offset}
      opacity={1}
      style={{
        ...baseStyles,
        ...sidebarStyles,
      }}
      border="1px solid rgb(64, 64, 64)"
    />
  );
};

export default Tooltip;