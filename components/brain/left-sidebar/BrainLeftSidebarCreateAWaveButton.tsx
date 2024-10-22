import Link from 'next/link';
import React from 'react';

interface BrainLeftSidebarCreateAWaveButtonProps {

}

const BrainLeftSidebarCreateAWaveButton: React.FC<BrainLeftSidebarCreateAWaveButtonProps> = () => {
  return (
    <div className="tw-mt-2 lg:tw-mt-4 tw-p-[1px] tw-flex tw-rounded-lg tw-bg-gradient-to-b tw-from-primary-400 tw-to-primary-500">
    <Link
      href="/waves?new=true"
      className="tw-no-underline tw-text-white hover:tw-bg-primary-600 hover:tw-border-primary-600 hover:tw-text-white tw-w-full tw-flex tw-justify-center tw-gap-x-1.5 tw-items-center tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out"
    >
      <svg
        className="tw-size-5 -tw-ml-1 tw-flex-shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 5V19M5 12H19"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>Create a Wave</span>
    </Link>
  </div>
  );
};

export default BrainLeftSidebarCreateAWaveButton;
