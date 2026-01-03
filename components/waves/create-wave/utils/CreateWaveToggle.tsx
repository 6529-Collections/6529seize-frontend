interface CreateWaveToggleProps {
  readonly enabled: boolean;
  readonly onChange: (enabled: boolean) => void;
  readonly label: string;
  readonly displayLabel?: boolean | undefined;
}

export default function CreateWaveToggle({
  enabled,
  onChange,
  label,
  displayLabel = false,
}: CreateWaveToggleProps) {
  return (
    <div className="tw-pl-4">
      <label className="tw-flex tw-items-center tw-cursor-pointer">
        {displayLabel && (
          <span className="tw-text-sm tw-font-medium tw-text-iron-300 tw-mr-2">
            {label}
          </span>
        )}
        <span className="tw-sr-only">{!displayLabel ? label : ""}</span>
        <div className="tw-flex tw-items-center tw-gap-x-2 sm:tw-gap-x-3">
          <div
            className={`tw-rounded-full tw-bg-gradient-to-b tw-p-[1px] ${
              enabled ? "tw-from-primary-300" : "tw-from-iron-600"
            }`}
          >
            <input
              type="checkbox"
              className="tw-sr-only"
              checked={enabled}
              onChange={(e) => onChange(e.target.checked)}
            />
            <span
              className={`tw-p-0 tw-relative tw-flex tw-items-center tw-h-5 tw-w-9 tw-flex-shrink-0 tw-cursor-pointer tw-rounded-full tw-border-2 tw-border-transparent tw-transition-colors tw-duration-200 tw-ease-in-out  
                ${
                  enabled
                    ? "tw-bg-primary-500 focus:tw-ring-2 focus-visible:tw-ring-primary-500 focus-visible:tw-ring-offset-2"
                    : "tw-bg-iron-700 focus:tw-outline-none"
                }`}
              role="switch"
              aria-checked={enabled ? "true" : "false"}
            >
              <span
                aria-hidden="true"
                className={`tw-pointer-events-none tw-inline-block tw-size-4 tw-transform tw-rounded-full tw-bg-iron-50 tw-shadow tw-ring-0 tw-transition tw-duration-200 tw-ease-in-out  ${
                  enabled ? "tw-translate-x-[18px]" : "tw-translate-x-0"
                }`}
              ></span>
            </span>
          </div>
        </div>
      </label>
    </div>
  );
}