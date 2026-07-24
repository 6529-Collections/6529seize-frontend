import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { useId } from "react";

interface DateAccordionProps {
  readonly title: React.ReactNode;
  readonly titleActions?: React.ReactNode | undefined;
  readonly isExpanded: boolean;
  readonly onToggle: () => void;
  readonly collapsedContent?: React.ReactNode | undefined;
  readonly children: React.ReactNode;
  readonly showChevron?: boolean | undefined;
}

export default function DateAccordion({
  title,
  titleActions,
  isExpanded,
  onToggle,
  collapsedContent,
  children,
  showChevron = true,
}: DateAccordionProps) {
  const contentId = useId();
  const titleId = `${contentId}-title`;

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className="tw-rounded-xl tw-bg-iron-900 tw-shadow-sm tw-ring-1 tw-ring-iron-700/50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="tw-flex tw-h-16 tw-w-full tw-items-center tw-justify-between tw-rounded-xl tw-border-0 tw-bg-transparent tw-px-5 tw-text-left tw-transition-colors tw-duration-200">
          <div className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-x-4">
            <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-x-2">
              <button
                type="button"
                onClick={onToggle}
                aria-expanded={isExpanded}
                aria-controls={contentId}
                aria-labelledby={titleId}
                className="tw-flex tw-min-w-0 tw-cursor-pointer tw-items-center tw-gap-x-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-left focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
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
                  className="tw-min-w-0 tw-text-base tw-font-semibold tw-text-iron-300"
                >
                  {title}
                </span>
              </button>
              {titleActions !== undefined && titleActions !== null && (
                <div className="tw-flex tw-shrink-0 tw-items-center tw-gap-x-2">
                  {titleActions}
                </div>
              )}
            </div>
            {!isExpanded &&
              collapsedContent !== undefined &&
              collapsedContent !== null && (
                // The summary mini-cards need more room than the fixed-height
                // header offers on small screens, where they overflow and
                // paint over the title; the collapsed title alone carries the
                // state there.
                <div className="tw-hidden tw-opacity-80 tw-transition-opacity tw-duration-200 hover:tw-opacity-100 lg:tw-block">
                  {collapsedContent}
                </div>
              )}
          </div>
        </div>

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
