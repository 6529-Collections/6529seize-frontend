"use client";

import ShareArrowIcon from "@/components/common/icons/ShareArrowIcon";
import { canUseSystemShare } from "@/components/header/share/header-share/shareUtils";
import { showAppToast } from "@/components/utils/toast/AppToast";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getOpenedDropLink } from "@/helpers/waves/drop-copy-link.helpers";
import { isWaveDirectMessage } from "@/helpers/waves/wave.helpers";
import { useDropClipboardCopyFeedback } from "@/hooks/drops/useDropClipboardCopyFeedback";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { isShareCancelError } from "@/utils/error";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { useState } from "react";

export default function SingleWaveDropShare({
  drop,
  wave,
}: {
  readonly drop: ApiDrop;
  readonly wave: ApiWave;
}) {
  const locale = useBrowserLocale();
  const { statusMessage, copyToClipboard } = useDropClipboardCopyFeedback();
  const [isSharing, setIsSharing] = useState(false);

  if (!drop.id.trim() || drop.id.startsWith("temp-") || !drop.wave.id.trim()) {
    return null;
  }

  const shareDrop = async () => {
    if (isSharing) return;

    const url = getOpenedDropLink({
      drop,
      isDirectMessage: isWaveDirectMessage(wave.id, wave),
    });
    const shareData = { url };
    const copyLink = () => copyToClipboard(() => url);

    setIsSharing(true);
    try {
      if (Capacitor.isNativePlatform()) {
        if (!(await Share.canShare()).value) {
          await copyLink();
          return;
        }
        await Share.share(shareData);
      } else if (canUseSystemShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await copyLink();
        return;
      }
      showAppToast({
        type: "success",
        title: t(locale, "singleDrop.shared"),
      });
    } catch (error: unknown) {
      if (!isShareCancelError(error)) await copyLink();
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label={t(locale, "singleDrop.shareLabel")}
        disabled={isSharing}
        aria-busy={isSharing}
        onClick={() => void shareDrop()}
        className="tw-flex tw-min-h-11 tw-min-w-11 tw-items-center tw-justify-center tw-gap-2 tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-300 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-wait disabled:tw-opacity-70 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-200 motion-reduce:tw-transition-none sm:tw-min-h-0 sm:tw-rounded-lg"
      >
        <ShareArrowIcon className="tw-size-5 tw-shrink-0 sm:tw-size-4" />
        <span>{statusMessage || t(locale, "singleDrop.share")}</span>
      </button>
      <span role="status" aria-live="polite" className="tw-sr-only">
        {statusMessage}
      </span>
    </>
  );
}
