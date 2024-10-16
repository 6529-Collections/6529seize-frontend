import React from "react";
import CreateDropActions from "../../waves/detailed/CreateDropActions";
import PrimaryButton from "../../utils/button/PrimaryButton";
import BrainContentPinnedWaves from "./BrainContentPinnedWaves";

interface BrainContentProps {
  children: React.ReactNode;
}

const BrainContent: React.FC<BrainContentProps> = ({ children }) => {
  return (
    <div className="tw-mt-8 tw-flex-1 tw-h-full tw-flex tw-flex-col tw-overflow-y-auto no-scrollbar">
      <BrainContentPinnedWaves />
      <div className="tw-sticky tw-top-0 tw-bg-black tw-z-40">
        <div className="tw-flex tw-rounded-xl tw-bg-iron-950 tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-p-4 tw-shadow-lg">
          <div className="tw-w-full tw-flex tw-items-center tw-gap-x-2 lg:tw-gap-x-3">
            {/* <CreateDropActions /> */}
            <input
              type="text"
              placeholder="Create a drop in Stage the Wave"
              className="tw-max-h-[40vh] editor-input-one-liner tw-resize-none tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-bg-iron-950 focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-text-sm tw-leading-6 tw-transition tw-duration-300 tw-ease-out 
            tw-pl-3 tw-py-2.5 tw-scrollbar-thin tw-scrollbar-thumb-iron-600 tw-scrollbar-track-iron-900"
            />
          </div>
          <div className="tw-ml-2 lg:tw-ml-3">
            <PrimaryButton
              loading={false}
              disabled={false}
              onClicked={() => {}}
              padding="tw-px-2.5 lg:tw-px-3.5 tw-py-2.5"
            >
              <span className="tw-hidden lg:tw-inline">Drop</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                className="tw-size-5 lg:tw-hidden"
              >
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </PrimaryButton>
          </div>
        </div>
      </div>
      <div className="tw-mt-2 tw-flex-1">
        <div>{children}</div>
      </div>
    </div>
  );
};

export default BrainContent;
