import React from "react";

interface BrainLeftSidebarViewChangeProps {}

export const BrainLeftSidebarViewChange: React.FC<
  BrainLeftSidebarViewChangeProps
> = () => {
  return (
    <div className="tw-flex tw-justify-center tw-items-center tw-p-1 tw-gap-1 tw-w-full tw-h-11 tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-800 tw-rounded-[10px]">
      <button className="tw-border-0 tw-flex tw-justify-center tw-items-center tw-px-3 tw-py-2 tw-gap-2 tw-flex-1 tw-h-9 tw-bg-iron-800 tw-rounded-md">
        <span className="tw-font-inter tw-font-semibold tw-text-sm tw-text-iron-300">
          My Stream
        </span>
      </button>
      <button className="tw-border-0 tw-bg-iron-950 tw-flex tw-justify-center tw-items-center tw-px-3 tw-py-2 tw-gap-2 tw-flex-1 tw-h-9 tw-rounded-md">
        <span className="tw-font-inter tw-font-semibold tw-text-sm tw-text-iron-400">
          Notifications
        </span>
        <span className="tw-size-2 -tw-mt-2 -tw-ml-0.5 tw-bg-red tw-rounded-full"></span>
      </button>
    </div>
  );
};
