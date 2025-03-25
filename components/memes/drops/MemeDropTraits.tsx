import React, { useState } from "react";

interface MemeDropTraitsProps {
  // For future expansion, we could use actual metadata here
  readonly dummy?: boolean; // Just a placeholder for now
}

const MemeDropTraits: React.FC<MemeDropTraitsProps> = () => {
  const [showAllTraits, setShowAllTraits] = useState(false);

  return (
    <div className="tw-flex tw-items-center tw-gap-x-2">
      <div className="tw-flex tw-flex-wrap tw-gap-2">
        <div className="tw-px-2 tw-py-1 tw-rounded-md tw-bg-iron-800/50 tw-flex tw-items-center">
          <span className="tw-text-iron-400 tw-text-xs tw-mr-1.5">Style:</span>
          <span className="tw-text-iron-200 tw-text-xs tw-font-medium">
            Punk
          </span>
        </div>
        <div className="tw-px-2 tw-py-1 tw-rounded-md tw-bg-iron-800/50 tw-flex tw-items-center">
          <span className="tw-text-iron-400 tw-text-xs tw-mr-1.5">
            Element:
          </span>
          <span className="tw-text-iron-200 tw-text-xs tw-font-medium">
            Fire
          </span>
        </div>
        <div className="tw-px-2 tw-py-1 tw-rounded-md tw-bg-iron-800/50 tw-flex tw-items-center">
          <span className="tw-text-iron-400 tw-text-xs tw-mr-1.5">Power:</span>
          <span className="tw-text-iron-200 tw-text-xs tw-font-medium">85</span>
        </div>
        {showAllTraits && (
          <>
            <div className="tw-px-2 tw-py-1 tw-rounded-md tw-bg-iron-800/50 tw-flex tw-items-center">
              <span className="tw-text-iron-400 tw-text-xs tw-mr-1.5">
                Wisdom:
              </span>
              <span className="tw-text-iron-200 tw-text-xs tw-font-medium">
                70
              </span>
            </div>
            <div className="tw-px-2 tw-py-1 tw-rounded-md tw-bg-iron-800/50 tw-flex tw-items-center">
              <span className="tw-text-iron-400 tw-text-xs tw-mr-1.5">
                Speed:
              </span>
              <span className="tw-text-iron-200 tw-text-xs tw-font-medium">
                90
              </span>
            </div>
            <div className="tw-px-2 tw-py-1 tw-rounded-md tw-bg-iron-800/50 tw-flex tw-items-center">
              <span className="tw-text-iron-400 tw-text-xs tw-mr-1.5">
                Palette:
              </span>
              <span className="tw-text-iron-200 tw-text-xs tw-font-medium">
                Neon
              </span>
            </div>
          </>
        )}
      </div>
      <button
        onClick={() => setShowAllTraits(!showAllTraits)}
        className="tw-text-xs tw-text-iron-400 desktop-hover:hover:tw-text-primary-400 tw-font-semibold tw-bg-transparent tw-border-0"
      >
        {showAllTraits ? "Show less" : "Show all"}
      </button>
    </div>
  );
};

export default MemeDropTraits;
