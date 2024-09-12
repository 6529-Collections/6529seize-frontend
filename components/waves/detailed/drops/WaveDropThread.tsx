import React from "react";
import WaveSingleDrop from "./WaveSingleDrop";
import CreateDrop from "../CreateDrop";
import WaveDetailedDropActions from "./WaveDetailedDropActions";
import WaveDetailedDropAuthorPfp from "./WaveDetailedDropAuthorPfp";
import WaveDetailedDropContent from "./WaveDetailedDropContent";
import WaveDetailedDropHeader from "./WaveDetailedDropHeader";
import WaveDetailedDropRatings from "./WaveDetailedDropRatings";
import WaveDetailedDrop from "./WaveDetailedDrop";

interface WaveDropThreadProps {
  rootDropId: string;
  onBackToList: () => void;
}

export default function WaveDropThread({
  rootDropId,
  onBackToList,
}: WaveDropThreadProps) {
  // Add state to track the number of drops in the thread
  const [dropCount, setDropCount] = React.useState(1);

  // Function to update drop count (to be passed to child components)
  const updateDropCount = (count: number) => setDropCount(count);

  return (
    <div>
      <div className="tw-px-4 tw-pt-4">
        <button
          onClick={onBackToList}
          type="button"
          className="tw-py-2 tw-px-2 -tw-ml-2 tw-flex tw-items-center tw-gap-x-2 tw-justify-center tw-text-sm tw-font-semibold tw-border-0 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out tw-cursor-pointer tw-text-iron-400 tw-bg-transparent hover:tw-text-iron-50"
        >
          <svg
            className="tw-flex-shrink-0 tw-w-5 tw-h-5"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 12H4M4 12L10 18M4 12L10 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
          <span>Back</span>
        </button>
      </div>

      <div className="tw-relative">
        <div className="tw-absolute tw-left-9 tw-top-2 tw-bottom-0 tw-w-[1px] tw-bg-iron-700"></div>
        <WaveSingleDrop
          dropId={rootDropId}
          availableCredit={null}
          isThreaded={true}
        />
      </div>

      <div className="tw-border-t tw-border-solid tw-border-x-0 tw-border-b-0 tw-border-iron-800">
        <CreateDrop />
        {/*  <WaveDetailedDrop /> */}
      </div>
    </div>
  );
}
