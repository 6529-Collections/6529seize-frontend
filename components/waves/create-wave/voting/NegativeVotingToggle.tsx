interface NegativeVotingToggleProps {
  readonly allowNegativeVotes: boolean;
  readonly onChange: (allowNegativeVotes: boolean) => void;
  readonly isDisabled?: boolean | undefined;
}

export default function NegativeVotingToggle({
  allowNegativeVotes,
  onChange,
  isDisabled = true,
}: NegativeVotingToggleProps) {
  const handleToggle = () => {
    if (!isDisabled) {
      onChange(!allowNegativeVotes);
    }
  };

  return (
    <div className="tw-mt-6 tw-border-t tw-border-iron-700 tw-pt-6">
      <div className="tw-flex tw-items-center tw-mb-4">
        <h3 className="tw-text-lg tw-font-semibold tw-text-iron-50 tw-mb-0 tw-mr-4">
          Allow Negative Votes
        </h3>
        <div className="tw-relative tw-inline-block tw-w-12 tw-align-middle tw-select-none">
          <input
            disabled={isDisabled}
            type="checkbox"
            id="toggle-negative-votes"
            checked={allowNegativeVotes}
            onChange={handleToggle}
            className="tw-sr-only"
            aria-labelledby="negative-votes-label"
          />
          <label
            id="negative-votes-label"
            htmlFor="toggle-negative-votes"
            className={`tw-block tw-overflow-hidden tw-h-6 tw-rounded-full ${
              isDisabled ? "tw-cursor-not-allowed tw-opacity-70" : "tw-cursor-pointer"
            } ${
              allowNegativeVotes ? "tw-bg-blue-600" : "tw-bg-iron-700"
            }`}
            aria-hidden="true"
          >
            <span
              className={`tw-block tw-h-6 tw-w-6 tw-rounded-full tw-bg-white tw-transform tw-transition-transform ${
                allowNegativeVotes ? "tw-translate-x-6" : "tw-translate-x-0"
              } ${isDisabled ? "tw-opacity-70" : ""}`}
            ></span>
          </label>
        </div>
      </div>
      <p className={`tw-text-iron-400 tw-mb-4 ${isDisabled ? "tw-opacity-70" : ""}`}>
        {allowNegativeVotes
          ? "Users can submit negative votes for drops. This allows for more nuanced voting but may lead to more contentious results."
          : "Only positive votes are allowed. This encourages constructive voting and simplifies the voting dynamics."}
        {isDisabled && " This setting cannot be changed."}
      </p>
    </div>
  );
}
