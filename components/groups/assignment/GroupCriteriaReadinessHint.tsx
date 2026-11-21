"use client";

import IconButton from "@/components/utils/button/IconButton";

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
      <IconButton
        type="button"
        data-tooltip-id={tooltipId}
        aria-label={t(locale, "waves.create.groups.draft.notReadyTitle")}
        size={40}
        variant="ghost"
        className="-tw-my-2"
      >
        <InformationCircleIcon aria-hidden="true" className="tw-size-5" />
      </IconButton>
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
