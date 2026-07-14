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
        aria-describedby={describedBy}
        className="tw-peer tw-sr-only"
      />
      <span
        aria-hidden="true"
        className={`tw-relative tw-inline-flex tw-h-6 tw-w-12 tw-items-center tw-rounded-full tw-p-1 tw-ring-1 tw-ring-inset tw-transition-all tw-duration-300 tw-ease-out peer-focus-visible:tw-ring-2 peer-focus-visible:tw-ring-primary-300 peer-focus-visible:tw-ring-offset-2 peer-focus-visible:tw-ring-offset-iron-950 motion-reduce:tw-transition-none ${
          checked
            ? "tw-bg-primary-500 tw-shadow-[0_0_18px_rgba(64,106,254,0.18)] tw-ring-primary-300/50"
            : "tw-bg-white/10 tw-ring-white/10"
        } ${disabled ? "tw-opacity-50" : "desktop-hover:hover:tw-ring-white/20"}`}
      >
        <span
          className={`tw-size-4 tw-rounded-full tw-bg-iron-50 tw-shadow-[0_2px_6px_rgba(0,0,0,0.45)] tw-transition-transform tw-duration-300 tw-ease-out motion-reduce:tw-transition-none ${
            checked ? "tw-translate-x-6" : "tw-translate-x-0"
          }`}
        />
      </span>
    </label>
  );
}
