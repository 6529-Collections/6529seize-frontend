import { useEffect, useState } from "react";

export default function ComponentConfigNextBtn({
  showSkipBtn,
  showNextBtn,
  onNext,
  onSkip,
  isDisabled,
}: {
  showSkipBtn: boolean;
  showNextBtn: boolean;
  onNext: () => void;
  onSkip: () => void;
  isDisabled: boolean;
}) {
  const [buttonClasses, setButtonClasses] = useState(
    "tw-relative tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
  );

  useEffect(() => {
    if (isDisabled) {
      setButtonClasses(
        "tw-relative tw-bg-neutral-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-neutral-500 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
      );
    } else {
      setButtonClasses(
        "tw-relative tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
      );
    }
  }, [isDisabled]);

  return (
    <div className="tw-mt-8 tw-flex tw-justify-end tw-space-x-4">
      {showSkipBtn && (
        <button
          onClick={onSkip}
          type="button"
          className="tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border-2 tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
        >
          Skip
        </button>
      )}
      {showNextBtn && (
        <button
          disabled={isDisabled}
          onClick={onNext}
          type="button"
          className={buttonClasses}
        >
          Next
        </button>
      )}
    </div>
  );
}
