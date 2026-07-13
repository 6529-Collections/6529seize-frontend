"use client";

import { useAuth } from "@/components/auth/Auth";
import { updateDropInCachedDrops } from "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops";
import { useEmoji } from "@/contexts/EmojiContext";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import type { ApiAddReactionToDropRequest } from "@/generated/models/ApiAddReactionToDropRequest";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropContextProfileContext } from "@/generated/models/ApiDropContextProfileContext";
import type { ApiDropReaction } from "@/generated/models/ApiDropReaction";
import { formatLargeNumber } from "@/helpers/Helpers";
import { recordReaction } from "@/helpers/reactions/reactionHistory";
import { buildTooltipId } from "@/helpers/tooltip.helpers";
import type { Drop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import {
  useCanonicalNotificationDropUpdate,
  useOptimisticNotificationDropReaction,
} from "@/hooks/drops/useOptimisticNotificationDropReaction";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import useLongPressInteraction from "@/hooks/useLongPressInteraction";
import { commonApiDelete, commonApiPost } from "@/services/api/common-api";
import { fetchDropByIdBatched } from "@/services/api/drop-api";
import { useWebsocketStatus } from "@/services/websocket/useWebSocketMessage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Tooltip } from "react-tooltip";
import {
  cloneReactionEntries,
  applyProfileReactionToEntries,
  getReactionErrorMessage,
  getReactionCount,
  removeUserFromReactions,
  toProfileMin,
} from "./reaction-utils";
import {
  beginReactionMutation,
  deriveReactionAction,
  recordReactionOptimisticApplied,
  recordReactionRequestFailed,
  recordReactionRequestSent,
  recordReactionRequestSucceeded,
  recordReactionRollbackApplied,
} from "@/utils/monitoring/dropReactionMonitoring";
import styles from "./WaveDropReactions.module.css";
import { fetchDropReactionDetailsV2 } from "@/services/api/wave-drops-v2-api";

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

type OptimisticRollback = (() => void) | null;
type OwnedOptimisticRollback = {
  readonly mutationId: string;
  readonly rollback: () => void;
} | null;

const combineRollbacks = (
  rollbacks: readonly OptimisticRollback[]
): OptimisticRollback => {
  const activeRollbacks = rollbacks.filter(
    (rollback): rollback is () => void => rollback !== null
  );

  if (activeRollbacks.length === 0) {
    return null;
  }

  return () => {
    for (const rollback of activeRollbacks) {
      rollback();
    }
  };
};

const toOwnedRollback = (
  mutationId: string,
  rollback: OptimisticRollback
): OwnedOptimisticRollback =>
  rollback === null ? null : { mutationId, rollback };

const clearRollbackForMutation = (
  rollbackRef: React.RefObject<OwnedOptimisticRollback>,
  mutationId: string
): void => {
  if (rollbackRef.current?.mutationId === mutationId) {
    rollbackRef.current = null;
  }
};

const runRollbackForMutation = (
  rollbackRef: React.RefObject<OwnedOptimisticRollback>,
  mutationId: string
): boolean => {
  if (rollbackRef.current?.mutationId !== mutationId) {
    return false;
  }

  rollbackRef.current.rollback();
  rollbackRef.current = null;
  return true;
};

const getReactionClassNames = ({
  animate,
  canReact,
  selected,
}: {
  readonly animate: boolean;
  readonly canReact: boolean;
  readonly selected: boolean;
}) => {
  let hoverStyle = "";
  if (canReact) {
    hoverStyle = selected
      ? "hover:tw-border-primary-500 hover:tw-bg-primary-500/10"
      : "hover:tw-border-iron-500 hover:tw-bg-iron-900/40";
  }

  let animationStyle = "";
  if (animate) {
    animationStyle = selected
      ? styles["reactionSlideUp"]!
      : styles["reactionSlideDown"]!;
  }

  return {
    borderStyle: selected ? "tw-border-primary-500" : "tw-border-iron-700",
    bgStyle: selected ? "tw-bg-primary-500/10" : "tw-bg-iron-900/40",
    hoverStyle,
    animationStyle,
  };
};

function ReactionTooltipContent({
  displayProfiles,
  isDetailsLoading,
  moreCount,
  onMoreClick,
  total,
}: {
  readonly displayProfiles: ApiDropReaction["profiles"];
  readonly isDetailsLoading: boolean;
  readonly moreCount: number;
  readonly onMoreClick: (e: React.MouseEvent) => void;
  readonly total: number;
}) {
  if (isDetailsLoading && displayProfiles.length === 0) {
    return <span className="tw-whitespace-nowrap">Loading reactions...</span>;
  }

  if (displayProfiles.length === 0) {
    return (
      <span className="tw-whitespace-nowrap">
        {formatLargeNumber(total)} {total === 1 ? "reaction" : "reactions"}
      </span>
    );
  }

  return (
    <span className="tw-whitespace-nowrap">
      by{" "}
      {displayProfiles.map((profile, index) => {
        const displayName = profile.handle ?? profile.id;
        const isLast = index === displayProfiles.length - 1;

        return (
          <span key={profile.id}>
            {profile.handle ? (
              <Link
                href={`/${profile.handle}`}
                className="tw-text-primary-400 tw-no-underline hover:tw-text-primary-300 hover:tw-underline"
                onClick={(e) => e.stopPropagation()}
              >
                {displayName}
              </Link>
            ) : (
              <span>{displayName}</span>
            )}
            {isLast ? null : ", "}
          </span>
        );
      })}
      {moreCount > 0 && (
        <>
          {" "}
          <button
            type="button"
            onClick={onMoreClick}
            className="tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 tw-text-primary-400 tw-underline hover:tw-text-primary-300"
          >
            and {moreCount} {moreCount === 1 ? "other" : "others"}
          </button>
        </>
      )}
    </span>
  );
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

function WaveDropReaction({
  drop,
  emojiMap,
  findNativeEmoji,
  reaction,
  onOpenDetailDialog,
  onLoadDetails,
  isDetailsLoading,
  isTouchDevice,
}: {
  readonly drop: ApiDrop;
  readonly emojiMap: ReturnType<typeof useEmoji>["emojiMap"];
  readonly findNativeEmoji: ReturnType<typeof useEmoji>["findNativeEmoji"];
  readonly reaction: ApiDropReaction;
  readonly onOpenDetailDialog: (reactionKey: string) => void;
  readonly onLoadDetails: () => Promise<void> | null;
  readonly isDetailsLoading: boolean;
  readonly isTouchDevice: boolean;
}) {
  const { setToast, connectedProfile, activeProfileProxy } = useAuth();
  const { applyOptimisticDropUpdate } = useMyStream();
  const queryClient = useQueryClient();
  const websocketStatus = useWebsocketStatus();
  const locale = useBrowserLocale();
  const rollbackRef = useRef<OwnedOptimisticRollback>(null);
  const canReact = Boolean(connectedProfile?.handle) && !activeProfileProxy;
  const applyOptimisticReactionToNotificationQueries =
    useOptimisticNotificationDropReaction({
      connectedProfile,
      contextProfileContext: drop.context_profile_context,
      dropId: drop.id,
    });
  const updateNotificationQueriesWithCanonicalDrop =
    useCanonicalNotificationDropUpdate({
      connectedProfile,
      dropId: drop.id,
    });

  const handleLongPressStart = useCallback(() => {
    onOpenDetailDialog(reaction.reaction);
  }, [onOpenDetailDialog, reaction.reaction]);

  const { longPressTriggered, touchHandlers } = useLongPressInteraction({
    hasTouchScreen: isTouchDevice,
    onInteractionStart: handleLongPressStart,
    longPressDuration: 400,
    // Allow the native click to fire on tap; we only need preventDefault when the long press actually triggers
    preventDefault: false,
  });

  const wrappedTouchHandlers = useMemo(
    () => ({
      onTouchStart: (e: React.TouchEvent) => {
        e.stopPropagation();
        touchHandlers.onTouchStart(e);
      },
      onTouchMove: (e: React.TouchEvent) => {
        e.stopPropagation();
        touchHandlers.onTouchMove(e);
      },
      onTouchEnd: (e: React.TouchEvent) => {
        e.stopPropagation();
        touchHandlers.onTouchEnd();
      },
      onTouchCancel: (e: React.TouchEvent) => {
        e.stopPropagation();
        touchHandlers.onTouchCancel();
      },
    }),
    [touchHandlers]
  );

  const [total, setTotal] = useState(() => getReactionCount(reaction));
  const [selected, setSelected] = useState(
    reaction.reaction === drop.context_profile_context?.reaction
  );
  const [animate, setAnimate] = useState(false);

  // Refs to track previous values for change detection
  const prevTotalRef = useRef(total);
  const prevContextReactionRef = useRef(drop.context_profile_context?.reaction);
  const prevProfilesRef = useRef(reaction.profiles);

  // Sync selected when context reaction changes from server
  useEffect(() => {
    if (
      drop.context_profile_context?.reaction === prevContextReactionRef.current
    ) {
      return;
    }

    prevContextReactionRef.current = drop.context_profile_context?.reaction;
    const isSelected =
      reaction.reaction === drop.context_profile_context?.reaction;
    const timeoutId = setTimeout(() => {
      setSelected((current) => (current === isSelected ? current : isSelected));
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [drop.context_profile_context?.reaction, reaction.reaction]);

  useEffect(() => {
    const nextTotal = getReactionCount(reaction);
    if (nextTotal === prevTotalRef.current) {
      return;
    }

    if (reaction.profiles !== prevProfilesRef.current) {
      prevProfilesRef.current = reaction.profiles;
    }

    const timeoutId = setTimeout(() => {
      setTotal((current) => (current === nextTotal ? current : nextTotal));
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [reaction]);

  // Trigger animation when total changes
  useEffect(() => {
    if (total === prevTotalRef.current) {
      return;
    }
    prevTotalRef.current = total;
    // Defer to avoid synchronous setState in effect
    const timeoutId = setTimeout(() => setAnimate(true), 0);
    return () => clearTimeout(timeoutId);
  }, [total]);

  useEffect(() => {
    if (!animate) return;
    const timeout = setTimeout(() => setAnimate(false), 100);
    return () => clearTimeout(timeout);
  }, [animate]);

  const emojiId = useMemo(
    () => reaction.reaction.replaceAll(":", ""),
    [reaction.reaction]
  );
  const tooltipId = buildTooltipId("reaction", drop.id, emojiId);

  const waveId = drop.wave.id;

  const { emojiNode, emojiNodeTooltip } = useMemo(() => {
    const custom = emojiMap
      .flatMap((cat) => cat.emojis)
      .find((e) => e.id === emojiId);

    const customSrc = custom?.skins[0]?.src;
    if (customSrc) {
      return {
        emojiNode: (
          <div className="tw-relative tw-size-4">
            <Image
              src={customSrc}
              alt={emojiId.replaceAll("_", " ")}
              fill
              sizes="16px"
              unoptimized
              className="tw-object-contain"
            />
          </div>
        ),
        emojiNodeTooltip: (
          <div className="tw-relative tw-size-8">
            <Image
              src={customSrc}
              alt={emojiId.replaceAll("_", " ")}
              fill
              sizes="32px"
              unoptimized
              className="tw-rounded-sm tw-object-contain"
            />
          </div>
        ),
      };
    }

    const native = findNativeEmoji(emojiId);
    if (native) {
      return {
        emojiNode: (
          <span className="tw-inline-flex tw-size-5 tw-items-center tw-justify-center tw-text-base tw-leading-none">
            {native.skins[0]?.native}
          </span>
        ),
        emojiNodeTooltip: (
          <span className="tw-inline-flex tw-size-8 tw-items-center tw-justify-center tw-text-2xl tw-leading-none">
            {native.skins[0]?.native}
          </span>
        ),
      };
    }

    return { emojiNode: null, emojiNodeTooltip: null };
  }, [emojiId, emojiMap, findNativeEmoji]);

  const applyOptimisticReactionChange = useCallback(
    (willSelect: boolean): OptimisticRollback => {
      if (!waveId) {
        return null;
      }

      const intendedReaction = willSelect ? reaction.reaction : null;
      const userProfileMin = toProfileMin(connectedProfile);

      const streamRollback =
        applyOptimisticDropUpdate({
          waveId,
          dropId: drop.id,
          update: (draft) => {
            if (draft.type !== DropSize.FULL) {
              return draft;
            }

            const reactions = cloneReactionEntries(draft.reactions);
            const userId = connectedProfile?.id ?? null;
            draft.reactions = userProfileMin
              ? applyProfileReactionToEntries({
                  entries: reactions,
                  nextReaction: intendedReaction,
                  previousReaction:
                    draft.context_profile_context?.reaction ??
                    drop.context_profile_context?.reaction ??
                    null,
                  profileMin: userProfileMin,
                })
              : removeUserFromReactions(reactions, userId);
            const existingContext: ApiDropContextProfileContext =
              draft.context_profile_context ??
                drop.context_profile_context ?? {
                  rating: 0,
                  min_rating: 0,
                  max_rating: 0,
                  reaction: null,
                  boosted: false,
                  bookmarked: false,
                  curatable: false,
                  curated: false,
                };

            draft.context_profile_context = {
              ...existingContext,
              reaction: intendedReaction,
            };

            return draft;
          },
        })?.rollback ?? null;
      const notificationRollback =
        applyOptimisticReactionToNotificationQueries(intendedReaction);

      return combineRollbacks([streamRollback, notificationRollback]);
    },
    [
      applyOptimisticDropUpdate,
      applyOptimisticReactionToNotificationQueries,
      connectedProfile,
      drop.id,
      waveId,
      drop.context_profile_context,
      reaction.reaction,
    ]
  );

  const refreshCanonicalDropAfterLatestFailure = useCallback(async () => {
    try {
      // Keep the recovery path defensive if no canonical drop is available.
      const apiDrop = (await fetchDropByIdBatched(drop.id)) as
        | ApiDrop
        | null
        | undefined;
      if (apiDrop === null || apiDrop === undefined) {
        return;
      }

      updateDropInCachedDrops(queryClient, apiDrop);
      updateNotificationQueriesWithCanonicalDrop(apiDrop);
      applyOptimisticDropUpdate({
        waveId,
        dropId: drop.id,
        update: (draft): Drop => {
          if (draft.type !== DropSize.FULL) {
            return draft;
          }

          return {
            ...apiDrop,
            type: DropSize.FULL,
            stableKey: draft.stableKey,
            stableHash: draft.stableHash,
          };
        },
      });
    } catch (error) {
      console.error(
        "Failed to refresh drop after failed reaction request:",
        error
      );
    }
  }, [
    applyOptimisticDropUpdate,
    drop.id,
    queryClient,
    updateNotificationQueriesWithCanonicalDrop,
    waveId,
  ]);

  const handleClick = useCallback(async () => {
    if (!canReact || longPressTriggered) {
      return;
    }

    const intendedReaction = selected ? null : reaction.reaction;

    const mutation = beginReactionMutation({
      dropId: drop.id,
      waveId,
      source: "chip",
      action: deriveReactionAction(
        drop.context_profile_context?.reaction ?? null,
        intendedReaction
      ),
      previousReaction: drop.context_profile_context?.reaction ?? null,
      intendedReaction,
      optimisticReaction: intendedReaction,
      profileId: connectedProfile?.id ?? null,
      websocketStatus,
    });

    setSelected((s) => !s);
    setTotal((n) => Math.max(0, n + (selected ? -1 : 1)));

    rollbackRef.current = toOwnedRollback(
      mutation.mutationId,
      applyOptimisticReactionChange(!selected)
    );
    recordReactionOptimisticApplied(mutation);

    if (!selected) {
      recordReaction(reaction.reaction);
    }

    try {
      const body = { reaction: reaction.reaction };
      const endpoint = `drops/${drop.id}/reaction`;
      if (selected) {
        recordReactionRequestSent(mutation, {
          endpoint,
          method: "DELETE",
        });
        await commonApiDelete({
          endpoint,
          errorMode: "structured",
        });
      } else {
        recordReactionRequestSent(mutation, {
          endpoint,
          method: "POST",
        });
        await commonApiPost<ApiAddReactionToDropRequest, ApiDrop>({
          endpoint,
          body,
          errorMode: "structured",
        });
      }
      const result = recordReactionRequestSucceeded(mutation);
      if (result.isLatestMutation) {
        clearRollbackForMutation(rollbackRef, mutation.mutationId);
      }
    } catch (error) {
      const result = recordReactionRequestFailed(mutation, error);
      if (!result.isLatestMutation) {
        return;
      }

      const msg = getReactionErrorMessage(
        error,
        selected ? "Error removing reaction" : "Error adding reaction",
        locale
      );
      setToast({ message: msg, type: "error" });

      setSelected((s) => !s);
      setTotal((n) => Math.max(0, n + (selected ? 1 : -1)));
      if (runRollbackForMutation(rollbackRef, mutation.mutationId)) {
        recordReactionRollbackApplied(mutation);
      }
      await refreshCanonicalDropAfterLatestFailure();
    }
  }, [
    applyOptimisticReactionChange,
    canReact,
    connectedProfile?.id,
    drop.id,
    drop.context_profile_context?.reaction,
    longPressTriggered,
    locale,
    reaction.reaction,
    refreshCanonicalDropAfterLatestFailure,
    selected,
    setToast,
    waveId,
    websocketStatus,
  ]);

  const tooltipProfiles = useMemo(() => {
    const displayProfiles = reaction.profiles.slice(0, 3);
    const moreCount = total > 3 ? total - 3 : 0;
    return { displayProfiles, moreCount };
  }, [reaction.profiles, total]);

  const handlePointerEnter = useCallback(() => {
    if (!isTouchDevice) {
      onLoadDetails()?.catch(() => undefined);
    }
  }, [isTouchDevice, onLoadDetails]);

  const handleMoreClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onOpenDetailDialog(reaction.reaction);
    },
    [onOpenDetailDialog, reaction.reaction]
  );

  const { animationStyle, bgStyle, borderStyle, hoverStyle } =
    getReactionClassNames({ animate, canReact, selected });
  const tooltipContent = (
    <ReactionTooltipContent
      displayProfiles={tooltipProfiles.displayProfiles}
      isDetailsLoading={isDetailsLoading}
      moreCount={tooltipProfiles.moreCount}
      onMoreClick={handleMoreClick}
      total={total}
    />
  );

  if (!emojiNode || total === 0) return null;
  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={!canReact}
        aria-disabled={!canReact}
        onMouseEnter={handlePointerEnter}
        onFocus={handlePointerEnter}
        {...(!isTouchDevice && { "data-tooltip-id": tooltipId })}
        data-text-selection-exclude="true"
        className={clsx(
          "tw-mt-1 tw-inline-flex tw-items-center tw-gap-x-2 tw-rounded-lg tw-border tw-border-solid tw-px-2 tw-py-1 tw-shadow-sm",
          canReact ? "hover:tw-text-iron-100" : "tw-cursor-default",
          borderStyle,
          bgStyle,
          hoverStyle
        )}
        {...wrappedTouchHandlers}
      >
        <div className="tw-flex tw-h-full tw-items-center tw-gap-x-1">
          <div className="tw-flex tw-size-5 tw-flex-shrink-0 tw-items-center tw-justify-center">
            {emojiNode}
          </div>
          <span
            className={clsx(
              "tw-min-w-[2ch] tw-text-xs tw-font-normal tw-leading-none",
              animationStyle
            )}
          >
            {formatLargeNumber(total)}
          </span>
        </div>
      </button>
      {!isTouchDevice && (
        <Tooltip
          id={tooltipId}
          delayShow={250}
          place="bottom"
          opacity={1}
          clickable
          style={{ backgroundColor: "#37373E", color: "white", zIndex: 50 }}
        >
          <div className="tw-flex tw-items-center tw-gap-2">
            {emojiNodeTooltip}
            {tooltipContent}
          </div>
        </Tooltip>
      )}
    </>
  );
}

export default WaveDropReactions;
