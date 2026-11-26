"use client";

import { useAuth } from "@/components/auth/Auth";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { useLayoutViewportLock } from "@/components/brain/my-stream/layout/LayoutContext";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import { DropMode } from "@/components/waves/dropComposer.types";
import { WaveDropCreate } from "@/components/waves/leaderboard/create/WaveDropCreate";
import Button from "@/components/utils/button/Button";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveCuration } from "@/generated/models/ApiWaveCuration";
import { addDropToCuration } from "@/hooks/drops/useDropCurationMembershipMutation";
import { COMMUNITY_CURATIONS_DROPS_QUERY_KEY } from "@/hooks/useCommunityCurationsDrops";
import { useWave } from "@/hooks/useWave";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useCapacitor from "@/hooks/useCapacitor";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import { t } from "@/i18n/messages";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useContext, useEffect, useRef, useState } from "react";

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
  const locale = useBrowserLocale();
  const { isCapacitor, isIos } = useCapacitor();
  const isMobileViewport = useIsMobileLayoutViewport();
  const isMobile = isCapacitor || isMobileViewport;
  const followsIosKeyboard = isCapacitor && isIos;
  useLayoutViewportLock(isOpen && followsIosKeyboard);
  const { setToast } = useAuth();
  const { invalidateDrops } = useContext(ReactQueryWrapperContext);
  const { isCurationWave } = useWave(wave);
  const hasCurationAddErrorRef = useRef(false);
  const composerFocusRef = useRef<HTMLElement | null>(null);
  const handleComposerRoot = useCallback((root: HTMLElement | null) => {
    composerFocusRef.current = root;
  }, []);
  const successfulCurationAddsRef = useRef(0);
  const [failedPostId, setFailedPostId] = useState<string | null>(null);
  const [isRetryingAdd, setIsRetryingAdd] = useState(false);

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
        setFailedPostId(drop.id);
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

  const retryAddToCuration = useCallback(async () => {
    if (!failedPostId || isRetryingAdd) {
      return;
    }

    setIsRetryingAdd(true);
    try {
      await addDropToCuration({
        dropId: failedPostId,
        body: { curation_id: curation.id },
      });
      setFailedPostId(null);
      hasCurationAddErrorRef.current = false;
      refreshDropCaches();
      setToast({
        type: "success",
        message: t(locale, "profileCuration.quickPost.retrySuccess"),
      });
      onClose();
    } catch {
      setToast({
        type: "error",
        message: t(locale, "profileCuration.quickPost.retryError"),
      });
    } finally {
      setIsRetryingAdd(false);
    }
  }, [
    curation.id,
    failedPostId,
    isRetryingAdd,
    locale,
    onClose,
    refreshDropCaches,
    setToast,
  ]);

  return (
    <MobileWrapperDialog
      title={
        isMobile
          ? t(locale, "profileCuration.quickPost.title")
          : `Add post to ${curation.name}`
      }
      subtitle={
        isMobile
          ? t(locale, "profileCuration.quickPost.subtitle", {
              curationName: curation.name,
            })
          : undefined
      }
      titleClassName={
        isMobile
          ? "tw-text-lg tw-font-semibold tw-text-iron-50"
          : "!tw-text-lg tw-font-semibold !tw-text-iron-100 md:!tw-text-xl"
      }
      isOpen={isOpen}
      onClose={onClose}
      noPadding
      tabletModal={true}
      tall={true}
      maxWidthClass="md:tw-max-w-2xl"
      headerClassName={
        isMobile
          ? "tw-mb-0 first:tw-pt-4 md:tw-pt-4"
          : "tw-mb-0 tw-border-b tw-border-solid tw-border-x-0 tw-border-t-0 tw-border-white/[0.06] tw-py-4"
      }
      focusTitleOnOpen={false}
      initialFocusRef={isMobile ? composerFocusRef : undefined}
      keyboardTransitionEasing={
        followsIosKeyboard
          ? "var(--native-keyboard-layout-transition-easing, ease-out)"
          : undefined
      }
    >
      <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col">
        <div
          className={
            isMobile
              ? "tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-px-4 tw-pb-4 tw-pt-4"
              : "tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-px-4 tw-py-5 sm:tw-px-6"
          }
        >
          <WaveDropCreate
            autoFocus={isMobile}
            onAutoFocusRoot={isMobile ? handleComposerRoot : undefined}
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
          {failedPostId && (
            <div
              role="alert"
              className="tw-mt-4 tw-flex tw-flex-col tw-items-start tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-amber-400/25 tw-bg-amber-400/10 tw-p-4 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between"
            >
              <p className="tw-mb-0 tw-text-md tw-font-normal tw-leading-6 tw-text-amber-100">
                {t(locale, "profileCuration.quickPost.partialInline")}
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={isRetryingAdd}
                onClick={() => void retryAddToCuration()}
                className="tw-flex-shrink-0"
              >
                {t(locale, "profileCuration.quickPost.retry")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </MobileWrapperDialog>
  );
}
