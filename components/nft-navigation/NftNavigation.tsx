import {
  faChevronCircleLeft,
  faChevronCircleRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

export default function NftNavigation(
  props: Readonly<{
    nftId: number;
    startIndex: number;
    endIndex: number;
  }>
) {
  const isFirst = props.nftId === props.startIndex;
  const isLast = props.nftId === props.endIndex;

  const baseClass = "tw-w-[25px] tw-h-[25px] md:tw-w-[35px] md:tw-h-[35px]";

  const disabledClass = "tw-pointer-events-none tw-text-gray-400";

  return (
    <span className="tw-flex tw-gap-2">
      <h2 className="tw-float-left">
        <Link
          href={`/6529-gradient/${props.nftId - 1}`}
          className={`${baseClass} ${isFirst ? disabledClass : ""}`}>
          <FontAwesomeIcon icon={faChevronCircleLeft} className={baseClass} />
        </Link>
      </h2>
      <h2 className="tw-float-left">
        <Link
          href={`/6529-gradient/${props.nftId + 1}`}
          className={`${baseClass} ${isLast ? disabledClass : ""}`}>
          <FontAwesomeIcon icon={faChevronCircleRight} className={baseClass} />
        </Link>
      </h2>
    </span>
  );
}
