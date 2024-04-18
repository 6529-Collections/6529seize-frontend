import { DropFull } from "../../../../entities/IDrop";
import { useEffect, useState } from "react";
import DropListItemData from "./data/DropListItemData";
import DropListItemActions from "./action/DropListItemActions";
import DropWrapper from "../../create/utils/DropWrapper";
import DropListItemContent from "./content/DropListItemContent";
import DropListItemRateWrapper from "./rate/DropListItemRateWrapper";
import DropsListItemChallengeBar from "./challenge/DropsListItemChallengeBar";
import Tippy from "@tippyjs/react";
import { useRouter } from "next/router";
import OutsideLinkIcon from "../../../utils/icons/OutsideLinkIcon";
import DropListItemLogsWrapper from "./logs/DropListItemLogsWrapper";
import DropListItemCreateQuote from "./quote/DropListItemCreateQuote";

export enum DropDiscussionExpandableState {
  IDLE = "IDLE",
  DISCUSSION = "DISCUSSION",
  RATES = "RATES",
}

export default function DropsListItem({
  drop,
  showFull = false,
  showExternalLink = true,
}: {
  readonly drop: DropFull;
  readonly showFull?: boolean;
  readonly showExternalLink?: boolean;
}) {
  const router = useRouter();
  const [isTouchScreen, setIsTouchScreen] = useState(false);
  useEffect(() => {
    setIsTouchScreen(window.matchMedia("(pointer: coarse)").matches);
  }, [router.isReady]);
  const [discussionExpandableState, setDiscussionExpandableState] =
    useState<DropDiscussionExpandableState>(DropDiscussionExpandableState.IDLE);

  const [isQuoteMode, setIsQuoteMode] = useState(false);

  const haveData = !!drop.mentioned_users.length || !!drop.metadata.length;

  return (
    <div className="tw-relative tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-rounded-xl tw-bg-iron-900">
      <DropsListItemChallengeBar
        maxValue={100000}
        current={drop.rep}
        myRate={drop.rep_given_by_input_profile}
      />
      <DropListItemCreateQuote
        drop={drop}
        isOpen={isQuoteMode}
        setIsOpen={setIsQuoteMode}
      />
      <div className="tw-p-4 sm:tw-p-5">
        <div className="tw-h-full tw-flex tw-justify-between tw-gap-x-4 md:tw-gap-x-6">
          <div className="tw-flex-1 tw-min-h-full tw-flex tw-flex-col tw-justify-between">
            <DropWrapper drop={drop}>
              <div className="tw-w-full">
                <DropListItemContent drop={drop} showFull={showFull} />
              </div>
            </DropWrapper>
            {haveData && <DropListItemData drop={drop} />}
            <DropListItemActions
              drop={drop}
              discussionExpandableState={discussionExpandableState}
              setDiscussionExpandableState={setDiscussionExpandableState}
              isQuoteMode={isQuoteMode}
              setIsQuoteMode={setIsQuoteMode}
            />
          </div>
          <div>
            {showExternalLink && (
              <div className="tw-inline-flex">
                <Tippy
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
                </Tippy>
              </div>
            )}
            <DropListItemRateWrapper drop={drop} />
          </div>
        </div>
      </div>
      <DropListItemLogsWrapper
        drop={drop}
        discussionExpandableState={discussionExpandableState}
      />
    </div>
  );
}
