import { enterArtFullScreen, fullScreenSupported } from "@/helpers/Helpers";
import { faExpandAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { useMemo } from "react";

export default function NftNavigation(
  props: Readonly<{
    nftId: number;
    path: string;
    startIndex: number;
    endIndex: number;
    fullscreenElementId?: string | undefined;
    params?: ReadonlyURLSearchParams | undefined;
  }>
) {
  const isFirst = props.nftId === props.startIndex;
  const isLast = props.nftId === props.endIndex;

  const query = useMemo(() => {
    const paramsStr = props.params?.toString();
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
        <Link
          href={`${props.path}/${props.nftId - 1}${query}`}
          aria-label="Previous NFT"
          aria-disabled={isFirst}
          title="Previous Card"
          className={`tw-group tw-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/[0.2] tw-bg-iron-800 tw-text-iron-200 tw-shadow-[0_4px_12px_rgba(0,0,0,0.5)] tw-transition-all tw-duration-300 hover:tw-border-white/30 hover:tw-bg-iron-700 hover:tw-text-white ${
            isFirst
              ? "tw-pointer-events-none tw-cursor-default tw-border-iron-800 tw-bg-iron-950/70 tw-text-iron-500 tw-opacity-100 tw-shadow-none"
              : ""
          }`}
        >
          <ChevronLeftIcon
            data-testid="icon"
            strokeWidth={2}
            className="tw-h-[18px] tw-w-[18px] tw-transition-transform tw-duration-300 group-hover:-tw-translate-x-0.5"
          />
        </Link>
        <Link
          href={`${props.path}/${props.nftId + 1}${query}`}
          aria-label="Next NFT"
          aria-disabled={isLast}
          title="Next Card"
          className={`tw-group tw-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/[0.2] tw-bg-iron-800 tw-text-iron-200 tw-shadow-[0_4px_12px_rgba(0,0,0,0.5)] tw-transition-all tw-duration-300 hover:tw-border-white/30 hover:tw-bg-iron-700 hover:tw-text-white ${
            isLast
              ? "tw-pointer-events-none tw-cursor-default tw-border-iron-800 tw-bg-iron-950/70 tw-text-iron-500 tw-opacity-100 tw-shadow-none"
              : ""
          }`}
        >
          <ChevronRightIcon
            data-testid="icon"
            strokeWidth={2}
            className="tw-h-[18px] tw-w-[18px] tw-transition-transform tw-duration-300 group-hover:tw-translate-x-0.5"
          />
        </Link>
      </span>
    );
  }

  return (
    <>
      {printNavigation()}
      {fullScreenSupported() && printFullScreen()}
    </>
  );
}
