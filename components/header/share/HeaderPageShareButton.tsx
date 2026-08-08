"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { Share } from "@capacitor/share";
import { useState } from "react";
import ShareArrowIcon from "@/components/common/icons/ShareArrowIcon";
import { HeaderPageShareModal } from "./header-share/HeaderQRModal";
import type { PageShareSystemShareAdapter } from "./header-share/shareUtils";

const CAPACITOR_PAGE_SHARE_ADAPTER: PageShareSystemShareAdapter = {
  canShare: async () => {
    const result = await Share.canShare();
    return result.value;
  },
  share: async ({ title, url }) => {
    await Share.share({ title, url });
  },
};

export default function HeaderPageShareButton({
  isCapacitor,
}: {
  readonly isCapacitor: boolean;
}) {
  const locale = useBrowserLocale();
  const [showShareModal, setShowShareModal] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={t(locale, "headerPageShare.trigger.ariaLabel")}
        title={t(locale, "headerPageShare.trigger.title")}
        onClick={() => setShowShareModal(true)}
        className="tw-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-black tw-text-iron-300 tw-shadow-sm tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-50 active:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        <ShareArrowIcon className="tw-size-5 tw-flex-shrink-0" />
      </button>
      <HeaderPageShareModal
        show={showShareModal}
        onClose={() => setShowShareModal(false)}
        compact
        systemShareAdapter={
          isCapacitor ? CAPACITOR_PAGE_SHARE_ADAPTER : undefined
        }
        usePublicUrl={isCapacitor}
      />
    </>
  );
}
