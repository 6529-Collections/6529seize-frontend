import { enterArtFullScreen } from "@/helpers/Helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useFullScreenSupported } from "@/hooks/useFullScreenSupported";
import { t } from "@/i18n/messages";
import { faExpandAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useMemo } from "react";
import { nftNavigationQuery } from "./nft-navigation-query";

interface SearchParamsSource {
  toString(): string;
}

export default function NftNavigation(
  props: Readonly<{
    nftId: number;
    path: string;
    startIndex: number;
    endIndex: number;
    fullscreenElementId?: string | undefined;
    params?: SearchParamsSource | undefined;
  }>
) {
  const locale = useBrowserLocale();
  const supportsFullScreen = useFullScreenSupported();
  const isFirst = props.nftId === props.startIndex;
  const isLast = props.nftId === props.endIndex;
  const previousAriaLabel = t(locale, "nftNavigation.previous.ariaLabel");
  const previousTitle = t(locale, "nftNavigation.previous.title");
  const nextAriaLabel = t(locale, "nftNavigation.next.ariaLabel");
  const nextTitle = t(locale, "nftNavigation.next.title");

  const query = useMemo(() => {
    const paramsStr = nftNavigationQuery(props.params);
    return paramsStr ? `?${paramsStr}` : "";
  }, [props.params]);

  function printFullScreen() {
    if (!props.fullscreenElementId) {
      return null;
    }
    return (
      <FontAwesomeIcon
        icon={faExpandAlt}
        className="tw-h-[15px] tw-w-[15px] tw-cursor-pointer md:tw-h-[25px] md:tw-w-[25px]"
        onClick={() =>
          props.fullscreenElementId &&
          enterArtFullScreen(props.fullscreenElementId)
        }
      />
    );
  }

  function printNavigation() {
    return (
      <span className="tw-flex tw-items-center tw-justify-center tw-gap-2">
        {isFirst ? (
          <span
            role="link"
            aria-label={previousAriaLabel}
            aria-disabled="true"
            title={previousTitle}
            className="tw-flex tw-h-9 tw-w-9 tw-cursor-default tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950/70 tw-text-iron-500 tw-opacity-100 tw-shadow-none"
          >
            <ChevronLeftIcon
              data-testid="icon"
              aria-hidden="true"
              strokeWidth={2}
              className="tw-h-[18px] tw-w-[18px]"
            />
          </span>
        ) : (
          <Link
            href={`${props.path}/${props.nftId - 1}${query}`}
            aria-label={previousAriaLabel}
            title={previousTitle}
            className="tw-group tw-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/[0.2] tw-bg-iron-800 tw-text-iron-200 tw-shadow-[0_4px_12px_rgba(0,0,0,0.5)] tw-transition-colors tw-duration-150 hover:tw-border-white/30 hover:tw-bg-iron-700 hover:tw-text-white motion-reduce:tw-transition-none"
          >
            <ChevronLeftIcon
              data-testid="icon"
              aria-hidden="true"
              strokeWidth={2}
              className="tw-h-[18px] tw-w-[18px] tw-transition-transform tw-duration-150 group-hover:-tw-translate-x-0.5 motion-reduce:tw-transition-none"
            />
          </Link>
        )}
        {isLast ? (
          <span
            role="link"
            aria-label={nextAriaLabel}
            aria-disabled="true"
            title={nextTitle}
            className="tw-flex tw-h-9 tw-w-9 tw-cursor-default tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950/70 tw-text-iron-500 tw-opacity-100 tw-shadow-none"
          >
            <ChevronRightIcon
              data-testid="icon"
              aria-hidden="true"
              strokeWidth={2}
              className="tw-h-[18px] tw-w-[18px]"
            />
          </span>
        ) : (
          <Link
            href={`${props.path}/${props.nftId + 1}${query}`}
            aria-label={nextAriaLabel}
            title={nextTitle}
            className="tw-group tw-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/[0.2] tw-bg-iron-800 tw-text-iron-200 tw-shadow-[0_4px_12px_rgba(0,0,0,0.5)] tw-transition-colors tw-duration-150 hover:tw-border-white/30 hover:tw-bg-iron-700 hover:tw-text-white motion-reduce:tw-transition-none"
          >
            <ChevronRightIcon
              data-testid="icon"
              aria-hidden="true"
              strokeWidth={2}
              className="tw-h-[18px] tw-w-[18px] tw-transition-transform tw-duration-150 group-hover:tw-translate-x-0.5 motion-reduce:tw-transition-none"
            />
          </Link>
        )}
      </span>
    );
  }

  return (
    <>
      {printNavigation()}
      {supportsFullScreen && printFullScreen()}
    </>
  );
}
