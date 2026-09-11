interface UserPageSubscriptionsToggleProps {
  readonly id: string;
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly onChange: () => void;
  readonly ariaLabel: string;
  readonly describedBy?: string | undefined;
}

export default function UserPageSubscriptionsToggle({
  id,
  checked,
  disabled,
  onChange,
  ariaLabel,
  describedBy,
}: UserPageSubscriptionsToggleProps) {
  const trackStateClass = checked
    ? "tw-bg-emerald-500/70 tw-shadow-[0_0_12px_rgba(16,185,129,0.12)]"
    : "tw-bg-iron-700 desktop-hover:hover:tw-bg-iron-650";
  const thumbPositionClass = checked ? "tw-translate-x-5" : "tw-translate-x-0";

  return (
    <label
      className={`tw-relative tw-inline-flex tw-min-h-11 tw-min-w-11 tw-flex-shrink-0 tw-items-center tw-rounded-full ${
        disabled ? "tw-cursor-not-allowed" : "tw-cursor-pointer"
      }`}
    >
      <span className="tw-sr-only">{ariaLabel}</span>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        className="tw-peer tw-sr-only"
      />
      <span
        aria-hidden="true"
        className={`tw-relative tw-inline-flex tw-h-6 tw-w-11 tw-items-center tw-rounded-full tw-p-1 tw-transition-all tw-duration-300 tw-ease-out peer-focus-visible:tw-ring-2 peer-focus-visible:tw-ring-primary-300 peer-focus-visible:tw-ring-offset-2 peer-focus-visible:tw-ring-offset-iron-950 motion-reduce:tw-transition-none ${trackStateClass} ${disabled ? "tw-opacity-60" : ""}`}
      >
        <span
          className={`tw-size-4 tw-rounded-full tw-bg-iron-50 tw-shadow-sm tw-transition-transform tw-duration-300 tw-ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:tw-transition-none ${thumbPositionClass}`}
        />
      </span>
    </label>
  );
}
