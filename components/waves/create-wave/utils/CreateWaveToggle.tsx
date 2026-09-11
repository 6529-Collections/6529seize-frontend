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
    <div>
      <label className="tw-flex tw-min-h-6 tw-cursor-pointer tw-items-center tw-gap-2">
        <input
          type="checkbox"
          role="switch"
          className="tw-peer tw-sr-only"
          checked={enabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        {displayLabel && (
          <span className="tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-300">
            {label}
          </span>
        )}
        <span className="tw-sr-only">{!displayLabel ? label : ""}</span>
        <span className="tw-flex tw-items-center">
          <span
            aria-hidden="true"
            className={`tw-rounded-full tw-bg-gradient-to-b tw-p-[1px] peer-focus-visible:tw-ring-2 peer-focus-visible:tw-ring-primary-500 peer-focus-visible:tw-ring-offset-2 peer-focus-visible:tw-ring-offset-iron-950 ${
              enabled ? "tw-from-primary-300" : "tw-from-iron-600"
            }`}
          >
            <span
              className={`tw-relative tw-flex tw-h-5 tw-w-9 tw-flex-shrink-0 tw-cursor-pointer tw-items-center tw-rounded-full tw-border-2 tw-border-transparent tw-p-0 tw-transition-colors tw-duration-200 tw-ease-in-out ${
                enabled ? "tw-bg-primary-500" : "tw-bg-iron-700"
              }`}
            >
              <span
                aria-hidden="true"
                className={`tw-pointer-events-none tw-inline-block tw-size-4 tw-transform tw-rounded-full tw-bg-iron-50 tw-shadow tw-ring-0 tw-transition tw-duration-200 tw-ease-in-out ${
                  enabled ? "tw-translate-x-[18px]" : "tw-translate-x-0"
                }`}
              ></span>
            </span>
          </span>
        </span>
      </label>
    </div>
  );
}
