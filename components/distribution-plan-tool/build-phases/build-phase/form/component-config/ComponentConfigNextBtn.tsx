export default function ComponentConfigNextBtn({
  showSkip,
  onNext,
  onSkip,
}: {
  showSkip: boolean;
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="tw-mt-8 tw-flex tw-justify-end tw-space-x-4">
      {showSkip && (
        <button
          onClick={onSkip}
          type="button"
          className="tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border-2 tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
        >
          Skip
        </button>
      )}
      <button
        onClick={onNext}
        type="button"
        className="tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border-2 tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
      >
        Next
      </button>
    </div>
  );
}
