"use client";

/** An accessible on/off switch row used by the preferences settings. */
export default function PreferenceToggle({
  id,
  checked,
  label,
  description,
  onChange,
}: {
  readonly id: string;
  readonly checked: boolean;
  readonly label: string;
  readonly description?: string | undefined;
  readonly onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="tw-group tw-relative tw-flex tw-min-h-12 tw-w-full tw-cursor-pointer tw-items-center tw-justify-between tw-gap-4 tw-rounded-lg tw-px-4 tw-py-3 tw-transition-colors tw-duration-200 desktop-hover:hover:tw-bg-iron-800/30 motion-reduce:tw-transition-none"
    >
      <span className="tw-min-w-0">
        <span className="tw-block tw-text-sm tw-font-medium tw-text-iron-300">
          {label}
        </span>
        {description && (
          <span className="tw-mt-0.5 tw-block tw-text-xs tw-leading-5 tw-text-iron-400">
            {description}
          </span>
        )}
      </span>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="tw-peer tw-sr-only"
      />
      <span
        aria-hidden="true"
        className={`tw-relative tw-flex tw-h-6 tw-w-11 tw-flex-shrink-0 tw-items-center tw-rounded-full tw-border tw-border-solid tw-p-0.5 tw-transition-colors tw-duration-200 peer-focus-visible:tw-ring-2 peer-focus-visible:tw-ring-primary-400 peer-focus-visible:tw-ring-offset-2 peer-focus-visible:tw-ring-offset-iron-900 peer-disabled:tw-opacity-50 motion-reduce:tw-transition-none ${
          checked
            ? "tw-border-emerald-400/60 tw-bg-emerald-500"
            : "tw-border-iron-600 tw-bg-iron-700"
        }`}
      >
        <span
          className={`tw-size-5 tw-rounded-full tw-bg-iron-50 tw-shadow-sm tw-transition-transform tw-duration-200 motion-reduce:tw-transition-none ${
            checked ? "tw-translate-x-5" : "tw-translate-x-0"
          }`}
        />
      </span>
    </label>
  );
}
