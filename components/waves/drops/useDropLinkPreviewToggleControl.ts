"use client";

import { useAuth } from "@/components/auth/Auth";
import type { LinkPreviewToggleControl } from "@/components/waves/LinkPreviewContext";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { commonApiPost } from "@/services/api/common-api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const URL_REGEX =
  /https?:\/\/(www\.)?[-a-z0-9@:%._+~#=]{1,256}\.[a-z0-9]{1,6}\b([-a-z0-9@:%_+.~#?&=/]*)/i;

function dropHasLinks(parts: ApiDrop["parts"] | undefined): boolean {
  const safeParts = Array.isArray(parts) ? parts : [];

  for (const dropPart of safeParts) {
    if (dropPart.content && URL_REGEX.test(dropPart.content)) {
      return true;
    }
  }

  return false;
}

export function useDropLinkPreviewToggleControl(
  drop?: ApiDrop
): LinkPreviewToggleControl | undefined {
  const { connectedProfile, activeProfileProxy, setToast } = useAuth();
  const myStream = useMyStreamOptional();
  const applyOptimisticDropUpdate = myStream?.applyOptimisticDropUpdate;
  const [isLoading, setIsLoading] = useState(false);
  const dropId = drop?.id;
  const dropWaveId = drop?.wave.id;
  const dropAuthorHandle = drop?.author.handle;
  const previewsHidden = drop?.hide_link_preview ?? false;
  const isTemporaryDrop = dropId?.startsWith("temp-") ?? false;
  const isAuthor =
    connectedProfile?.handle === dropAuthorHandle && !activeProfileProxy;
  const hasLinks = useMemo(() => dropHasLinks(drop?.parts), [drop?.parts]);
  const canToggle = Boolean(dropId && dropWaveId && !isTemporaryDrop);
  const toggleRuntimeRef = useRef({
    dropId,
    dropWaveId,
    canToggle,
    applyOptimisticDropUpdate,
    setToast,
  });
  const isToggleInFlightRef = useRef(false);

  useEffect(() => {
    toggleRuntimeRef.current = {
      dropId,
      dropWaveId,
      canToggle,
      applyOptimisticDropUpdate,
      setToast,
    };
  }, [dropId, dropWaveId, canToggle, applyOptimisticDropUpdate, setToast]);

  const handleToggleLinkPreviews = useCallback(async () => {
    const {
      dropId: currentDropId,
      dropWaveId: currentDropWaveId,
      canToggle: currentCanToggle,
      applyOptimisticDropUpdate: currentApplyOptimisticDropUpdate,
      setToast: currentSetToast,
    } = toggleRuntimeRef.current;

    if (
      !currentDropId ||
      !currentDropWaveId ||
      !currentCanToggle ||
      isToggleInFlightRef.current
    ) {
      return;
    }

    isToggleInFlightRef.current = true;
    setIsLoading(true);

    const rollbackHandle = currentApplyOptimisticDropUpdate?.({
      waveId: currentDropWaveId,
      dropId: currentDropId,
      update: (draft) => {
        if (draft.type !== DropSize.FULL) {
          return draft;
        }

        draft.hide_link_preview = !draft.hide_link_preview;
        return draft;
      },
    });

    try {
      await commonApiPost<Record<string, never>, ApiDrop>({
        endpoint: `drops/${currentDropId}/toggle-hide-link-preview`,
        body: {},
      });
    } catch (error) {
      rollbackHandle?.rollback();
      currentSetToast({
        message:
          typeof error === "string" ? error : "Failed to toggle link preview",
        type: "error",
      });
    } finally {
      isToggleInFlightRef.current = false;
      setIsLoading(false);
    }
  }, []);

  return useMemo(() => {
    if (!isAuthor || !hasLinks || !dropId) {
      return undefined;
    }

    return {
      canToggle,
      isHidden: previewsHidden,
      isLoading,
      label: previewsHidden ? "Show link previews" : "Hide link previews",
      onToggle: handleToggleLinkPreviews,
    };
  }, [
    isAuthor,
    hasLinks,
    dropId,
    canToggle,
    previewsHidden,
    isLoading,
    handleToggleLinkPreviews,
  ]);
}
