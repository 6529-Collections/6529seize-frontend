import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { useId } from "react";

interface CollapsibleCardProps {
  readonly title: React.ReactNode;
  // A non-interactive accent beside the title (e.g. a count badge). Rendered
  // inside the header button, so it must stay presentational — no buttons or
  // links (they can't nest inside the toggle button).
  readonly titleActions?: React.ReactNode | undefined;
  readonly isExpanded: boolean;
  readonly onToggle: () => void;
  // A compact summary shown on the right of the header (desktop only) while the
  // card is collapsed. Presentational only, for the same nesting reason.
  readonly collapsedContent?: React.ReactNode | undefined;
  readonly children: React.ReactNode;
  readonly showChevron?: boolean | undefined;
  readonly compactHeader?: boolean | undefined;
}

export default function CollapsibleCard({
  title,
  titleActions,
  isExpanded,
  onToggle,
  collapsedContent,
  children,
  showChevron = true,
  compactHeader = false,
}: CollapsibleCardProps) {
  const contentId = useId();
  const titleId = `${contentId}-title`;

  const hasTitleActions = titleActions !== undefined && titleActions !== null;
  // The summary mini-card needs more room than the fixed-height header offers on
  // small screens, where it overflows and paints over the title; the collapsed
  // title alone carries the state there.
  const hasCollapsedSummary =
    !isExpanded && collapsedContent !== undefined && collapsedContent !== null;

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className="tw-rounded-xl tw-bg-iron-900 tw-shadow-sm tw-ring-1 tw-ring-iron-700/50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* The entire header row is one toggle target — one unambiguous tap area
            on mobile. Everything inside is presentational (chevron, title, an
            optional badge, an optional collapsed summary), so nesting it in the
            button stays valid and keeps the click target flat. */}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-controls={contentId}
          aria-labelledby={titleId}
          className={`tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-justify-between tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-transparent tw-text-left tw-transition-colors tw-duration-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 ${
            compactHeader ? "tw-h-12 tw-px-3" : "tw-h-16 tw-px-5"
          }`}
        >
          <span
            className={`tw-flex tw-min-w-0 tw-items-center ${
              compactHeader ? "tw-gap-x-2" : "tw-gap-x-3"
            }`}
          >
            <m.span
              // Match the app-wide chevron convention: points down when
              // collapsed, rotates up when expanded (as in
              // GrantTokensDisclosure, TimelineToggleHeader, the dropdowns).
              animate={isExpanded ? { rotate: 180 } : { rotate: 0 }}
              transition={{ duration: 0.3 }}
              className="tw-shrink-0 tw-rounded-full tw-p-1.5 tw-transition-colors tw-duration-200 desktop-hover:hover:tw-bg-iron-700/30"
            >
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`tw-size-4 ${
                  showChevron ? "tw-text-primary-400" : "tw-text-iron-700"
                } tw-transition-all tw-duration-200`}
              />
            </m.span>
            <span
              id={titleId}
              className={`tw-min-w-0 tw-font-semibold ${
                compactHeader
                  ? "tw-text-sm tw-leading-4 tw-text-iron-200"
                  : "tw-text-base tw-text-iron-300"
              }`}
            >
              {title}
            </span>
            {hasTitleActions && (
              <span className="tw-flex tw-shrink-0 tw-items-center tw-gap-x-2">
                {titleActions}
              </span>
            )}
          </span>
          {hasCollapsedSummary && (
            <span className="tw-hidden tw-opacity-80 tw-transition-opacity tw-duration-200 hover:tw-opacity-100 lg:tw-block">
              {collapsedContent}
            </span>
          )}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <m.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
              id={contentId}
            >
              {children}
            </m.div>
          )}
        </AnimatePresence>
      </m.div>
    </LazyMotion>
  );
}
