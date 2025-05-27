import styles from "./WaveDropReactions.module.scss";
import React, { useContext, useState } from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { formatLargeNumber } from "../../../helpers/Helpers";
import { useEmoji } from "../../../contexts/EmojiContext";
import { ApiDropReaction } from "../../../generated/models/ApiDropReaction";
import { Tooltip } from "react-tooltip";
import {
  commonApiDeleteWithBody,
  commonApiPost,
} from "../../../services/api/common-api";
import { useAuth } from "../../auth/Auth";
import { ReactQueryWrapperContext } from "../../react-query-wrapper/ReactQueryWrapper";

interface WaveDropReactionsProps {
  readonly drop: ApiDrop;
}

const WaveDropReactions: React.FC<WaveDropReactionsProps> = ({ drop }) => {
  return (
    <>
      {drop.reactions?.map((reaction) => (
        <WaveDropReaction
          key={reaction.reaction}
          drop={drop}
          reaction={reaction}
          initialSelected={reaction.reaction === drop.context_profile_reaction}
        />
      ))}
    </>
  );
};

function WaveDropReaction({
  drop,
  reaction,
  initialSelected,
}: {
  readonly drop: ApiDrop;
  readonly reaction: ApiDropReaction;
  readonly initialSelected: boolean;
}) {
  const { setToast, connectedProfile } = useAuth();
  const { onDropReactionChange } = useContext(ReactQueryWrapperContext);
  const [count, setCount] = useState(reaction.profiles.length);
  const [selected, setSelected] = useState(initialSelected);
  const [direction, setDirection] = useState<"up" | "down">("up");

  const { emojiMap, findNativeEmoji } = useEmoji();
  const emojiId = reaction.reaction.replaceAll(":", "");
  const emoji = emojiMap
    .flatMap((cat) => cat.emojis)
    .find((e) => e.id === emojiId);

  let emojiNode;
  let emojiNodeTooltip;
  if (emoji) {
    emojiNode = (
      <img
        src={emoji.skins[0].src}
        alt={emojiId}
        className="tw-max-w-4 tw-max-h-4 tw-block tw-object-contain tw-rounded-sm"
      />
    );
    emojiNodeTooltip = (
      <img
        src={emoji.skins[0].src}
        alt={emojiId}
        className="tw-max-w-8 tw-max-h-8 tw-block tw-object-contain tw-rounded-sm"
      />
    );
  } else {
    const native = findNativeEmoji(emojiId);
    if (native) {
      emojiNode = (
        <span className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-text-[1rem]">
          {native.skins[0].native}
        </span>
      );
      emojiNodeTooltip = (
        <span className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-text-2xl">
          {native.skins[0].native}
        </span>
      );
    }
  }

  if (!emojiNode || !count) return null;

  let borderStyle = "tw-border-iron-700";
  let bgStyle = "tw-bg-iron-900/40";
  let hoveredStyle = "hover:tw-border-iron-500 hover:tw-bg-iron-900/40";
  if (selected) {
    borderStyle = "tw-border-primary-500";
    bgStyle = "tw-bg-primary-500/10";
    hoveredStyle = "hover:tw-border-primary-500 hover:tw-bg-primary-500/10";
  }

  const handleClick = async () => {
    if (selected) {
      await commonApiDeleteWithBody<{ reaction: string }, ApiDrop>({
        endpoint: `drops/${drop.id}/reaction`,
        body: {
          reaction: reaction.reaction,
        },
      })
        .then(() => {
          onDropReactionChange({
            drop,
            giverHandle: connectedProfile?.handle ?? null,
          });
          setDirection("up");
          setCount(count - 1);
          setSelected(false);
        })
        .catch((error) => {
          let errorMessage = "Error removing reaction";
          if (typeof error === "string") {
            errorMessage = error;
          }
          setToast({
            message: errorMessage,
            type: "error",
          });
        });
    } else {
      await commonApiPost<{ reaction: string }, ApiDrop>({
        endpoint: `drops/${drop.id}/reaction`,
        body: {
          reaction: reaction.reaction,
        },
      })
        .then(() => {
          onDropReactionChange({
            drop,
            giverHandle: connectedProfile?.handle ?? null,
          });
          setDirection("down");
          setCount(count + 1);
          setSelected(true);
        })
        .catch((error) => {
          let errorMessage = "Error adding reaction";
          if (typeof error === "string") {
            errorMessage = error;
          }
          setToast({
            message: errorMessage,
            type: "error",
          });
        });
    }
  };

  const handles = reaction.profiles.map((p) => p.handle);
  const total = handles.length;

  let tooltipText;
  if (total <= 3) {
    tooltipText = handles.join(", ");
  } else {
    const firstThree = handles.slice(0, 3).join(", ");
    const remaining = total - 3;
    tooltipText = `${firstThree} and ${remaining} more`;
  }
  const tooltipContent = (
    <div className="tw-flex tw-items-center tw-gap-2">
      {emojiNodeTooltip}
      <span className="tw-whitespace-nowrap">by {tooltipText}</span>
    </div>
  );

  return (
    <>
      <button
        onClick={handleClick}
        data-tooltip-id={`reaction-${reaction.reaction}`}
        className={`
        tw-inline-flex tw-items-center tw-gap-x-2 tw-mt-1
        tw-py-1 tw-px-2 tw-rounded-lg tw-shadow-sm
        tw-border tw-border-solid tw-text-iron-500
        hover:tw-text-iron-100
        ${borderStyle} ${bgStyle} ${hoveredStyle}
      `}>
        <div className="tw-flex tw-items-center tw-gap-x-1 tw-h-full">
          <div className="tw-w-5 tw-h-5 tw-flex-shrink-0 tw-flex tw-items-center tw-justify-center">
            {emojiNode}
          </div>
          <span className="tw-text-xs tw-font-normal tw-min-w-[2ch]">
            <span
              key={count}
              className={
                direction === "up"
                  ? styles.reactionSlideUp
                  : styles.reactionSlideDown
              }>
              {formatLargeNumber(count)}
            </span>
          </span>
        </div>
      </button>
      <Tooltip
        id={`reaction-${reaction.reaction}`}
        place="bottom"
        className="tw-opacity-100 tw-z-50 tw-bg-black tw-text-white tw-rounded-lg tw-shadow-lg">
        {tooltipContent}
      </Tooltip>
    </>
  );
}

export default WaveDropReactions;
