import {
  faChevronCircleLeft,
  faChevronCircleRight,
  faExpandAlt,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { enterArtFullScreen, fullScreenSupported } from "@/helpers/Helpers";

export default function NftNavigation(
  props: Readonly<{
    nftId: number;
    path: string;
    startIndex: number;
    endIndex: number;
    fullscreenElementId?: string;
  }>
) {
  const isFirst = props.nftId === props.startIndex;
  const isLast = props.nftId === props.endIndex;

  const baseClass = "tw-w-[25px] tw-h-[25px] md:tw-w-[35px] md:tw-h-[35px]";

  const disabledClass = "tw-pointer-events-none tw-text-gray-400";

  function printFullScreen() {
    if (!props.fullscreenElementId) {
      return null;
    }
    return (
      <FontAwesomeIcon
        icon={faExpandAlt}
        className="tw-w-[15px] tw-h-[15px] md:tw-w-[25px] md:tw-h-[25px] tw-cursor-pointer"
        onClick={() =>
          props.fullscreenElementId &&
          enterArtFullScreen(props.fullscreenElementId)
        }
      />
    );
  }

  return (
    <>
      <span className="tw-flex tw-gap-2 tw-items-center tw-justify-center">
        <Link
          href={`${props.path}/${props.nftId - 1}`}
          className={`${baseClass} ${isFirst ? disabledClass : ""}`}>
          <FontAwesomeIcon icon={faChevronCircleLeft} className={baseClass} />
        </Link>
        <Link
          href={`${props.path}/${props.nftId + 1}`}
          className={`${baseClass} ${isLast ? disabledClass : ""}`}>
          <FontAwesomeIcon icon={faChevronCircleRight} className={baseClass} />
        </Link>
      </span>
      {fullScreenSupported() && printFullScreen()}
    </>
  );
}
