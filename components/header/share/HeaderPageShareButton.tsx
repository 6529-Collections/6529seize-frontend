"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { Share } from "@capacitor/share";
import ShareArrowIcon from "@/components/common/icons/ShareArrowIcon";
import IconButton from "@/components/utils/button/IconButton";
import { showAppToast } from "@/components/utils/toast/AppToast";
import type { PageShareSystemShareAdapter } from "./header-share/shareUtils";
import { useSystemShare } from "./header-share/useSystemShare";

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
  const { isPending, shareCurrentPage } = useSystemShare({
    enabled: true,
    systemShareAdapter: isCapacitor ? CAPACITOR_PAGE_SHARE_ADAPTER : undefined,
    usePublicUrl: isCapacitor,
  });

  const sharePage = async () => {
    const outcome = await shareCurrentPage();
    if (outcome === "unavailable") {
      showAppToast({
        type: "error",
        message: t(locale, "headerShare.social.systemShareUnavailable"),
      });
    }
  };

  return (
    <IconButton
      type="button"
      variant="contrast"
      size={36}
      pending={isPending}
      aria-label={t(locale, "headerPageShare.trigger.ariaLabel")}
      title={t(locale, "headerPageShare.trigger.title")}
      onClick={() => void sharePage()}
      disabled={isPending}
      aria-busy={isPending ? "true" : undefined}
    >
      <ShareArrowIcon
        className="tw-size-5 tw-flex-shrink-0"
        aria-hidden="true"
      />
    </IconButton>
  );
}
