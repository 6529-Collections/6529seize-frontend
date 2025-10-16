"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { TypeOptions } from "react-toastify";
import { useMutation } from "@tanstack/react-query";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";
import { commonApiPost } from "@/services/api/common-api";
import { WaveGroupType } from "../../../WaveGroup";
import { getScopedGroup, isGroupAuthor } from "../utils/waveGroupEdit";

type RequestAuth = () => Promise<{ success: boolean }>;

type SetToast = (options: {
  message: string | ReactNode;
  type: TypeOptions;
}) => void;

interface UseWaveGroupEditButtonsControllerProps {
  readonly haveGroup: boolean;
  readonly wave: ApiWave;
  readonly type: WaveGroupType;
  readonly connectedProfile: ApiIdentity | null;
  readonly requestAuth: RequestAuth;
  readonly setToast: SetToast;
  readonly onWaveCreated: () => void;
}

export interface WaveGroupEditButtonsController {
  readonly mutating: boolean;
  readonly showIncludeModal: boolean;
  readonly showExcludeModal: boolean;
  readonly openIncludeModal: () => void;
  readonly closeIncludeModal: () => void;
  readonly openExcludeModal: () => void;
  readonly closeExcludeModal: () => void;
  readonly canIncludeIdentity: boolean;
  readonly canExcludeIdentity: boolean;
  readonly shouldAllowRemove: boolean;
  readonly registerEditTrigger: (open: () => void) => void;
  readonly triggerEdit: () => void;
  readonly registerRemoveTrigger: (open: () => void) => void;
  readonly triggerRemove: () => void;
  readonly onEdit: (body: ApiUpdateWaveRequest) => Promise<void>;
}

export const useWaveGroupEditButtonsController = ({
  haveGroup,
  wave,
  type,
  connectedProfile,
  requestAuth,
  setToast,
  onWaveCreated,
}: UseWaveGroupEditButtonsControllerProps): WaveGroupEditButtonsController => {
  const [mutating, setMutating] = useState(false);
  const [showIncludeModal, setShowIncludeModal] = useState(false);
  const [showExcludeModal, setShowExcludeModal] = useState(false);
  const openEditRef = useRef<(() => void) | null>(null);
  const openRemoveRef = useRef<(() => void) | null>(null);

  const scopedGroup = useMemo(
    () => getScopedGroup(wave, type),
    [wave, type],
  );

  const hasGroup = scopedGroup !== null;
  const isWaveAdmin =
    wave.wave.authenticated_user_eligible_for_admin ?? false;

  const isAuthor = useMemo(
    () => isGroupAuthor(scopedGroup, connectedProfile),
    [scopedGroup, connectedProfile],
  );

  const canIncludeIdentity = hasGroup && (isWaveAdmin || isAuthor);
  const canExcludeIdentity =
    isWaveAdmin || isAuthor || !hasGroup;
  const shouldAllowRemove =
    haveGroup && type !== WaveGroupType.ADMIN;

  const editWaveMutation = useMutation({
    mutationFn: async (body: ApiUpdateWaveRequest) =>
      await commonApiPost<ApiUpdateWaveRequest, ApiWave>({
        endpoint: `waves/${wave.id}`,
        body,
      }),
    onSuccess: () => {
      onWaveCreated();
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
    },
    onSettled: () => {
      setMutating(false);
    },
  });

  const onEdit = useCallback(
    async (body: ApiUpdateWaveRequest) => {
      setMutating(true);
      const { success } = await requestAuth();
      if (!success) {
        setToast({
          type: "error",
          message: "Failed to authenticate",
        });
        setMutating(false);
        return;
      }
      await editWaveMutation.mutateAsync(body);
    },
    [editWaveMutation, requestAuth, setToast],
  );

  useEffect(() => {
    if (!haveGroup || type === WaveGroupType.ADMIN) {
      openRemoveRef.current = null;
    }
  }, [haveGroup, type]);

  const registerEditTrigger = useCallback((open: () => void) => {
    openEditRef.current = open;
  }, []);

  const triggerEdit = useCallback(() => {
    openEditRef.current?.();
  }, []);

  const registerRemoveTrigger = useCallback((open: () => void) => {
    openRemoveRef.current = open;
  }, []);

  const triggerRemove = useCallback(() => {
    openRemoveRef.current?.();
  }, []);

  const openIncludeModal = useCallback(() => {
    setShowIncludeModal(true);
  }, []);

  const closeIncludeModal = useCallback(() => {
    setShowIncludeModal(false);
  }, []);

  const openExcludeModal = useCallback(() => {
    setShowExcludeModal(true);
  }, []);

  const closeExcludeModal = useCallback(() => {
    setShowExcludeModal(false);
  }, []);

  return {
    mutating,
    showIncludeModal,
    showExcludeModal,
    openIncludeModal,
    closeIncludeModal,
    openExcludeModal,
    closeExcludeModal,
    canIncludeIdentity,
    canExcludeIdentity,
    shouldAllowRemove,
    registerEditTrigger,
    triggerEdit,
    registerRemoveTrigger,
    triggerRemove,
    onEdit,
  };
};
