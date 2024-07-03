import { useEffect, useState } from "react";
import DropListItemData from "./data/DropListItemData";
import DropWrapper from "../../create/utils/DropWrapper";
import DropListItemContent from "./content/DropListItemContent";
import DropListItemRateWrapper from "./rate/DropListItemRateWrapper";
import DropsListItemChallengeBar from "./challenge/DropsListItemChallengeBar";
import { useRouter } from "next/router";
import DropListItemCreateQuote from "./quote/DropListItemCreateQuote";
import { Drop } from "../../../../generated/models/Drop";
import { getRandomColorWithSeed } from "../../../../helpers/Helpers";

export default function DropsListItem({
  drop,
  showFull = false,
  showExternalLink = true,
  isWaveDescriptionDrop = false,
}: {
  readonly drop: Drop;
  readonly showFull?: boolean;
  readonly showExternalLink?: boolean;
  readonly isWaveDescriptionDrop?: boolean;
}) {
  const router = useRouter();
  const [isTouchScreen, setIsTouchScreen] = useState(false);
  useEffect(() => {
    setIsTouchScreen(window.matchMedia("(pointer: coarse)").matches);
  }, [router.isReady]);

  const [quoteModePartId, setQuoteModePartId] = useState<number | null>(null);
  const haveData = !!drop.mentioned_users.length || !!drop.metadata.length;

  const banner1 =
    drop.author.banner1_color ?? getRandomColorWithSeed(drop.author.handle);
  const banner2 =
    drop.author.banner2_color ?? getRandomColorWithSeed(drop.author.handle);

  return (
    <div className="tw-relative tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-rounded-xl tw-bg-iron-900">
      {isWaveDescriptionDrop ? (
        <div
          className="tw-relative tw-w-full tw-h-7 tw-rounded-t-xl"
          style={{
            background: `linear-gradient(45deg, ${banner1} 0%, ${banner2} 100%)`,
          }}
        ></div>
      ) : (
        <DropsListItemChallengeBar
          maxValue={100000}
          current={drop.rating}
          myRate={drop.context_profile_context?.rating ?? null}
        />
      )}

      <DropListItemCreateQuote
        drop={drop}
        quotedPartId={quoteModePartId}
        onSuccessfulQuote={() => setQuoteModePartId(null)}
      />
      <div className="tw-p-4 sm:tw-p-5">
        <div className="tw-h-full tw-flex tw-justify-between tw-gap-x-4 md:tw-gap-x-6">
          <div className="tw-flex-1 tw-min-h-full tw-flex tw-flex-col tw-justify-between">
            <DropWrapper
              drop={drop}
              isWaveDescriptionDrop={isWaveDescriptionDrop}
            >
              <div className="tw-w-full tw-h-full">
                <DropListItemContent
                  drop={drop}
                  showFull={showFull}
                  onQuote={setQuoteModePartId}
                />
              </div>
            </DropWrapper>
            {haveData && <DropListItemData drop={drop} />}
          </div>

          <div className="tw-flex tw-flex-col tw-items-center tw-min-h-full">
            {showExternalLink && (
              <div className="tw-inline-flex -tw-mt-1.5">
                <div className="tw-relative">
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
                  {/*  <AnimatePresence mode="wait" initial={false}> */}
                  {/* <div
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
                  </div> */}
                  {/*    </AnimatePresence> */}
                </div>

                {/*   <Tippy
                  content="Open"
                  theme="dark"
                  placement="top"
                  disabled={isTouchScreen}
                >
                  <a
                    href={`/brain/${drop.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`tw-block tw-p-2 tw-bg-transparent tw-cursor-pointer tw-text-sm sm:tw-text-base tw-font-semibold tw-text-iron-600 tw-border-0 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out`}
                  >
                    <OutsideLinkIcon />
                  </a>
                </Tippy> */}
              </div>
            )}
            <div className="tw-flex-grow tw-flex tw-flex-col tw-justify-center tw-items-center">
              <DropListItemRateWrapper drop={drop} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
