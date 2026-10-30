"use client";

import { useId } from "react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import BodyPortalTooltip from "@/components/utils/tooltip/BodyPortalTooltip";
import { buildTooltipId, TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function GroupCriteriaReadinessHint() {
  const locale = useBrowserLocale();
  const tooltipId = buildTooltipId("group-criteria-readiness", useId());
  return (
    <>
      <button
        type="button"
        data-tooltip-id={tooltipId}
        aria-label={t(locale, "waves.create.groups.draft.notReadyTitle")}
        className="-tw-my-2 tw-flex tw-size-10 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        <InformationCircleIcon aria-hidden="true" className="tw-size-5" />
      </button>
      <BodyPortalTooltip
        id={tooltipId}
        place="top-end"
        className="tailwind-scope"
        opacity={1}
        clickable
        style={{ ...TOOLTIP_STYLES, pointerEvents: "auto" }}
        openEvents={{ mouseenter: true, focus: true, click: true }}
        closeEvents={{ mouseleave: true, blur: true }}
        globalCloseEvents={{
          escape: true,
          clickOutsideAnchor: true,
        }}
      >
        <div className="tw-w-64 tw-max-w-[calc(100vw-3rem)] tw-space-y-1 tw-p-2 tw-text-left tw-leading-5">
          <p className="tw-m-0 tw-font-semibold">
            {t(locale, "waves.create.groups.draft.notReadyTitle")}
          </p>
          <p className="tw-m-0 tw-font-normal">
            {t(locale, "waves.create.groups.draft.notReadyDescription")}
          </p>
        </div>
      </BodyPortalTooltip>
    </>
  );
}
