import {
  faChevronCircleDown,
  faChevronCircleUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function ShowMoreButton({
  expanded,
  setExpanded,
  showMoreLabel = "Show More",
  showLessLabel = "Show Less",
}: Readonly<{
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  showMoreLabel?: string | undefined;
  showLessLabel?: string | undefined;
}>) {
  return (
    <button
      className="tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 tw-text-inherit tw-no-underline hover:tw-text-[#9a9a9a]"
      onClick={() => setExpanded(!expanded)}
    >
      {expanded ? (
        <>
          {showLessLabel}{" "}
          <FontAwesomeIcon icon={faChevronCircleUp} height={"20px"} />
        </>
      ) : (
        <>
          {showMoreLabel}{" "}
          <FontAwesomeIcon icon={faChevronCircleDown} height={"20px"} />
        </>
      )}
    </button>
  );
}
