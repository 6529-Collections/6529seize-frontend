"use client";

import { useAuth } from "@/components/auth/Auth";
import Button from "@/components/utils/button/Button";
import { publicEnv } from "@/config/env";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useDownloader from "@/hooks/useDownloader";
import { t } from "@/i18n/messages";
import { getAuthJwt, getStagingAuth } from "@/services/auth/auth.utils";
import { sanitizeErrorForUser } from "@/utils/error-sanitizer";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect } from "react";

const getSafeCsvFilenameId = (dropId: string): string => {
  const safeId = dropId
    .replaceAll(/[/\\:*?"<>|]/g, "_")
    .replaceAll(/\s+/g, "_")
    .slice(0, 180);

  return safeId || "drop";
};

export function SingleWaveDropVotersDownload({
  dropId,
}: {
  readonly dropId: string;
}) {
  const locale = useBrowserLocale();
  const { setToast } = useAuth();
  const { download, error: downloadError, isInProgress } = useDownloader();
  const downloadUrl = `${publicEnv.API_ENDPOINT}/api/v2/drops/${encodeURIComponent(
    dropId
  )}/votes/download`;

  const buildDownloadHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {
      Accept: "text/csv",
    };
    const apiAuth = getStagingAuth();
    const walletAuth = getAuthJwt();

    if (apiAuth) {
      headers["x-6529-auth"] = apiAuth;
    }

    if (walletAuth) {
      headers["Authorization"] = `Bearer ${walletAuth}`;
    }

    return headers;
  }, []);

  useEffect(() => {
    if (!downloadError?.errorMessage) {
      return;
    }

    setToast({
      type: "error",
      title: "Couldn't download voters.",
      description: "Please try again.",
      details: sanitizeErrorForUser(downloadError.errorMessage),
    });
  }, [downloadError, setToast]);

  const onDownloadAllVotes = useCallback(async () => {
    if (isInProgress) {
      return;
    }

    const safeId = getSafeCsvFilenameId(dropId);
    await download(downloadUrl, `drop-votes-${safeId}.csv`, undefined, {
      headers: buildDownloadHeaders(),
    });
  }, [buildDownloadHeaders, download, downloadUrl, dropId, isInProgress]);

  return (
    <Button
      type="button"
      onClick={onDownloadAllVotes}
      loading={isInProgress}
      variant="tertiary"
      size={null}
      aria-label={t(locale, "waves.voteInsights.downloadAllVoters")}
      className="tw-relative tw-z-10 tw-h-8 tw-w-8 tw-p-0 tw-text-xs sm:tw-w-auto sm:tw-px-2.5"
    >
      <span className="tw-hidden sm:tw-inline">
        {t(
          locale,
          isInProgress
            ? "waves.voteInsights.downloading"
            : "waves.voteInsights.downloadAll"
        )}
      </span>
      {!isInProgress && <ArrowDownTrayIcon className="tw-size-4 sm:tw-hidden" />}
    </Button>
  );
}
