"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";
import {
  getContentModerationStateVersion,
  getDropHiddenOverride,
  getGlobalDropModerationOverride,
  getProfileBlockedOverride,
  subscribeToContentModerationState,
} from "@/services/content-moderation/content-moderation-state";
import { useState, useSyncExternalStore } from "react";
import { useAuth } from "@/components/auth/Auth";

type ContentModerationVisibility =
  | { readonly kind: "visible" }
  | {
      readonly kind: "global";
      readonly status: ApiDropModerationStatus;
    }
  | { readonly kind: "blocked" }
  | { readonly kind: "hidden" };

const getGlobalVisibility = (
  moderation: Pick<ApiDrop, "moderation">["moderation"],
  globalOverride: ApiDropModerationStatus | undefined
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
    return null;
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
  readonly isRevealed: boolean;
} => {
  useSyncExternalStore(
    subscribeToContentModerationState,
    getContentModerationStateVersion,
    () => 0
  );
  const { connectedProfile } = useAuth();
  const authorBlocked =
    (connectedProfile?.id
      ? getProfileBlockedOverride(connectedProfile.id, drop.author.id)
      : undefined) ??
    drop.viewer_context?.author_blocked ??
    false;
  const dropHidden =
    (connectedProfile?.id
      ? getDropHiddenOverride(connectedProfile.id, drop.id)
      : undefined) ??
    drop.viewer_context?.drop_hidden ??
    false;
  const revealKey = `${connectedProfile?.id ?? "anonymous"}:${drop.id}:${authorBlocked}:${dropHidden}`;
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const isRevealed = revealedKey === revealKey;
  const globalOverride = getGlobalDropModerationOverride(drop.id);
  const globalVisibility = getGlobalVisibility(drop.moderation, globalOverride);
  if (globalVisibility !== null) {
    return {
      visibility: globalVisibility,
      reveal: () => undefined,
      isRevealed: false,
    };
  }

  if (!isRevealed) {
    if (authorBlocked) {
      return {
        visibility: { kind: "blocked" },
        reveal: () => setRevealedKey(revealKey),
        isRevealed,
      };
    }

    if (dropHidden) {
      return {
        visibility: { kind: "hidden" },
        reveal: () => setRevealedKey(revealKey),
        isRevealed,
      };
    }
  }

  return {
    visibility: { kind: "visible" },
    reveal: () => setRevealedKey(revealKey),
    isRevealed,
  };
};
