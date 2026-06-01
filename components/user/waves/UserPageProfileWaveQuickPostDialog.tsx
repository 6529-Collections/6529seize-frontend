"use client";

import { useAuth } from "@/components/auth/Auth";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import { DropMode } from "@/components/waves/dropComposer.types";
import { WaveDropCreate } from "@/components/waves/leaderboard/create/WaveDropCreate";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveCuration } from "@/generated/models/ApiWaveCuration";
import { addDropToCuration } from "@/hooks/drops/useDropCurationMembershipMutation";
import { COMMUNITY_CURATIONS_DROPS_QUERY_KEY } from "@/hooks/useCommunityCurationsDrops";
import { useWave } from "@/hooks/useWave";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useContext, useEffect, useRef } from "react";

const PARTIAL_SUCCESS_ERROR =
  "Post created, but it could not be added to this curation.";

export default function UserPageProfileWaveQuickPostDialog({
  wave,
  curation,
  isOpen,
  onClose,
}: {
  readonly wave: ApiWave;
  readonly curation: ApiWaveCuration;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { setToast } = useAuth();
  const { invalidateDrops } = useContext(ReactQueryWrapperContext);
  const { isCurationWave } = useWave(wave);
  const hasCurationAddErrorRef = useRef(false);
  const successfulCurationAddsRef = useRef(0);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    hasCurationAddErrorRef.current = false;
    successfulCurationAddsRef.current = 0;
  }, [curation.id, isOpen]);

  const refreshDropCaches = useCallback(() => {
    invalidateDrops();
    void queryClient
      .invalidateQueries({
        queryKey: [QueryKey.DROPS],
      })
      .catch(() => undefined);
    void queryClient
      .invalidateQueries({
        queryKey: [QueryKey.DROPS_LEADERBOARD],
      })
      .catch(() => undefined);
    void queryClient
      .invalidateQueries({
        queryKey: [COMMUNITY_CURATIONS_DROPS_QUERY_KEY],
      })
      .catch(() => undefined);
  }, [invalidateDrops, queryClient]);

  const handleServerDropCreated = useCallback(
    async (drop: ApiDrop) => {
      try {
        await addDropToCuration({
          dropId: drop.id,
          body: {
            curation_id: curation.id,
          },
        });
        successfulCurationAddsRef.current += 1;
      } catch {
        if (!hasCurationAddErrorRef.current) {
          setToast({
            type: "error",
            message: PARTIAL_SUCCESS_ERROR,
          });
        }
        hasCurationAddErrorRef.current = true;
      }
    },
    [curation.id, setToast]
  );

  const handleAllDropsAdded = useCallback(() => {
    if (successfulCurationAddsRef.current > 0) {
      refreshDropCaches();
    }

    successfulCurationAddsRef.current = 0;

    if (hasCurationAddErrorRef.current) {
      hasCurationAddErrorRef.current = false;
      return;
    }

    setToast({
      type: "success",
      message: "Post added to curation.",
    });
    onClose();
  }, [onClose, refreshDropCaches, setToast]);

  const handleExitFixedDropMode = useCallback(() => undefined, []);

  return (
    <MobileWrapperDialog
      title={`Add post to ${curation.name}`}
      isOpen={isOpen}
      onClose={onClose}
      noPadding
      tabletModal={true}
      tall={true}
      maxWidthClass="md:tw-max-w-2xl"
      headerClassName="tw-mb-0 tw-border-b tw-border-solid tw-border-x-0 tw-border-t-0 tw-border-white/[0.06] tw-pb-4 tw-pt-6"
    >
      <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col">
        <div className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-px-4 tw-py-5 sm:tw-px-6">
          <WaveDropCreate
            wave={wave}
            onCancel={onClose}
            onSuccess={handleAllDropsAdded}
            onServerDropCreated={handleServerDropCreated}
            onExitFixedDropMode={handleExitFixedDropMode}
            title="Add post"
            isModalContent={true}
            identityPickerPlacement="inline"
            forceStandardDropComposer={isCurationWave}
            fixedDropMode={DropMode.CHAT}
          />
        </div>
      </div>
    </MobileWrapperDialog>
  );
}
