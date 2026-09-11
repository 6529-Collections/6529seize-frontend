import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import {
  ClipboardDocumentIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import {
  buildSocialShareUrls,
  canUseSystemShare,
} from "@/components/header/share/header-share/shareUtils";
import {
  FarcasterLogo,
  XLogo,
} from "@/components/header/share/header-share/SocialShareIcons";
import Button from "@/components/utils/button/Button";
import { getButtonClasses } from "@/components/utils/button/buttonStyles";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { isShareCancelError } from "@/utils/error";
import {
  getArtworkCaption,
  getArtworkShareUrl,
  getFacebookShareUrl,
  type ArtworkShareDetails,
} from "./artworkShare";

function CopyButton({
  value,
  caption = false,
  locale,
}: {
  readonly value: string;
  readonly caption?: boolean;
  readonly locale: SupportedLocale;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  };
  return (
    <div>
      <Button
        variant="secondary"
        size="lg"
        fullWidth
        onClick={() => void copy()}
        className="!tw-whitespace-normal"
      >
        <ClipboardDocumentIcon
          className="tw-size-4 tw-shrink-0"
          aria-hidden="true"
        />
        {t(
          locale,
          caption ? "artworkShare.copyCaption" : "artworkShare.copyLink"
        )}
      </Button>
      <p
        role="status"
        className="tw-mb-0 tw-mt-1 tw-min-h-5 tw-text-xs tw-text-iron-300"
      >
        {status === "copied" && t(locale, "artworkShare.copied")}
        {status === "error" && t(locale, "artworkShare.copyError")}
      </p>
    </div>
  );
}

export default function ArtworkShareActions({
  artwork,
  locale,
}: {
  readonly artwork: ArtworkShareDetails;
  readonly locale: SupportedLocale;
}) {
  const url = getArtworkShareUrl(artwork);
  const caption = getArtworkCaption(artwork, locale);
  const shareTitle = artwork.artist?.trim()
    ? `${artwork.title} — ${artwork.artist}`
    : artwork.title;
  const social = buildSocialShareUrls({ url, title: shareTitle });
  const isNative = Capacitor.isNativePlatform();
  const shareData = { title: artwork.title, url };
  const canShareLink = isNative || canUseSystemShare(shareData);
  const [pending, setPending] = useState(false);
  const [shareError, setShareError] = useState(false);
  const shareLink = async () => {
    if (pending) return;
    setPending(true);
    setShareError(false);
    try {
      if (isNative) await Share.share(shareData);
      else await navigator.share(shareData);
    } catch (error) {
      if (!isShareCancelError(error)) setShareError(true);
    } finally {
      setPending(false);
    }
  };
  const linkClass = getButtonClasses({
    variant: "secondary",
    size: "lg",
    className: "!tw-whitespace-normal tw-no-underline",
  });
  return (
    <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-4">
      <div className="tw-grid tw-grid-cols-2 tw-gap-2">
        <a
          href={social.x}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          <XLogo className="tw-size-4 tw-shrink-0" />
          {t(locale, "artworkShare.x")}
        </a>
        <a
          href={getFacebookShareUrl(url)}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          {t(locale, "artworkShare.facebook")}
        </a>
        <a
          href={social.farcaster}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          <FarcasterLogo className="tw-size-4 tw-shrink-0" />
          {t(locale, "artworkShare.farcaster")}
        </a>
        {canShareLink && (
          <Button
            variant="secondary"
            size="lg"
            loading={pending}
            className="!tw-whitespace-normal"
            onClick={() => void shareLink()}
          >
            <EllipsisHorizontalIcon
              className="tw-size-4 tw-shrink-0"
              aria-hidden="true"
            />
            {t(locale, "artworkShare.more")}
          </Button>
        )}
      </div>
      {shareError && (
        <p role="alert" className="tw-m-0 tw-text-sm tw-text-error">
          {t(locale, "artworkShare.linkShareError")}
        </p>
      )}
      <div className="tw-grid tw-grid-cols-2 tw-gap-2">
        <CopyButton value={url} locale={locale} />
        <CopyButton value={caption} caption locale={locale} />
      </div>
      <label className="tw-flex tw-min-w-0 tw-flex-col tw-gap-2 tw-text-sm tw-font-medium tw-text-iron-200">
        {t(locale, "artworkShare.captionLabel")}
        <textarea
          value={caption}
          readOnly
          rows={5}
          onFocus={(event) => event.currentTarget.select()}
          className="tw-w-full tw-resize-y tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-3 tw-text-sm tw-font-normal tw-leading-6 tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        />
      </label>
      <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(locale, "artworkShare.instagramHelp")}
      </p>
    </div>
  );
}
