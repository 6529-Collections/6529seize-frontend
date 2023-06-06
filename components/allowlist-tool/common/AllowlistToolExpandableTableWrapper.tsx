import { useAnimate } from "framer-motion";
import React from "react";
import { useEffect, useState } from "react";

interface AllowlistToolExpandableTableWrapperProps {
  children: React.ReactNode;
  title: string;
}

export default function AllowlistToolExpandableTableWrapper({ children, title }: AllowlistToolExpandableTableWrapperProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [tableScope, animateTable] = useAnimate();
  const [iconScope, animateIcon] = useAnimate();
  useEffect(() => {
    if (isOpen) {
      animateTable(tableScope.current, { height: "auto" });
      animateIcon(iconScope.current, { rotate: 90 });
    } else {
      animateTable(tableScope.current, { height: 0 });
      animateIcon(iconScope.current, { rotate: 0 });
    }
  });
  return (
    <>
      <div>
        <div className="tw-cursor-pointer tw-bg-neutral-900 tw-border tw-border-solid tw-border-white/5 tw-rounded-xl tw-pt-5 tw-transition tw-duration-300 tw-ease-out">
          <div
            onClick={() => setIsOpen(!isOpen)}
            className="tw-px-6 tw-flex tw-items-center tw-gap-x-4 tw-pb-5"
          >
            <div className="tw-h-6 tw-w-6 tw-flex tw-items-center tw-justify-center tw-bg-neutral-700 tw-rounded-md">
              <svg
                ref={iconScope}
                className="tw-h-5 tw-w-5 tw-text-neutral-300"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 18L15 12L9 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="tw-m-0 tw-p-0 tw-text-lg tw-font-medium tw-text-white">
              {title}
            </p>
          </div>
          {React.Children.map(children, (child) =>
            React.cloneElement(child as React.ReactElement, { ref: tableScope })
          )}
        </div>
      </div>
    </>
  )

}