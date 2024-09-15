import React, { useState } from 'react';
import { Drop } from '../../../../generated/models/Drop';
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";

interface WaveDetailedDropActionsCopyLinkProps {
  drop: Drop;
}

const WaveDetailedDropActionsCopyLink: React.FC<WaveDetailedDropActionsCopyLinkProps> = ({ drop }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    const dropLink = `${window.location.protocol}//${window.location.host}/waves/${drop.wave.id}?drop=${drop.id}`;
    navigator.clipboard.writeText(dropLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Tippy
      content={
        <div className="tw-text-center">
          <span
            className={`tw-text-xs tw-font-normal tw-text-center tw-w-full tw-transition tw-duration-300 tw-ease-out`}
          >
            {copied ? "Copied!" : "Copy link"}
          </span>
        </div>
      }
      placement="top"
      disabled={false}
      trigger="mouseenter"
      hideOnClick={false}
    >
      <div>
        <button
          className={`tw-text-iron-500 icon tw-px-2 tw-py-1.5 tw-group tw-bg-transparent tw-rounded-full tw-border-0 tw-inline-flex tw-items-center tw-gap-x-2 tw-text-[0.8125rem] tw-leading-5 tw-font-medium tw-transition tw-ease-out tw-duration-300`}
          onClick={copyToClipboard}
        >
          <svg
            className={`tw-flex-shrink-0 tw-w-5 tw-h-5 tw-transition tw-ease-out tw-duration-300`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
            />
          </svg>
        </button>
      </div>
    </Tippy>
  );
};

export default WaveDetailedDropActionsCopyLink;