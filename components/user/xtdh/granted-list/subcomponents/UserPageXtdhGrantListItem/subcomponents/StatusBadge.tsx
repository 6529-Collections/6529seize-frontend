import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import type { ApiXTdhGrantStatus } from "@/generated/models/ApiXTdhGrantStatus";
import { getStatusVisuals } from "../statusVisuals";

export function StatusBadge({
  status,
  validFrom,
  validTo,
}: Readonly<{
  status: ApiXTdhGrantStatus;
  validFrom?: number | string | null | undefined;
  validTo?: number | string | null | undefined;
}>) {
  const { badgeClassName, icon, label } = getStatusVisuals(status, validFrom, validTo);

  return (
    <output
      aria-label={`${label} grant status`}
      className={clsx(
        "tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-px-2.5 tw-py-1 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wide",
        badgeClassName
      )}
    >
      <FontAwesomeIcon
        icon={icon}
        aria-hidden="true"
        className={clsx("tw-leading-none", icon === faCircle ? "tw-size-2" : "tw-size-3")}
      />
      <span>{label}</span>
    </output>
  );
}
