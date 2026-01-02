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
      className="btn-link decoration-none"
      onClick={() => setExpanded(!expanded)}>
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
