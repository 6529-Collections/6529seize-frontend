interface CreateWaveToggleProps {
  readonly enabled: boolean;
  readonly onChange: (enabled: boolean) => void;
  readonly label: string;
  readonly displayLabel?: boolean | undefined;
  readonly variant?: "default" | "decision" | "decision-media";
  readonly disabled?: boolean;
  readonly id?: string;
  readonly describedBy?: string;
  readonly checkboxClassName?: string;
}

export default function CreateWaveToggle({
  enabled,
  onChange,
  label,
  displayLabel = false,
  variant = "default",
  disabled = false,
  id,
  describedBy,
  checkboxClassName,
}: CreateWaveToggleProps) {
  const decisionEditor = variant !== "default";
  const rowClasses = {
    default: "tw-flex tw-min-h-6 tw-cursor-pointer tw-items-center tw-gap-2",
    decision:
      "tw-relative tw-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-justify-between tw-gap-3 md:tw-justify-start",
    "decision-media":
      "tw-relative tw-flex tw-min-h-8 tw-cursor-pointer tw-items-center tw-justify-between tw-gap-3 md:tw-min-h-10",
  };
  const labelClasses = {
    default: "tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-300",
    decision: "tw-text-sm tw-font-medium tw-text-iron-200",
    "decision-media": "tw-min-w-0 tw-text-sm tw-font-medium tw-text-iron-300",
  };
  return (
    <div className={variant === "decision-media" ? "tw-w-full" : undefined}>
      <label className={rowClasses[variant]}>
        <input
          id={id}
          disabled={disabled}
          aria-describedby={describedBy}
          type="checkbox"
          role={decisionEditor ? undefined : "switch"}
          className={
            decisionEditor
              ? `tw-peer max-md:tw-absolute max-md:tw-inset-0 max-md:tw-z-10 max-md:tw-m-0 max-md:tw-h-full max-md:tw-w-full max-md:tw-cursor-pointer max-md:tw-opacity-0 ${checkboxClassName ?? ""}`
              : "tw-peer tw-sr-only"
          }
          checked={enabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        {displayLabel && <span className={labelClasses[variant]}>{label}</span>}
        <span className="tw-sr-only">{!displayLabel ? label : ""}</span>
        <span
          className={
            decisionEditor
              ? "tw-flex tw-shrink-0 tw-items-center peer-focus-visible:tw-ring-2 peer-focus-visible:tw-ring-primary-400 peer-focus-visible:tw-ring-offset-2 peer-focus-visible:tw-ring-offset-iron-950 peer-disabled:tw-opacity-50 md:tw-hidden"
              : "tw-flex tw-items-center"
          }
        >
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
