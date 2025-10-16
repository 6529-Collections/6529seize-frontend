"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

export enum WaveGroupIdentitiesModal {
  INCLUDE = "include",
  EXCLUDE = "exclude",
}

export interface WaveGroupEditButtonsController {
  readonly mutating: boolean;
  readonly canIncludeIdentity: boolean;
  readonly canExcludeIdentity: boolean;
  readonly canRemoveGroup: boolean;
  readonly activeIdentitiesModal: WaveGroupIdentitiesModal | null;
  readonly openIdentitiesModal: (modal: WaveGroupIdentitiesModal) => void;
  readonly closeIdentitiesModal: () => void;
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
  const [activeIdentitiesModal, setActiveIdentitiesModal] =
    useState<WaveGroupIdentitiesModal | null>(null);
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
  const canRemoveGroup =
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
    if (
      (activeIdentitiesModal === WaveGroupIdentitiesModal.INCLUDE &&
        !canIncludeIdentity) ||
      (activeIdentitiesModal === WaveGroupIdentitiesModal.EXCLUDE &&
        !canExcludeIdentity)
    ) {
      setActiveIdentitiesModal(null);
    }
  }, [activeIdentitiesModal, canIncludeIdentity, canExcludeIdentity]);

  const openIdentitiesModal = useCallback(
    (modal: WaveGroupIdentitiesModal) => {
      setActiveIdentitiesModal(modal);
    },
    [],
  );

  const closeIdentitiesModal = useCallback(() => {
    setActiveIdentitiesModal(null);
  }, []);

  return {
    mutating,
    canIncludeIdentity,
    canExcludeIdentity,
    canRemoveGroup,
    activeIdentitiesModal,
    openIdentitiesModal,
    closeIdentitiesModal,
    onEdit,
  };
};
