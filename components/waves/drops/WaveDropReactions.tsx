"use client";

import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { useEmoji } from "@/contexts/EmojiContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import { useDropReactionView } from "@/hooks/drops/useDropReactionView";
import { fetchDropReactionDetailsV2 } from "@/services/api/wave-drops-v2-api";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import React, { useCallback, useMemo, useState } from "react";
import {
  getReactionCount,
  getReactionDetailsVersion,
  toProfileMin,
} from "./reaction-utils";
import WaveDropReaction from "./WaveDropReaction";

const WaveDropReactionsDetailDialog = dynamic(
  () => import("./WaveDropReactionsDetailDialog"),
  { ssr: false, loading: () => null }
);

interface WaveDropReactionsProps {
  readonly drop: ApiDrop;
}

const WaveDropReactions: React.FC<WaveDropReactionsProps> = ({ drop }) => {
  useDropReactionView(drop.id);
  const { connectedProfile, activeProfileProxy } = useAuth();
  const { emojiMap, findNativeEmoji, loadEmojiData } = useEmoji();
  const [dialog, setDialog] = useState<{
    readonly dropId: string;
    readonly reaction: string;
  } | null>(null);
  const [visibleTooltip, setVisibleTooltip] = useState<string | null>(null);
  const isTouchDevice = useIsTouchDevice();
  const dialogReaction = dialog?.dropId === drop.id ? dialog.reaction : null;
  const viewerKey = JSON.stringify([
    connectedProfile?.id,
    activeProfileProxy?.id,
  ]);
  const reactionVersion = useMemo(
    () =>
      getReactionDetailsVersion(
        drop.reactions,
        drop.context_profile_context?.reaction
      ),
    [drop.reactions, drop.context_profile_context?.reaction]
  );
  const { data: detailedReactions, isLoading: detailsLoading } = useQuery({
    queryKey: [QueryKey.DROP_REACTIONS, drop.id, viewerKey, reactionVersion],
    queryFn: ({ signal }) => fetchDropReactionDetailsV2(drop.id, signal),
    enabled:
      dialogReaction !== null ||
      drop.reactions.some(
        (reaction) => visibleTooltip === `${drop.id}:${reaction.reaction}`
      ),
    // Reopening also catches membership changes that leave the counts unchanged.
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[1] === drop.id &&
      previousQuery.queryKey[2] === viewerKey
        ? previous
        : undefined,
  });

  const reactionsWithDetails = useMemo(() => {
    const detailsByReaction = new Map(
      detailedReactions?.map((reaction) => [reaction.reaction, reaction])
    );
    const viewer = activeProfileProxy ? null : toProfileMin(connectedProfile);
    const viewerReaction = drop.context_profile_context?.reaction;

    return drop.reactions.map((reaction) => {
      let profiles = detailedReactions
        ? (detailsByReaction.get(reaction.reaction)?.profiles ?? [])
        : reaction.profiles;
      // Keep the viewer's optimistic choice authoritative while its write settles.
      if (viewer && viewerReaction !== undefined) {
        if (viewerReaction !== reaction.reaction) {
          profiles = profiles.filter((profile) => profile.id !== viewer.id);
        } else if (!profiles.some((profile) => profile.id === viewer.id)) {
          profiles = [...profiles, viewer];
        }
      }
      return { ...reaction, profiles, count: getReactionCount(reaction) };
    });
  }, [
    detailedReactions,
    drop.reactions,
    drop.context_profile_context?.reaction,
    connectedProfile,
    activeProfileProxy,
  ]);

  useQuery({
    queryKey: ["emoji-data", "wave-reactions"],
    queryFn: () => loadEmojiData().then(() => null),
    enabled: reactionsWithDetails.length > 0,
    staleTime: Infinity,
  });

  const handleTooltipOpenChange = useCallback(
    (reactionKey: string, isOpen: boolean) => {
      const tooltipKey = `${drop.id}:${reactionKey}`;
      setVisibleTooltip((current) => {
        if (isOpen) return tooltipKey;
        return current === tooltipKey ? null : current;
      });
    },
    [drop.id]
  );
  const handleOpenDialog = useCallback(
    (reaction: string) => setDialog({ dropId: drop.id, reaction }),
    [drop.id]
  );
  const handleCloseDialog = useCallback(() => setDialog(null), []);

  return (
    <>
      {reactionsWithDetails.map((reaction) => (
        <WaveDropReaction
          key={`${drop.id}-${reaction.reaction}`}
          drop={drop}
          emojiMap={emojiMap}
          findNativeEmoji={findNativeEmoji}
          reaction={reaction}
          onOpenDetailDialog={handleOpenDialog}
          onTooltipOpenChange={handleTooltipOpenChange}
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
