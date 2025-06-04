import styles from "./WaveDropReactions.module.scss";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { formatLargeNumber } from "../../../helpers/Helpers";
import { useEmoji } from "../../../contexts/EmojiContext";
import { ApiDropReaction } from "../../../generated/models/ApiDropReaction";
import { Tooltip } from "react-tooltip";
import {
  commonApiDelete,
  commonApiPost,
} from "../../../services/api/common-api";
import { useAuth } from "../../auth/Auth";
import clsx from "clsx";
import { ApiAddReactionToDropRequest } from "../../../generated/models/ApiAddReactionToDropRequest";

interface WaveDropReactionsProps {
  readonly drop: ApiDrop;
}

const WaveDropReactions: React.FC<WaveDropReactionsProps> = ({ drop }) => {
  return (
    <>
      {drop.reactions?.map((reaction) => (
        <WaveDropReaction
          key={`${reaction.reaction}-${reaction.profiles.length}`}
          drop={drop}
          reaction={reaction}
        />
      ))}
    </>
  );
};

export function WaveDropReaction({
  drop,
  reaction,
}: {
  readonly drop: ApiDrop;
  readonly reaction: ApiDropReaction;
}) {
  const { setToast, connectedProfile } = useAuth();
  const { emojiMap, findNativeEmoji } = useEmoji();

  // initial
  const initialTotal = reaction.profiles.length;
  const initialTotalRef = useRef(initialTotal);

  const initialSelected =
    reaction.reaction === drop.context_profile_context?.reaction;
  const [total, setTotal] = useState(initialTotal);
  const [selected, setSelected] = useState(initialSelected);
  const [handles, setHandles] = useState(
    reaction.profiles.map((p) => p.handle ?? p.id)
  );
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (total !== initialTotalRef.current) {
      setAnimate(true);
      const timeout = setTimeout(() => setAnimate(false), 100);
      return () => clearTimeout(timeout);
    }
  }, [total]);

  // derive emoji ID
  const emojiId = useMemo(
    () => reaction.reaction.replaceAll(":", ""),
    [reaction.reaction]
  );

  // small + tooltip emoji nodes
  const { emojiNode, emojiNodeTooltip } = useMemo(() => {
    const custom = emojiMap
      .flatMap((cat) => cat.emojis)
      .find((e) => e.id === emojiId);

    if (custom) {
      return {
        emojiNode: (
          <img
            src={custom.skins[0].src}
            alt={emojiId}
            className="tw-max-w-4 tw-max-h-4 tw-object-contain"
          />
        ),
        emojiNodeTooltip: (
          <img
            src={custom.skins[0].src}
            alt={emojiId}
            className="tw-max-w-8 tw-max-h-8 tw-object-contain tw-rounded-sm"
          />
        ),
      };
    }

    const native = findNativeEmoji(emojiId);
    if (native) {
      return {
        emojiNode: (
          <span className="tw-text-[1rem] tw-flex tw-items-center tw-justify-center">
            {native.skins[0].native}
          </span>
        ),
        emojiNodeTooltip: (
          <span className="tw-text-2xl tw-flex tw-items-center tw-justify-center">
            {native.skins[0].native}
          </span>
        ),
      };
    }

    return { emojiNode: null, emojiNodeTooltip: null };
  }, [emojiId, emojiMap, findNativeEmoji]);

  // click handler: wait for API, then update via stream
  const handleClick = useCallback(async () => {
    // optimistic update
    setSelected((s) => !s);
    setTotal((n) => n + (selected ? -1 : +1));
    if (selected) {
      setHandles((h) => h.filter((h) => h !== connectedProfile?.handle));
    } else {
      setHandles((h) => [...h, connectedProfile?.handle ?? ""]);
    }

    try {
      const body = { reaction: reaction.reaction };
      const endpoint = `drops/${drop.id}/reaction`;
      if (selected) {
        await commonApiDelete({
          endpoint,
        });
      } else {
        await commonApiPost<ApiAddReactionToDropRequest, ApiDrop>({
          endpoint,
          body,
        });
      }
    } catch (error) {
      let msg = selected ? "Error removing reaction" : "Error adding reaction";
      if (typeof error === "string") msg = error;
      setToast({ message: msg, type: "error" });

      // optimistic revert
      setSelected((s) => !s);
      setTotal((n) => n + (selected ? +1 : -1));
      if (!selected) {
        setHandles((h) => h.filter((h) => h !== connectedProfile?.handle));
      } else {
        setHandles((h) => [...h, connectedProfile?.handle ?? ""]);
      }
    }
  }, [selected, drop.id, reaction.reaction, setToast]);

  // tooltip text
  const tooltipText = useMemo(() => {
    const limit = 12;
    const truncate = (handle: string) =>
      handle.length > limit ? handle.slice(0, limit) + "…" : handle;

    const truncatedHandles = handles.map(truncate);

    if (total <= 3) return truncatedHandles.join(", ");
    return `${truncatedHandles.slice(0, 3).join(", ")} and ${total - 3} more`;
  }, [handles, total]);

  // styles
  const borderStyle = selected ? "tw-border-primary-500" : "tw-border-iron-700";
  const bgStyle = selected ? "tw-bg-primary-500/10" : "tw-bg-iron-900/40";
  const hoverStyle = selected
    ? "hover:tw-border-primary-500 hover:tw-bg-primary-500/10"
    : "hover:tw-border-iron-500 hover:tw-bg-iron-900/40";
  let animationStyle = "";
  if (animate) {
    if (selected) {
      animationStyle = styles.reactionSlideUp;
    } else {
      animationStyle = styles.reactionSlideDown;
    }
  }

  if (!emojiNode || total === 0) return null;
  return (
    <>
      <button
        onClick={handleClick}
        data-tooltip-id={`reaction-${drop.id}-${emojiId}`}
        className={clsx(
          "tw-inline-flex tw-items-center tw-gap-x-2 tw-mt-1 tw-py-1 tw-px-2 tw-rounded-lg tw-shadow-sm tw-border tw-border-solid hover:tw-text-iron-100",
          borderStyle,
          bgStyle,
          hoverStyle
        )}>
        <div className="tw-flex tw-items-center tw-gap-x-1 tw-h-full">
          <div className="tw-w-5 tw-h-5 tw-flex-shrink-0 tw-flex tw-items-center tw-justify-center">
            {emojiNode}
          </div>
          <span
            className={clsx(
              "tw-text-xs tw-font-normal tw-min-w-[2ch]",
              animationStyle
            )}>
            {formatLargeNumber(total)}
          </span>
        </div>
      </button>
      <Tooltip
        id={`reaction-${drop.id}-${emojiId}`}
        delayShow={250}
        place="bottom"
        opacity={1}
        style={{ backgroundColor: "#37373E", color: "white", zIndex: 50 }}>
        <div className="tw-flex tw-items-center tw-gap-2">
          {emojiNodeTooltip}
          <span className="tw-whitespace-nowrap">by {tooltipText}</span>
        </div>
      </Tooltip>
    </>
  );
}

export default WaveDropReactions;
