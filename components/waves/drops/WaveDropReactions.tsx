"use client";

import { useEmoji } from "@/contexts/EmojiContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropReaction } from "@/generated/models/ApiDropReaction";


import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getReactionCount,
} from "./reaction-utils";


import { fetchDropReactionDetailsV2 } from "@/services/api/wave-drops-v2-api";
import WaveDropReaction from "./WaveDropReaction";

const WaveDropReactionsDetailDialog = dynamic(
  () => import("./WaveDropReactionsDetailDialog"),
  { ssr: false, loading: () => null }
);

interface WaveDropReactionsProps {
  readonly drop: ApiDrop;
}

interface DetailedReactionsState {
  readonly dropId: string;
  readonly reactions: ApiDropReaction[];
}

const WaveDropReactions: React.FC<WaveDropReactionsProps> = ({ drop }) => {
  const { emojiMap, findNativeEmoji, loadEmojiData } = useEmoji();
  const [dialogReaction, setDialogReaction] = useState<string | null>(null);
  const [detailedReactionsState, setDetailedReactionsState] =
    useState<DetailedReactionsState | null>(null);
  const [detailsLoadingDropId, setDetailsLoadingDropId] = useState<
    string | null
  >(null);
  const detailsRequestRef = useRef<{
    readonly dropId: string;
    readonly promise: Promise<void>;
  } | null>(null);
  const isTouchDevice = useIsTouchDevice();
  const detailedReactions =
    detailedReactionsState?.dropId === drop.id
      ? detailedReactionsState.reactions
      : null;
  const detailsLoading = detailsLoadingDropId === drop.id;
  const dropReactions = drop.reactions;

  const reactionsWithDetails = useMemo(() => {
    if (!detailedReactions) {
      return dropReactions;
    }

    const detailsByReaction = new Map(
      detailedReactions.map((reaction) => [reaction.reaction, reaction])
    );

    return dropReactions.map((reaction) => {
      const detailedReaction = detailsByReaction.get(reaction.reaction);
      if (!detailedReaction) {
        return reaction;
      }
      const profilesById = new Map(
        detailedReaction.profiles.map((profile) => [profile.id, profile])
      );
      for (const profile of reaction.profiles) {
        profilesById.set(profile.id, profile);
      }

      return {
        ...reaction,
        profiles: [...profilesById.values()],
        count: getReactionCount(reaction),
      };
    });
  }, [detailedReactions, dropReactions]);

  useQuery({
    queryKey: ["emoji-data", "wave-reactions"],
    queryFn: () => loadEmojiData().then(() => null),
    enabled: reactionsWithDetails.length > 0,
    staleTime: Infinity,
  });

  const loadReactionDetails = useCallback(() => {
    if (detailedReactions) {
      return null;
    }

    if (detailsRequestRef.current?.dropId === drop.id) {
      return detailsRequestRef.current.promise;
    }

    const requestDropId = drop.id;
    const request = (async () => {
      setDetailsLoadingDropId(requestDropId);
      try {
        const reactions = await fetchDropReactionDetailsV2(requestDropId);
        setDetailedReactionsState({ dropId: requestDropId, reactions });
      } catch {
        setDetailedReactionsState({ dropId: requestDropId, reactions: [] });
      } finally {
        setDetailsLoadingDropId((current) =>
          current === requestDropId ? null : current
        );
        detailsRequestRef.current = null;
      }
    })();

    detailsRequestRef.current = { dropId: requestDropId, promise: request };
    return request;
  }, [detailedReactions, drop.id]);

  const handleOpenDialog = useCallback(
    (reactionKey: string) => {
      setDialogReaction(reactionKey);
      loadReactionDetails()?.catch(() => undefined);
    },
    [loadReactionDetails]
  );

  const handleCloseDialog = useCallback(() => {
    setDialogReaction(null);
  }, []);

  return (
    <>
      {reactionsWithDetails.map((reaction) => (
        <WaveDropReaction
          key={`${reaction.reaction}-${getReactionCount(reaction)}`}
          drop={drop}
          emojiMap={emojiMap}
          findNativeEmoji={findNativeEmoji}
          reaction={reaction}
          onOpenDetailDialog={handleOpenDialog}
          onLoadDetails={loadReactionDetails}
          isDetailsLoading={detailsLoading}
          isTouchDevice={isTouchDevice}
        />
      ))}
      {dialogReaction !== null && (
        <WaveDropReactionsDetailDialog
          isOpen
          onClose={handleCloseDialog}
          reactions={reactionsWithDetails}
          initialReaction={dialogReaction}
          isLoading={detailsLoading}
        />
      )}
    </>
  );
};

export default WaveDropReactions;
