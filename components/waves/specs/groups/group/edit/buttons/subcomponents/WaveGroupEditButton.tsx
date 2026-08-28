"use client";

import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";

export default function WaveGroupEditButton({
  disabled,
  label,
  loading,
  onClick,
}: {
  readonly disabled: boolean;
  readonly label: string;
  readonly loading: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="tw-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-300 sm:tw-size-7"
    >
      {loading ? (
        <CircleLoader />
      ) : (
        <Cog6ToothIcon aria-hidden="true" className="tw-size-5" />
      )}
    </button>
  );
}
