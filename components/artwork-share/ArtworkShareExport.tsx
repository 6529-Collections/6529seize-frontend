import { Capacitor } from "@capacitor/core";
import { ArrowDownTrayIcon, ShareIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { useState, type ReactNode } from "react";
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
  getArtworkCaption,
  type ArtworkShareDetails,
} from "./artworkShare";
import { useArtworkExport } from "./useArtworkExport";
import ArtworkShareCopy from "./ArtworkShareCopy";

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
  controls,
  children,
}: {
  readonly artwork: ArtworkShareDetails;
  readonly format: NftSocialCardFormat;
  readonly locale: SupportedLocale;
  readonly controls?: ReactNode;
  readonly children?: ReactNode;
}) {
  const filename = getArtworkExportFilename(artwork, format);
  const { state, retry } = useArtworkExport(
    getArtworkExportUrl(artwork, format),
    filename
  );
  const [isSharing, setIsSharing] = useState(false);
  const [failedFile, setFailedFile] = useState<File>();
  const isNative = Capacitor.isNativePlatform();
  const [width, height] = DIMENSIONS[format];
  const file = state.status === "ready" ? state.file : null;
  const shareError = file !== null && failedFile === file;
  const canShareFile =
    file !== null &&
    (isNative ||
      (typeof navigator.canShare === "function" &&
        canUseSystemShare({ files: [file] })));

  const shareImage = async () => {
    if (!file || isSharing) return;
    setIsSharing(true);
    setFailedFile(undefined);
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
      if (!isShareCancelError(error)) setFailedFile(file);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="tw-grid tw-min-w-0 tw-gap-4 md:tw-grid-cols-[minmax(0,1fr)_minmax(0,18rem)] md:tw-gap-8">
      <figure className="tw-m-0 tw-flex tw-min-w-0 tw-flex-col tw-justify-center tw-gap-2 tw-rounded-lg tw-bg-black/20 tw-p-2 md:tw-gap-3 md:tw-p-5">
        <div className="tw-relative tw-flex tw-h-[min(28dvh,14rem)] tw-min-h-36 tw-items-center tw-justify-center md:tw-h-[min(56dvh,30rem)]">
          {state.status === "ready" && (
            <Image
              src={state.previewUrl}
              alt={t(locale, "artworkShare.previewAlt", {
                title: artwork.title,
              })}
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
        <figcaption className="tw-text-center tw-text-[11px] tw-leading-4 tw-text-iron-500">
          {t(locale, "artworkShare.imageDetails", { width, height })}
        </figcaption>
      </figure>
      <div className="tw-flex tw-min-w-0 tw-flex-col tw-justify-center tw-gap-3 md:tw-gap-4">
        {controls}
        <div className="tw-flex tw-min-h-11 tw-items-stretch tw-gap-2">
          {state.status === "loading" && (
            <Button variant="primary" size="lg" fullWidth disabled loading>
              {t(locale, "artworkShare.preparing")}
            </Button>
          )}
          {canShareFile && (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={isSharing}
              data-testid="artwork-image-primary"
              className="tw-flex-1"
              onClick={() => void shareImage()}
            >
              <ShareIcon className="tw-size-4 tw-shrink-0" aria-hidden="true" />
              {t(
                locale,
                isNative
                  ? "artworkShare.saveOrShare"
                  : "artworkShare.shareImage"
              )}
            </Button>
          )}
          {!isNative && state.status === "ready" && (
            <a
              href={state.previewUrl}
              download={filename}
              aria-label={t(locale, "artworkShare.download")}
              title={t(locale, "artworkShare.download")}
              data-testid={canShareFile ? undefined : "artwork-image-primary"}
              className={
                canShareFile
                  ? "tw-inline-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-text-iron-300 tw-no-underline hover:tw-bg-white/5 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
                  : getButtonClasses({
                      variant: "primary",
                      size: "lg",
                      fullWidth: true,
                      className: "tw-no-underline",
                    })
              }
            >
              <ArrowDownTrayIcon
                className="tw-size-4 tw-shrink-0"
                aria-hidden="true"
              />
              <span className={canShareFile ? "tw-sr-only" : undefined}>
                {t(locale, "artworkShare.download")}
              </span>
            </a>
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
        <div>
          <ArtworkShareCopy
            value={getArtworkCaption(artwork, locale)}
            locale={locale}
            caption
          />
          <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(locale, "artworkShare.instagramHelp")}
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
