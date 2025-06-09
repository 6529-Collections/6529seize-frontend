import React from 'react';
import type { BrowserWarningProps } from '../reducers/types';

/**
 * Browser Compatibility Warning Component
 * 
 * Displays a warning when the user's browser has limited support
 * for features required by the file uploader.
 * 
 * @param props Component props
 * @returns JSX Element
 */
const BrowserWarning: React.FC<BrowserWarningProps> = ({ reason }) => (
  <div className="tw-absolute tw-inset-0 tw-bg-iron-950/90 tw-flex tw-items-center tw-justify-center tw-p-6 tw-z-10">
    <div className="tw-max-w-lg tw-bg-iron-900 tw-p-6 tw-rounded-xl tw-border tw-border-iron-800">
      <div className="tw-flex tw-items-center tw-mb-4 tw-text-[#FEDF89]">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="tw-w-6 tw-h-6 tw-mr-2">
          <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
        </svg>
        <h3 className="tw-text-lg tw-font-semibold">Browser Compatibility Issue</h3>
      </div>
      <p className="tw-text-iron-300 tw-mb-4">
        {reason}
      </p>
      <p className="tw-text-iron-400 tw-text-sm">
        We recommend using a modern browser like Chrome, Firefox, Edge, or Safari for the best experience.
      </p>
    </div>
  </div>
);

export default BrowserWarning;