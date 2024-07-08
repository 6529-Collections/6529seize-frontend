import Tippy from "@tippyjs/react";
import { Drop } from "../../../../../generated/models/Drop";
import OutsideLinkIcon from "../../../../utils/icons/OutsideLinkIcon";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function DropListItemExternalLink({
  drop,
  isWaveDescriptionDrop = false,
}: {
  readonly drop: Drop;
  readonly isWaveDescriptionDrop?: boolean;
}) {
  const router = useRouter();
  const [isTouchScreen, setIsTouchScreen] = useState(false);
  useEffect(() => {
    setIsTouchScreen(window.matchMedia("(pointer: coarse)").matches);
  }, [router.isReady]);

  return (
    <div className="tw-inline-flex -tw-mt-3">
      {/* <div className="tw-relative">
                  <button
                    type="button"
                    aria-label="Open options"
                    title="Open options"
                    className="tw-bg-transparent tw-h-full tw-border-0 tw-block tw-text-iron-500 hover:tw-text-iron-50 tw-transition tw-duration-300 tw-ease-out"
                    id="options-menu-0-button"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    <svg
                      className="tw-h-5 tw-w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
                    </svg>
                  </button>
                   <AnimatePresence mode="wait" initial={false}>
                  <div
                    className="tw-absolute tw-right-0 tw-z-10 tw-mt-2 tw-w-32 tw-origin-top-right tw-rounded-md tw-bg-iron-900 tw-py-2 tw-shadow-lg tw-ring-1 tw-ring-white/5 tw-focus:tw-outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="options-menu-0-button"
                    tabIndex={-1}
                  >
                    <div>
                      <div
                        className="tw-cursor-pointer tw-block tw-px-3 tw-py-1 tw-text-sm tw-leading-6 tw-text-iron-50 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
                        role="menuitem"
                        tabIndex={-1}
                        id="options-menu-0-item-0"
                      >
                        Copy
                      </div>
                    </div>
                  </div>
                     </AnimatePresence>
                </div> */}

      <Tippy
        content="Open"
        theme="dark"
        placement="top"
        disabled={isTouchScreen}
      >
        <a
          href={`/waves/${drop.wave.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`tw-block tw-p-2 tw-bg-transparent tw-cursor-pointer tw-text-sm sm:tw-text-base tw-font-semibold tw-text-iron-600 tw-border-0 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out`}
        >
          <OutsideLinkIcon />
        </a>
      </Tippy>
    </div>
  );
}
