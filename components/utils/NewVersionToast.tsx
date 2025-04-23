import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRefresh } from "@fortawesome/free-solid-svg-icons";
import { useIsStale } from "../../hooks/useVersion";
import { useRouter } from "next/router";
const NewVersionToast = (): JSX.Element | null => {
  const stale = useIsStale();
  const router = useRouter();

  if (!stale) {
    return null;
  }

  return (
    <div className="tailwind-scope tw-fixed tw-bottom-4 tw-right-4 tw-z-[1000] tw-rounded-lg tw-bg-primary-500 tw-p-4 tw-text-white tw-shadow-md animate-fade-in">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-4">
        <span className="tw-text-sm">A new version is available!</span>
        <div className="tw-flex tw-items-center tw-space-x-2">
          <button
            onClick={() => router.reload()}
            className="tw-flex tw-group tw-items-center tw-justify-center tw-gap-x-1.5 tw-rounded-md tw-border tw-border-transparent tw-bg-white desktop-hover:hover:tw-bg-gray-100 tw-px-2.5 tw-py-1.5 tw-text-sm tw-font-semibold tw-text-primary-600 tw-shadow-sm hover:tw-bg-gray-100 tw-transition-colors tw-duration-150"
            aria-label="Refresh page"
            title="Refresh page"
          >
            <FontAwesomeIcon
              icon={faRefresh}
              className="tw-size-4 tw-flex-shrink-0 tw-text-primary-500 desktop-hover:group-hover:tw-text-primary-600"
            />
            Refresh
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default NewVersionToast;
