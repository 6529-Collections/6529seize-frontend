import React from "react";

interface WarningIconProps {
  readonly className?: string;
}

/**
 * Warning icon for indicating limited remaining submissions
 * Uses an exclamation triangle design to communicate urgency
 */
export default function WarningIcon({ className = "" }: WarningIconProps): JSX.Element {
  return (
    <svg 
      className={className}
      viewBox="0 0 24 24" 
      fill="none" 
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M12 9V14" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M12 21.41H5.94C2.47 21.41 1.02 18.93 2.7 15.9L5.82 10.28L8.76 5.00002C10.54 1.79002 13.46 1.79002 15.24 5.00002L18.18 10.29L21.3 15.91C22.98 18.94 21.52 21.42 18.06 21.42H12V21.41Z" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M11.995 17H12.005" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
