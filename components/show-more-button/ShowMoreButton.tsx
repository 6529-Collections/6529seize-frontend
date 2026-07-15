import {
  faChevronCircleDown,
  faChevronCircleUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

export default function ShowMoreButton({
  expanded,
  setExpanded,
  showMoreLabel = "Show More",
  showLessLabel = "Show Less",
  variant = "default",
}: Readonly<{
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  showMoreLabel?: string | undefined;
  showLessLabel?: string | undefined;
  variant?: "default" | "subtle" | "inline" | undefined;
}>) {
  const label = expanded ? showLessLabel : showMoreLabel;
  const isSubtle = variant === "subtle";
  const isInline = variant === "inline";
  const usesChevron = isSubtle || isInline;

  return (
    <button
      type="button"
      aria-expanded={expanded}
      className={
        isInline
          ? "tw-inline-flex tw-min-h-8 tw-cursor-pointer tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-sm tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-text-iron-500 tw-no-underline tw-transition-colors focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-iron-200"
          : isSubtle
            ? "tw-inline-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-full tw-border-0 tw-bg-transparent tw-px-4 tw-py-2 tw-text-xs tw-text-iron-500 tw-no-underline tw-transition-colors focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-iron-900/60 desktop-hover:hover:tw-text-iron-200"
            : "tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 tw-text-inherit tw-no-underline hover:tw-text-[#9a9a9a]"
      }
      onClick={() => setExpanded(!expanded)}
    >
      {label}
      {usesChevron ? (
        <ChevronDownIcon
          aria-hidden="true"
          className={`tw-size-3 tw-transition-transform tw-duration-300 motion-reduce:tw-transition-none ${
            expanded ? "tw-rotate-180" : ""
          }`}
        />
      ) : expanded ? (
        <>
          {" "}
          <FontAwesomeIcon icon={faChevronCircleUp} height={"20px"} />
        </>
      ) : (
        <>
          {" "}
          <FontAwesomeIcon icon={faChevronCircleDown} height={"20px"} />
        </>
      )}
    </button>
  );
}
