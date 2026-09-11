import { Capacitor } from "@capacitor/core";
import { ArrowDownTrayIcon, ShareIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { useState } from "react";
import { canUseSystemShare } from "@/components/header/share/header-share/shareUtils";
import type { NftSocialCardFormat } from "@/components/providers/metadata";
import Button from "@/components/utils/button/Button";
import { getButtonClasses } from "@/components/utils/button/buttonStyles";
import { shareFetchedBlobInNativeApp } from "@/helpers/capacitorBlobDownload.helpers";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { isShareCancelError } from "@/utils/error";
import {
  getArtworkExportFilename,
  getArtworkExportUrl,
  type ArtworkShareDetails,
} from "./artworkShare";
import { useArtworkExport } from "./useArtworkExport";

const DIMENSIONS = {
  landscape: [1200, 630],
  square: [1080, 1080],
  portrait: [1080, 1350],
  story: [1080, 1920],
} as const;

export default function ArtworkShareExport({
  artwork,
  format,
  locale,
}: {
  readonly artwork: ArtworkShareDetails;
  readonly format: NftSocialCardFormat;
  readonly locale: SupportedLocale;
}) {
  const filename = getArtworkExportFilename(artwork, format);
  const { state, retry } = useArtworkExport(
    getArtworkExportUrl(artwork, format),
    filename
  );
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState(false);
  const isNative = Capacitor.isNativePlatform();
  const [width, height] = DIMENSIONS[format];
  const file = state.status === "ready" ? state.file : null;
  const canShareFile =
    file !== null &&
    (isNative ||
      (typeof navigator.canShare === "function" &&
        canUseSystemShare({ files: [file] })));

  const shareImage = async () => {
    if (!file || isSharing) return;
    setIsSharing(true);
    setShareError(false);
    try {
      if (isNative) {
        await shareFetchedBlobInNativeApp(file, filename, {
          dialogTitle: t(locale, "artworkShare.saveOrShare"),
        });
      } else {
        // The PNG is already prepared: this call retains the click's user activation.
        await navigator.share({ files: [file] });
      }
    } catch (error) {
      if (!isShareCancelError(error)) setShareError(true);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-3">
      <div className="tw-flex tw-flex-wrap tw-gap-2">
        {!isNative && state.status === "ready" && (
          <a
            href={state.previewUrl}
            download={filename}
            className={getButtonClasses({
              variant: "primary",
              size: "lg",
              className: "tw-flex-1 !tw-whitespace-normal tw-no-underline",
            })}
          >
            <ArrowDownTrayIcon
              className="tw-size-4 tw-shrink-0"
              aria-hidden="true"
            />
            {t(locale, "artworkShare.download")}
          </a>
        )}
        {canShareFile && (
          <Button
            variant={isNative ? "primary" : "secondary"}
            size="lg"
            loading={isSharing}
            className="tw-flex-1 !tw-whitespace-normal"
            onClick={() => void shareImage()}
          >
            <ShareIcon className="tw-size-4 tw-shrink-0" aria-hidden="true" />
            {t(
              locale,
              isNative ? "artworkShare.saveOrShare" : "artworkShare.shareImage"
            )}
          </Button>
        )}
      </div>
      <div
        className="tw-relative tw-flex tw-max-h-[50dvh] tw-min-h-48 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg tw-bg-black/40"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        {state.status === "ready" && (
          <Image
            src={state.previewUrl}
            alt={t(locale, "artworkShare.previewAlt", { title: artwork.title })}
            width={width}
            height={height}
            unoptimized
            className="tw-absolute tw-inset-0 tw-h-full tw-w-full tw-object-contain"
          />
        )}
        {state.status === "loading" && (
          <output className="tw-m-0 tw-block tw-p-5 tw-text-center tw-text-sm tw-text-iron-300">
            {t(locale, "artworkShare.preparing")}
          </output>
        )}
        {state.status === "error" && (
          <div className="tw-flex tw-flex-col tw-items-center tw-gap-3 tw-p-5">
            <p
              role="alert"
              className="tw-m-0 tw-text-center tw-text-sm tw-text-iron-300"
            >
              {t(locale, "artworkShare.exportError")}
            </p>
            <Button variant="secondary" size="lg" onClick={retry}>
              {t(locale, "artworkShare.retry")}
            </Button>
          </div>
        )}
      </div>
      {shareError && (
        <p role="alert" className="tw-m-0 tw-text-sm tw-text-error">
          {t(
            locale,
            isNative
              ? "artworkShare.nativeShareError"
              : "artworkShare.shareError"
          )}
        </p>
      )}
    </div>
  );
}
