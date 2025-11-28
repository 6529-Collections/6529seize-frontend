import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ApiTdhGrantStatus } from "@/generated/models/ApiTdhGrantStatus";
import { getStatusVisuals } from "../statusVisuals";

export function StatusBadge({
  status,
}: Readonly<{
  status: ApiTdhGrantStatus;
}>) {
  const { badgeClassName, icon, label } = getStatusVisuals(status);

  return (
    <output
      aria-label={`${label} grant status`}
      className={clsx(
        "tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-px-3 tw-py-1 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wide tw-transition-colors tw-duration-200",
        badgeClassName
      )}
    >
      <FontAwesomeIcon
        icon={icon}
        aria-hidden="true"
        className="tw-text-base tw-leading-none tw-drop-shadow-sm"
      />
      <span>{label}</span>
    </output>
  );
}
