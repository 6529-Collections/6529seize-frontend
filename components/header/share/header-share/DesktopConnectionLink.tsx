import { faExternalLink } from "@fortawesome/free-solid-svg-icons";
import FontAwesomeSvgIcon from "@/components/common/icons/FontAwesomeSvgIcon";
import Image from "next/image";
import { t } from "@/i18n/messages";
import { HEADER_SHARE_LOCALE, squareStyle } from "./constants";

export function DesktopConnectionLink({ url }: { readonly url: string }) {
  return (
    <a
      data-testid="desktop-connection-panel"
      href={url}
      className="tw-group tw-flex tw-h-full tw-w-full tw-flex-col tw-items-center tw-justify-center tw-gap-5 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/50 tw-p-4 tw-text-center tw-no-underline tw-transition-colors hover:tw-border-iron-500 hover:tw-bg-iron-900 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-300"
      style={squareStyle}
    >
      <Image
        unoptimized
        priority
        loading="eager"
        src="/6529Core.png"
        alt={t(HEADER_SHARE_LOCALE, "headerShare.core.alt")}
        width={124}
        height={124}
        className="tw-unselectable"
      />
      <span className="tw-inline-flex tw-items-center tw-justify-center tw-gap-2 tw-rounded-md tw-border tw-border-solid tw-border-iron-200 tw-bg-iron-50 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-900 tw-transition-colors group-hover:tw-border-white group-hover:tw-bg-white group-hover:tw-text-black">
        <FontAwesomeSvgIcon icon={faExternalLink} aria-hidden="true" />
        <span className="tw-whitespace-nowrap">
          {t(HEADER_SHARE_LOCALE, "headerShare.core.open")}
        </span>
      </span>
    </a>
  );
}
