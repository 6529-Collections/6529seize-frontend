"use client";

import React, {
  useLayoutEffect,
  useRef,
  useState,
} from "react";

interface DropContentWrapperProps {
  readonly children: React.ReactNode;
  readonly parentContainerRef?: React.RefObject<HTMLElement | null>;
}

const DropContentWrapper: React.FC<DropContentWrapperProps> = ({
  parentContainerRef,
  children,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useLayoutEffect(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      const needsTruncation = height > 1000;
      
      if (needsTruncation) {
        contentRef.current.classList.add('should-truncate');
      } else {
        contentRef.current.classList.remove('should-truncate');
      }
    }
  }, [children]);

  const toggleExpand = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!contentRef.current) return;

    const content = contentRef.current;
    const contentTop = content.getBoundingClientRect().top;

    // Toggle both React state and CSS class
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    if (newExpandedState) {
      content.classList.add('expanded');
    } else {
      content.classList.remove('expanded');
    }

    setTimeout(() => {
      const newContentTop = content.getBoundingClientRect().top;
      const scrollDiff = newContentTop - contentTop;

      if (parentContainerRef?.current) {
        parentContainerRef.current.scrollTop += scrollDiff;
      } else {
        window.scrollBy(0, scrollDiff);
      }
    }, 0);
  };
  return (
    <div className="tw-relative">
      <div
        ref={contentRef}
        className="drop-content-container">
        {children}
        <div className="tw-absolute tw-bottom-0 tw-left-0 tw-right-0 tw-h-24 tw-bg-gradient-to-t tw-from-iron-900 tw-to-transparent tw-flex tw-items-end tw-justify-center tw-pb-4 drop-expand-button" data-text-selection-exclude="true">
          <button
            onClick={toggleExpand}
            className="tw-bg-iron-700 tw-border-0 tw-text-sm tw-text-iron-300 tw-ring-1 tw-ring-iron-700 tw-px-3 tw-py-2 tw-rounded-full tw-shadow-md desktop-hover:hover:tw-text-white desktop-hover:hover:tw-bg-iron-650 tw-transition tw-duration-200 tw-flex tw-items-center tw-space-x-2"
          >
            {isExpanded ? 'Show less' : 'Show full post'}
            <svg
              className={`tw-w-4 tw-h-4 tw-flex-shrink-0 tw-transition-transform ${
                isExpanded ? 'tw-rotate-180' : ''
              }`}
              fill="currentColor"
              aria-hidden="true"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DropContentWrapper;