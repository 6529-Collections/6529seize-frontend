import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import {
  buildSocialShareUrls,
  canUseSystemShare,
} from "@/components/header/share/header-share/shareUtils";
import {
  FarcasterLogo,
  XLogo,
} from "@/components/header/share/header-share/SocialShareIcons";
import FacebookIcon from "@/components/user/utils/icons/FacebookIcon";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { isShareCancelError } from "@/utils/error";
import {
  getArtworkShareUrl,
  getFacebookShareUrl,
  type ArtworkShareDetails,
} from "./artworkShare";
import ArtworkShareCopy from "./ArtworkShareCopy";

const DESTINATION_CLASS =
  "tw-group tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-items-center tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-0.5 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-300 tw-no-underline hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50";
const ICON_CLASS =
  "tw-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-full tw-bg-white/5 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-transition group-hover:tw-bg-white/10 motion-reduce:tw-transition-none";

export default function ArtworkShareActions({
  artwork,
  locale,
}: {
  readonly artwork: ArtworkShareDetails;
  readonly locale: SupportedLocale;
}) {
  const url = getArtworkShareUrl(artwork);
  const shareTitle = artwork.artist?.trim()
    ? `${artwork.title} — ${artwork.artist}`
    : artwork.title;
  const social = buildSocialShareUrls({ url, title: shareTitle });
  const isNative = Capacitor.isNativePlatform();
  const shareData = { title: artwork.title, url };
  const canShareLink = isNative || canUseSystemShare(shareData);
  const [pending, setPending] = useState(false);
  const [shareError, setShareError] = useState(false);

  async function shareLink() {
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
  }

  return (
    <section
      aria-label={t(locale, "artworkShare.linkHeading")}
      className="tw-flex tw-min-w-0 tw-flex-col tw-gap-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-4 md:tw-gap-4 md:tw-pt-5"
    >
      <h3 className="tw-m-0 tw-text-xs tw-font-medium tw-text-iron-400">
        {t(locale, "artworkShare.linkHeading")}
      </h3>
      <div className="tw-flex tw-items-start tw-gap-2">
        <a
          href={social.x}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t(locale, "artworkShare.x")}
          className={DESTINATION_CLASS}
        >
          <span className={ICON_CLASS}>
            <XLogo className="tw-size-4" />
          </span>
          <span>X</span>
        </a>
        <a
          href={getFacebookShareUrl(url)}
          target="_blank"
          rel="noopener noreferrer"
          className={DESTINATION_CLASS}
        >
          <span className={ICON_CLASS}>
            <span className="tw-size-5 tw-grayscale" aria-hidden="true">
              <FacebookIcon />
            </span>
          </span>
          <span>{t(locale, "artworkShare.facebook")}</span>
        </a>
        <a
          href={social.farcaster}
          target="_blank"
          rel="noopener noreferrer"
          className={DESTINATION_CLASS}
        >
          <span className={ICON_CLASS}>
            <FarcasterLogo className="tw-size-5" />
          </span>
          <span>{t(locale, "artworkShare.farcaster")}</span>
        </a>
        {canShareLink && (
          <button
            type="button"
            className={DESTINATION_CLASS}
            disabled={pending}
            aria-busy={pending}
            onClick={() => void shareLink()}
          >
            <span className={ICON_CLASS}>
              <EllipsisHorizontalIcon
                className="tw-size-5"
                aria-hidden="true"
              />
            </span>
            <span>{t(locale, "artworkShare.more")}</span>
          </button>
        )}
      </div>
      {shareError && (
        <p
          role="alert"
          className="tw-m-0 tw-text-xs tw-leading-5 tw-text-error"
        >
          {t(locale, "artworkShare.linkShareError")}
        </p>
      )}
      <ArtworkShareCopy value={url} locale={locale} />
    </section>
  );
}
