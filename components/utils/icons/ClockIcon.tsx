import React, { type JSX } from "react";

interface ClockIconProps {
  readonly className?: string;
}

/**
 * Clock icon for the Coming Soon button
 */
export default function ClockIcon({ className }: ClockIconProps): JSX.Element {
  return (
    <svg 
      className={className}
      viewBox="0 0 24 24" 
      fill="none" 
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M12 6V12L16 14" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
