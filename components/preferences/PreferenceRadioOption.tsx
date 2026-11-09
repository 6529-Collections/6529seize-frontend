"use client";

/**
 * A radio row in the Preferences cards: label, one line of description and a
 * custom indicator over a visually hidden native radio input.
 */
export default function PreferenceRadioOption({
  name,
  value,
  checked,
  label,
  description,
  onChange,
}: {
  readonly name: string;
  readonly value: string;
  readonly checked: boolean;
  readonly label: string;
  readonly description: string;
  readonly onChange: () => void;
}) {
  return (
    <label className="tw-group tw-relative tw-flex tw-w-full tw-cursor-pointer tw-rounded-lg">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        aria-label={label}
        onChange={onChange}
        className="tw-peer tw-sr-only"
      />
      <span
        className={`tw-flex tw-min-h-12 tw-w-full tw-items-start tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-px-4 tw-py-3.5 tw-shadow-sm tw-shadow-black/10 tw-transition-colors tw-duration-200 peer-focus-visible:tw-ring-2 peer-focus-visible:tw-ring-primary-400 peer-focus-visible:tw-ring-offset-2 peer-focus-visible:tw-ring-offset-iron-900 peer-disabled:tw-cursor-not-allowed peer-disabled:tw-opacity-50 motion-reduce:tw-transition-none ${
          checked
            ? "tw-border-primary-500 tw-bg-primary-500/10"
            : "tw-border-iron-800 tw-bg-transparent desktop-hover:hover:tw-border-iron-700 desktop-hover:hover:tw-bg-iron-900/40"
        }`}
      >
        <span
          aria-hidden="true"
          className={`tw-mt-0.5 tw-flex tw-size-4 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-transition-colors tw-duration-200 motion-reduce:tw-transition-none ${
            checked
              ? "tw-border-primary-500 tw-bg-primary-500"
              : "tw-border-iron-500 tw-bg-transparent group-hover:tw-border-iron-400"
          }`}
        >
          <span
            className={`tw-size-1.5 tw-rounded-full tw-bg-white tw-transition-transform tw-duration-200 motion-reduce:tw-transition-none ${
              checked ? "tw-scale-100" : "tw-scale-0"
            }`}
          />
        </span>
        <span className="tw-min-w-0">
          <span
            className={`tw-block tw-text-sm tw-font-medium ${
              checked ? "tw-text-iron-50" : "tw-text-iron-200"
            }`}
          >
            {label}
          </span>
          <span
            className={`tw-mt-0.5 tw-block tw-text-xs tw-leading-5 ${
              checked ? "tw-text-primary-300" : "tw-text-iron-400"
            }`}
          >
            {description}
          </span>
        </span>
      </span>
    </label>
  );
}
