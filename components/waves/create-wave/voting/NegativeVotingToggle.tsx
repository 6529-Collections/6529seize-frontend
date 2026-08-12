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
    <section className="tw-mt-6 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-700 tw-pt-6">
      <div className="tw-flex tw-items-center tw-gap-3">
        <h3
          id="negative-votes-label"
          className="tw-m-0 tw-text-lg tw-font-semibold tw-leading-6 tw-text-iron-100"
        >
          Allow Negative Votes
        </h3>
        <label
          htmlFor="toggle-negative-votes"
          className={`tw-flex tw-min-h-6 tw-items-center ${
            isDisabled ? "tw-cursor-not-allowed" : "tw-cursor-pointer"
          }`}
        >
          <input
            disabled={isDisabled}
            type="checkbox"
            id="toggle-negative-votes"
            checked={allowNegativeVotes}
            onChange={handleToggle}
            className="tw-peer tw-sr-only"
            aria-labelledby="negative-votes-label"
            aria-describedby="negative-votes-description"
          />
          <span
            aria-hidden="true"
            className={`tw-rounded-full tw-bg-gradient-to-b tw-p-[1px] peer-focus-visible:tw-ring-2 peer-focus-visible:tw-ring-primary-500 peer-focus-visible:tw-ring-offset-2 peer-focus-visible:tw-ring-offset-iron-950 peer-disabled:tw-opacity-70 ${
              allowNegativeVotes ? "tw-from-primary-300" : "tw-from-iron-600"
            }`}
          >
            <span
              className={`tw-relative tw-flex tw-h-5 tw-w-9 tw-flex-shrink-0 tw-items-center tw-rounded-full tw-border-2 tw-border-transparent tw-p-0 tw-transition-colors tw-duration-200 tw-ease-in-out motion-reduce:tw-transition-none ${
                allowNegativeVotes ? "tw-bg-primary-500" : "tw-bg-iron-700"
              }`}
            >
              <span
                className={`tw-pointer-events-none tw-inline-block tw-size-4 tw-transform tw-rounded-full tw-bg-iron-50 tw-shadow tw-ring-0 tw-transition tw-duration-200 tw-ease-in-out motion-reduce:tw-transition-none ${
                  allowNegativeVotes
                    ? "tw-translate-x-[18px]"
                    : "tw-translate-x-0"
                }`}
              />
            </span>
          </span>
        </label>
      </div>
      <p
        id="negative-votes-description"
        className={`tw-m-0 tw-mt-1 tw-text-pretty tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400 ${
          isDisabled ? "tw-opacity-70" : ""
        }`}
      >
        {allowNegativeVotes
          ? "Users can submit negative votes for drops. This allows for more nuanced voting but may lead to more contentious results."
          : "Only positive votes are allowed. This encourages constructive voting and simplifies the voting dynamics."}
        {isDisabled && " This setting cannot be changed."}
      </p>
    </section>
  );
}
