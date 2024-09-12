import React from 'react';

interface WaveDetailedDropActionsReplyProps {
  onReply: () => void;
}

const WaveDetailedDropActionsReply: React.FC<WaveDetailedDropActionsReplyProps> = ({ onReply }) => {
  return (
    <button
      className="tw-text-iron-500 icon tw-px-2 tw-py-1.5 tw-group tw-bg-transparent tw-rounded-full tw-border-0 tw-inline-flex tw-items-center tw-gap-x-2  tw-text-[0.8125rem] tw-leading-5 tw-font-medium tw-transition tw-ease-out tw-duration-300"
      onClick={onReply}
    >
      <svg
        className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-transition tw-ease-out tw-duration-300"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.49 12 3.74 8.248m0 0 3.75-3.75m-3.75 3.75h16.5V19.5"
        />
      </svg>
    </button>
  );
};

export default WaveDetailedDropActionsReply;