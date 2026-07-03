"use client";

import { publicEnv } from "@/config/env";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCopyToClipboard } from "react-use";

const DEFAULT_FEEDBACK_TIMEOUT_MS = 1500;

type WaveLinkActionMode = "share" | "copy";
type WaveLinkActionFeedback = "idle" | "shared" | "copied";
type FeedbackForUrl = {
  readonly url: string;
  readonly value: Exclude<WaveLinkActionFeedback, "idle">;
} | null;

interface UseWaveShareCopyActionParams {
  readonly waveId: string;
  readonly waveName: string;
  readonly isDirectMessage: boolean;
  readonly feedbackTimeoutMs?: number | undefined;
  readonly showShareFeedback?: boolean | undefined;
  readonly copyOnShareFailure?: boolean | undefined;
}

interface UseWaveShareCopyActionResult {
  readonly mode: WaveLinkActionMode;
  readonly label: string;
  readonly feedbackState: WaveLinkActionFeedback;
  readonly isSharing: boolean;
  readonly onClick: () => void;
}

function getErrorName(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    typeof error.name === "string"
  ) {
    return error.name;
  }
  return "";
}

function canUseNativeShare(url: string): boolean {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.share !== "function"
  ) {
    return false;
  }

  const shareNavigator = navigator as Navigator & {
    canShare?: ((data?: ShareData) => boolean) | undefined;
  };

  if (typeof shareNavigator.canShare !== "function") {
    return true;
  }

  try {
    return shareNavigator.canShare({ url });
  } catch {
    return false;
  }
}

export function useWaveShareCopyAction({
  waveId,
  waveName,
  isDirectMessage,
  feedbackTimeoutMs = DEFAULT_FEEDBACK_TIMEOUT_MS,
  showShareFeedback = true,
  copyOnShareFailure = true,
}: UseWaveShareCopyActionParams): UseWaveShareCopyActionResult {
  const locale = useBrowserLocale();
  const feedbackTimeoutRef = useRef<number | null>(null);
  const [, copyToClipboard] = useCopyToClipboard();
  const [isSharing, setIsSharing] = useState(false);
  const isNativeApp = useMemo(() => Capacitor.isNativePlatform(), []);
  const relativeRoute = useMemo(
    () =>
      getWaveRoute({
        waveId,
        isDirectMessage,
        isApp: false,
      }),
    [waveId, isDirectMessage]
  );

  const canonicalWaveUrl = useMemo(() => {
    if (isNativeApp) {
      return `${publicEnv.BASE_ENDPOINT}${relativeRoute}`;
    }

    if (typeof window === "undefined") {
      return relativeRoute;
    }

    return `${window.location.origin}${relativeRoute}`;
  }, [isNativeApp, relativeRoute]);
  const nativeShareSupported = useMemo(
    () => isNativeApp || canUseNativeShare(canonicalWaveUrl),
    [isNativeApp, canonicalWaveUrl]
  );
  const [shareFailedUrl, setShareFailedUrl] = useState<string | null>(null);
  const [feedbackForUrl, setFeedbackForUrl] = useState<FeedbackForUrl>(null);
  const feedbackState: WaveLinkActionFeedback =
    feedbackForUrl?.url === canonicalWaveUrl ? feedbackForUrl.value : "idle";
  const mode: WaveLinkActionMode =
    nativeShareSupported && shareFailedUrl !== canonicalWaveUrl
      ? "share"
      : "copy";

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const setTemporaryFeedback = useCallback(
    (nextFeedback: Exclude<WaveLinkActionFeedback, "idle">) => {
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }

      const targetUrl = canonicalWaveUrl;
      setFeedbackForUrl({ url: targetUrl, value: nextFeedback });
      feedbackTimeoutRef.current = window.setTimeout(() => {
        setFeedbackForUrl((currentFeedback) => {
          if (currentFeedback?.url !== targetUrl) {
            return currentFeedback;
          }
          return null;
        });
        feedbackTimeoutRef.current = null;
      }, feedbackTimeoutMs);
    },
    [feedbackTimeoutMs, canonicalWaveUrl]
  );

  const handleCopy = useCallback(() => {
    copyToClipboard(canonicalWaveUrl);
    setTemporaryFeedback("copied");
  }, [copyToClipboard, canonicalWaveUrl, setTemporaryFeedback]);

  const onClick = useCallback(() => {
    if (mode !== "share") {
      handleCopy();
      return;
    }

    setIsSharing(true);
    void (async () => {
      try {
        if (isNativeApp) {
          await Share.share({ title: waveName, url: canonicalWaveUrl });
        } else if (typeof navigator.share === "function") {
          await navigator.share({ title: waveName, url: canonicalWaveUrl });
        } else {
          handleCopy();
          return;
        }
        if (showShareFeedback) {
          setTemporaryFeedback("shared");
        }
      } catch (error: unknown) {
        if (getErrorName(error) === "AbortError") {
          return;
        }

        if (!copyOnShareFailure) {
          return;
        }

        setShareFailedUrl(canonicalWaveUrl);
        handleCopy();
      } finally {
        setIsSharing(false);
      }
    })();
  }, [
    mode,
    waveName,
    canonicalWaveUrl,
    handleCopy,
    isNativeApp,
    showShareFeedback,
    copyOnShareFailure,
    setTemporaryFeedback,
  ]);

  let label: string;
  if (feedbackState === "shared") {
    label = t(locale, "headerWaveLinkAction.feedback.shared");
  } else if (feedbackState === "copied") {
    label = t(locale, "headerWaveLinkAction.feedback.copied");
  } else if (mode === "share") {
    label = t(locale, "headerWaveLinkAction.share");
  } else {
    label = t(locale, "headerWaveLinkAction.copy");
  }

  return {
    mode,
    label,
    feedbackState,
    isSharing,
    onClick,
  };
}
