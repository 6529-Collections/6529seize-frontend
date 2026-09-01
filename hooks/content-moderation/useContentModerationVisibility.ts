"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";
import { areSameProfileIdentity } from "@/helpers/ProfileHelpers";
import {
  getDropHiddenOverride,
  getGlobalDropModerationOverride,
  getProfileBlockedOverride,
  subscribeToContentModerationState,
} from "@/services/content-moderation/content-moderation-state";
import { useCallback, useState, useSyncExternalStore } from "react";
import { useAuth } from "@/components/auth/Auth";

type ContentModerationVisibility =
  | { readonly kind: "visible" }
  | {
      readonly kind: "global";
      readonly status: ApiDropModerationStatus;
    }
  | {
      readonly kind: "author-global";
      readonly status: ApiDropModerationStatus;
    }
  | { readonly kind: "blocked" }
  | { readonly kind: "hidden" };

const getGlobalVisibility = (
  moderation: Pick<ApiDrop, "moderation">["moderation"],
  globalOverride: ApiDropModerationStatus | undefined,
  isAuthor: boolean
): ContentModerationVisibility | null => {
  if (moderation === undefined) {
    return {
      kind: "global",
      status: ApiDropModerationStatus.AiQuarantined,
    };
  }
  if (moderation.can_view === false) {
    return {
      kind: "global",
      status:
        moderation.status === ApiDropModerationStatus.Visible
          ? ApiDropModerationStatus.AiQuarantined
          : moderation.status,
    };
  }
  if (moderation.status !== ApiDropModerationStatus.Visible) {
    // can_view is viewer-scoped and may briefly outlive a profile switch.
    // Reconfirm the active identity before exposing any moderated body.
    return {
      kind: isAuthor ? "author-global" : "global",
      status: moderation.status,
    };
  }
  return globalOverride === undefined ||
    globalOverride === ApiDropModerationStatus.Visible
    ? null
    : { kind: "global", status: globalOverride };
};

export const useContentModerationVisibility = (
  drop: Pick<ApiDrop, "id" | "author" | "viewer_context" | "moderation">
): {
  readonly visibility: ContentModerationVisibility;
  readonly reveal: () => void;
  readonly hideAgain: () => void;
  readonly isRevealed: boolean;
} => {
  const { connectedProfile } = useAuth();
  const viewerProfileId = connectedProfile?.id ?? null;
  const getAuthorBlockedOverride = useCallback(
    () =>
      viewerProfileId
        ? getProfileBlockedOverride(viewerProfileId, drop.author.id)
        : undefined,
    [drop.author.id, viewerProfileId]
  );
  const getHiddenOverride = useCallback(
    () =>
      viewerProfileId
        ? getDropHiddenOverride(viewerProfileId, drop.id)
        : undefined,
    [drop.id, viewerProfileId]
  );
  const getGlobalOverride = useCallback(
    () => getGlobalDropModerationOverride(drop.id),
    [drop.id]
  );
  const authorBlockedOverride = useSyncExternalStore(
    subscribeToContentModerationState,
    getAuthorBlockedOverride,
    () => undefined
  );
  const dropHiddenOverride = useSyncExternalStore(
    subscribeToContentModerationState,
    getHiddenOverride,
    () => undefined
  );
  const globalOverride = useSyncExternalStore(
    subscribeToContentModerationState,
    getGlobalOverride,
    () => undefined
  );
  const authorBlocked =
    authorBlockedOverride ?? drop.viewer_context?.author_blocked ?? false;
  const dropHidden =
    dropHiddenOverride ?? drop.viewer_context?.drop_hidden ?? false;
  const isAuthor = areSameProfileIdentity({
    left: connectedProfile,
    right: drop.author,
  });
  // A personal reveal belongs to the current hidden/block state and resets
  // when that authoritative viewer state changes.
  const revealKey = `${viewerProfileId ?? "anonymous"}:${drop.id}:${authorBlocked}:${dropHidden}`;
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const isRevealed = revealedKey === revealKey;
  const globalVisibility = getGlobalVisibility(
    drop.moderation,
    globalOverride,
    isAuthor
  );
  if (globalVisibility !== null) {
    return {
      visibility: globalVisibility,
      reveal: () => undefined,
      hideAgain: () => undefined,
      isRevealed: false,
    };
  }

  if (authorBlocked) {
    return {
      visibility: { kind: "blocked" },
      reveal: () => setRevealedKey(revealKey),
      hideAgain: () => setRevealedKey(null),
      isRevealed,
    };
  }

  if (dropHidden) {
    return {
      visibility: { kind: "hidden" },
      reveal: () => setRevealedKey(revealKey),
      hideAgain: () => setRevealedKey(null),
      isRevealed,
    };
  }

  return {
    visibility: { kind: "visible" },
    reveal: () => setRevealedKey(revealKey),
    hideAgain: () => setRevealedKey(null),
    isRevealed,
  };
};
