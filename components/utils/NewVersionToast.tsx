import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRefresh, faXmark } from '@fortawesome/free-solid-svg-icons';

const NewVersionToast = (): JSX.Element | null => {
  // This component currently only renders the design.
  // Functionality (version checking, state) is not implemented.

  return (
    <div className="tailwind-scope tw-fixed tw-bottom-4 tw-right-4 tw-z-[1000] tw-rounded-md tw-bg-blue-600 tw-p-4 tw-text-white tw-shadow-lg animate-fade-in">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-4">
        <span>A new version is available!</span>
        <div className="tw-flex tw-items-center tw-space-x-2">
          <button
            onClick={() => console.log('Refresh clicked')} // Placeholder
            className="tw-ring-1 tw-ring-inset tw-ring-iron-700 desktop-hover:hover:tw-ring-iron-700 tw-text-iron-300 tw-flex tw-items-center tw-justify-center tw-gap-x-2 tw-rounded-lg tw-py-2 tw-px-4 tw-text-xs tw-bg-iron-800 desktop-hover:hover:tw-text-primary-400 tw-font-semibold tw-transition-all tw-duration-300"
            aria-label="Refresh page"
            title="Refresh page"
          >
            <FontAwesomeIcon icon={faRefresh} className="tw-size-4  tw-flex-shrink-0" />
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default NewVersionToast;
