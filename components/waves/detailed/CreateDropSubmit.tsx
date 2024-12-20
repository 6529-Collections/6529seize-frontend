import React from "react";
import PrimaryButton from "../../utils/button/PrimaryButton";

interface CreateDropSubmitProps {
  readonly submitting: boolean;
  readonly canSubmit: boolean;
  readonly isDropMode: boolean;
  readonly onDrop: () => void;
}

export const CreateDropSubmit: React.FC<CreateDropSubmitProps> = ({
  submitting,
  canSubmit,
  isDropMode,
  onDrop,
}) => {
  return (
    <PrimaryButton
      onClicked={onDrop}
      loading={submitting}
      disabled={!canSubmit}
      padding="tw-px-2.5 lg:tw-px-3.5 tw-py-2.5 tw-max-w-[3.875rem]"
    >
      <span className="tw-hidden lg:tw-inline">{isDropMode ? "Drop" : "Post"}</span>
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
  );
};
