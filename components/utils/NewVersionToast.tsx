import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRefresh } from "@fortawesome/free-solid-svg-icons";
import { useIsStale } from "../../hooks/useVersion";
import { useRouter } from "next/router";
import useDeviceInfo from "../../hooks/useDeviceInfo";

const NewVersionToast = (): JSX.Element | null => {
  const stale = useIsStale();
  const router = useRouter();
  const { isApp } = useDeviceInfo();

  if (!stale) {
    return null;
  }

  return (
    <div
      className={`tw-fixed ${
        isApp ? "tw-bottom-24" : "tw-bottom-6"
      } tw-left-6 sm:tw-left-auto tw-right-6 tw-z-[1000] tw-pointer-events-none tailwind-scope`}
    >
      <div
        className="toast-shell tw-relative tw-pointer-events-auto tw-flex tw-items-center tw-justify-between sm:tw-justify-start tw-gap-3
                 tw-rounded-xl tw-bg-iron-700/80 tw-border tw-border-iron-700 tw-border-solid
                 tw-backdrop-blur-md tw-px-4 tw-py-2.5 tw-text-iron-50
                 tw-shadow-[0_12px_28px_-6px_rgba(0,0,0,0.75)]
                 tw-animate-toast-in
                 before:tw-content-[''] before:tw-absolute before:tw-inset-0 before:tw-rounded-[inherit]
                 before:tw-bg-[radial-gradient(140%_140%_at_100%_0,_rgba(255,255,255,0.06)_0%,_transparent_70%)]
                 before:tw-pointer-events-none"
      >
        <span className="tw-text-sm tw-leading-none tw-font-semibold">
          A&nbsp;new&nbsp;version&nbsp;is&nbsp;available
        </span>

        <button
          onClick={() => router.reload()}
          aria-label="Refresh page"
          title="Refresh page"
          className="tw-flex tw-items-center tw-justify-center tw-gap-x-2
                   tw-rounded-md tw-bg-primary-500 tw-border-none tw-p-2
                   desktop-hover:hover:tw-bg-primary-500/80 active:tw-scale-95
                   focus-visible:tw-outline-none
                   focus-visible:tw-ring-2 focus-visible:tw-ring-inset
                   focus-visible:tw-ring-primary-500 tw-transition-all tw-duration-300 tw-ease-out"
        >
          <FontAwesomeIcon
            icon={faRefresh}
            className="tw-h-4 tw-w-4 tw-flex-shrink-0"
          />
        </button>
      </div>
    </div>
  );
};

export default NewVersionToast;
