import { useEffect, useState } from "react";

import { isShareCancelError } from "@/utils/error";
import {
  canUseSystemShare,
  getCurrentFullUrl,
  getCurrentPublicUrl,
  type PageShareData,
  type PageShareSystemShareAdapter,
} from "./shareUtils";

type SystemShareAvailability = {
  readonly adapter: PageShareSystemShareAdapter;
  readonly key: string;
  readonly isAvailable: boolean;
};

type SystemShareOutcome = "shared" | "cancelled" | "unavailable";

function getPageShareData(usePublicUrl: boolean): PageShareData {
  return {
    title: document.title.trim() || "6529",
    url: usePublicUrl ? getCurrentPublicUrl() : getCurrentFullUrl(),
  };
}

function getSystemShareKey({ title, url }: PageShareData): string {
  return `${title}\u0000${url}`;
}

export function useSystemShare({
  enabled,
  systemShareAdapter,
  usePublicUrl,
}: {
  readonly enabled: boolean;
  readonly systemShareAdapter?: PageShareSystemShareAdapter | undefined;
  readonly usePublicUrl: boolean;
}) {
  const [availability, setAvailability] =
    useState<SystemShareAvailability | null>(null);
  const [unavailableKey, setUnavailableKey] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const canCheck = enabled && typeof document !== "undefined";
  const shareData = canCheck ? getPageShareData(usePublicUrl) : null;
  const shareTitle = shareData?.title ?? "";
  const shareUrl = shareData?.url ?? "";
  const shareKey = shareData ? getSystemShareKey(shareData) : "";

  useEffect(() => {
    if (!systemShareAdapter || !shareKey) {
      return;
    }

    let isCurrent = true;
    void systemShareAdapter
      .canShare({ title: shareTitle, url: shareUrl })
      .then((isAvailable) => {
        if (isCurrent) {
          setAvailability({
            adapter: systemShareAdapter,
            key: shareKey,
            isAvailable,
          });
        }
      })
      .catch(() => {
        if (isCurrent) {
          setAvailability({
            adapter: systemShareAdapter,
            key: shareKey,
            isAvailable: false,
          });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [shareKey, shareTitle, shareUrl, systemShareAdapter]);

  const isUnavailable = Boolean(shareKey) && unavailableKey === shareKey;
  let isAvailable = false;
  if (shareData && !isUnavailable) {
    if (systemShareAdapter) {
      isAvailable =
        availability?.adapter === systemShareAdapter &&
        availability.key === shareKey &&
        availability.isAvailable;
    } else {
      isAvailable = canUseSystemShare(shareData);
    }
  }

  const shareCurrentPage = async (): Promise<SystemShareOutcome> => {
    if (typeof document === "undefined") {
      return "unavailable";
    }

    const currentShareData = getPageShareData(usePublicUrl);
    const currentShareKey = getSystemShareKey(currentShareData);
    const markUnavailable = () => setUnavailableKey(currentShareKey);

    setIsPending(true);
    try {
      if (systemShareAdapter) {
        if (!(await systemShareAdapter.canShare(currentShareData))) {
          markUnavailable();
          return "unavailable";
        }
        await systemShareAdapter.share(currentShareData);
        return "shared";
      }

      if (!canUseSystemShare(currentShareData)) {
        markUnavailable();
        return "unavailable";
      }

      await navigator.share(currentShareData);
      return "shared";
    } catch (error) {
      if (isShareCancelError(error)) {
        return "cancelled";
      }

      markUnavailable();
      return "unavailable";
    } finally {
      setIsPending(false);
    }
  };

  return {
    isAvailable,
    isPending,
    isUnavailable,
    shareCurrentPage,
  };
}
