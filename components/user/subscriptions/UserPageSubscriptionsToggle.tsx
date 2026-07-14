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
      className={`tw-relative tw-inline-flex tw-min-h-11 tw-min-w-12 tw-flex-shrink-0 tw-items-center tw-rounded-full ${
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
        className={`tw-relative tw-inline-flex tw-h-7 tw-w-12 tw-items-center tw-rounded-full tw-border tw-border-solid tw-p-0.5 tw-shadow-inner tw-transition-all tw-duration-200 peer-focus-visible:tw-ring-2 peer-focus-visible:tw-ring-primary-300 peer-focus-visible:tw-ring-offset-2 peer-focus-visible:tw-ring-offset-iron-950 ${
          checked
            ? "tw-border-primary-400/50 tw-bg-primary-500/30"
            : "tw-border-white/10 tw-bg-iron-800"
        } ${disabled ? "tw-opacity-50" : "desktop-hover:hover:tw-border-white/20"}`}
      >
        <span
          className={`tw-size-5 tw-rounded-full tw-shadow-[0_1px_3px_rgba(0,0,0,0.45)] tw-transition-all tw-duration-200 tw-ease-out ${
            checked
              ? "tw-bg-primary-100 tw-translate-x-[1.375rem]"
              : "tw-translate-x-0 tw-bg-iron-200"
          }`}
        />
      </span>
    </label>
  );
}
