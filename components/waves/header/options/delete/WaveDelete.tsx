"use client";

import clsx from "clsx";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function WaveDelete({
  isMobile = false,
  onDeleteRequest,
}: {
  readonly isMobile?: boolean | undefined;
  readonly onDeleteRequest: () => void;
}) {
  const locale = useBrowserLocale();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onDeleteRequest();
      }}
      className={clsx(
        "tw-flex tw-w-full tw-items-center tw-border-none tw-bg-transparent tw-text-left tw-text-red tw-transition tw-duration-200 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400",
        isMobile
          ? "tw-min-h-12 tw-rounded-xl tw-px-4 tw-py-3 tw-text-base tw-font-semibold active:tw-bg-iron-800"
          : "tw-px-3 tw-py-1 tw-text-sm tw-leading-6 hover:tw-bg-iron-800"
      )}
      role={isMobile ? undefined : "menuitem"}
      tabIndex={isMobile ? undefined : -1}
      id="options-menu-0-item-0"
    >
      {t(locale, "waves.header.ownerOptionsDelete")}
    </button>
  );
}
