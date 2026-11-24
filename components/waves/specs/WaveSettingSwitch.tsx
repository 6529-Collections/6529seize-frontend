"use client";

import { Switch } from "@headlessui/react";

export default function WaveSettingSwitch({
  label,
  checked,
  disabled,
  onChange,
}: {
  readonly label: string;
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly onChange: (checked: boolean) => void;
}) {
  return (
    <Switch
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      className="tw-group tw-flex tw-min-h-12 tw-w-full tw-items-center tw-justify-between tw-gap-4 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2 tw-py-2 tw-text-left tw-text-sm tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50"
    >
      <span>{label}</span>
      <span
        aria-hidden="true"
        className="tw-flex tw-h-7 tw-w-12 tw-shrink-0 tw-items-center tw-rounded-full tw-bg-iron-700 tw-p-0.5 tw-transition-colors group-data-[checked]:tw-bg-primary-500 motion-reduce:tw-transition-none"
      >
        <span className="tw-size-6 tw-rounded-full tw-bg-white tw-shadow-sm tw-transition-transform group-data-[checked]:tw-translate-x-5 motion-reduce:tw-transition-none" />
      </span>
    </Switch>
  );
}
