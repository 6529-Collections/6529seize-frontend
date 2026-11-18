"use client";

import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import IconButton from "@/components/utils/button/IconButton";

export default function WaveGroupEditButton({
  disabled,
  label,
  loading,
  onClick,
  expanded,
  controls,
}: {
  readonly disabled: boolean;
  readonly label: string;
  readonly loading: boolean;
  readonly onClick: (trigger: HTMLButtonElement) => void;
  readonly expanded?: boolean;
  readonly controls?: string | undefined;
}) {
  return (
    <IconButton
      type="button"
      layout="edit-group"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(event) => onClick(event.currentTarget)}
      aria-expanded={expanded}
      aria-controls={controls}
    >
      {loading ? (
        <CircleLoader />
      ) : (
        <Cog6ToothIcon aria-hidden="true" className="tw-size-5" />
      )}
    </IconButton>
  );
}
