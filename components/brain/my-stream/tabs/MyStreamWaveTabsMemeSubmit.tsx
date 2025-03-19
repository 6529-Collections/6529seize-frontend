import React from "react";
import PrimaryButton from "../../../utils/button/PrimaryButton";

interface MyStreamWaveTabsMemeSubmitProps {
  readonly handleMemesSubmit: () => void;
}

const MyStreamWaveTabsMemeSubmit: React.FC<MyStreamWaveTabsMemeSubmitProps> = ({
  handleMemesSubmit,
}) => {
  return (
    <PrimaryButton
      loading={false}
      disabled={false}
      onClicked={handleMemesSubmit}
      padding="tw-px-2.5 tw-py-2"
    >
      <svg
        className="tw-w-5 tw-h-5 tw-flex-shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.5 12H16.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 7.5V16.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>Submit Art for The Memes</span>
    </PrimaryButton>
  );
};

export default MyStreamWaveTabsMemeSubmit;
