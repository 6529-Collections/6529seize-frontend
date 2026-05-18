import { enterArtFullScreen, fullScreenSupported } from "@/helpers/Helpers";
import { faExpandAlt } from "@fortawesome/free-solid-svg-icons";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
    const linkClass =
      "tw-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-800 tw-text-iron-100 tw-shadow-sm tw-transition-colors hover:tw-border-iron-500 hover:tw-bg-iron-700 hover:tw-text-white";
    const disabledClass =
      "tw-pointer-events-none tw-cursor-default tw-border-iron-800 tw-bg-iron-950 tw-text-iron-600 tw-shadow-none tw-opacity-100";
    const iconClass = "tw-h-4 tw-w-4";

    return (
      <span className="tw-flex tw-items-center tw-justify-center tw-gap-2">
        <Link
          href={`${props.path}/${props.nftId - 1}${query}`}
          aria-label="Previous NFT"
          aria-disabled={isFirst}
          className={`${linkClass} ${isFirst ? disabledClass : ""}`}
        >
          <ChevronLeftIcon data-testid="icon" className={iconClass} />
        </Link>
        <Link
          href={`${props.path}/${props.nftId + 1}${query}`}
          aria-label="Next NFT"
          aria-disabled={isLast}
          className={`${linkClass} ${isLast ? disabledClass : ""}`}
        >
          <ChevronRightIcon data-testid="icon" className={iconClass} />
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
