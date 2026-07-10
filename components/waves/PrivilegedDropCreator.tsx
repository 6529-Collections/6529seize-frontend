import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ChatRestriction, useDropPrivileges } from "@/hooks/useDropPriviledges";
import { useWaveEligibility } from "@/contexts/wave/WaveEligibilityContext";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { useAuth } from "../auth/Auth";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import { shouldShowUserSetUpProfileCta } from "../user/utils/set-up-profile/UserSetUpProfileCta";
import DropPlaceholder from "./DropPlaceholder";
import CreateDrop from "./CreateDrop";
import {
  DropMode,
  type CurationComposerVariant,
  type IdentityPickerPlacement,
} from "./dropComposer.types";

export { DropMode } from "./dropComposer.types";

interface PrivilegedDropCreatorProps {
  readonly activeDrop: ActiveDropState | null;
  readonly onCancelReplyQuote: () => void;
  readonly onReplyTargetUnavailable?: (() => void) | undefined;
  readonly onDropAddedToQueue: () => void;
  readonly onAllDropsAdded?: (() => void) | undefined;
  readonly onServerDropCreated?:
    | ((drop: ApiDrop) => Promise<void> | void)
    | undefined;
  readonly onExitFixedDropMode?: (() => void) | undefined;
  readonly wave: ApiWave;
  readonly dropId: string | null;
  readonly fixedDropMode: DropMode;
  readonly curationComposerVariant?: CurationComposerVariant | undefined;
  readonly initialCurationUrl?: string | null | undefined;
  readonly onSubmitCurationUrl?: ((url: string) => void) | undefined;
  readonly canSubmitCurationUrl?: boolean | undefined;
  readonly curationUrlSubmitRestrictionMessage?: string | null | undefined;
  readonly externalAttachmentDrop?:
    | {
        readonly token: number;
        readonly files: File[];
      }
    | null
    | undefined;
  readonly onExternalAttachmentDropConsumed?: (() => void) | undefined;
  readonly termsSignatureFlowEnabled?: boolean | undefined;
  readonly identityPickerPlacement?: IdentityPickerPlacement | undefined;
  readonly forceStandardDropComposer?: boolean | undefined;
  readonly focusOnInitialActiveDrop?: boolean | undefined;
}

export default function PrivilegedDropCreator({
  activeDrop,
  onCancelReplyQuote,
  onReplyTargetUnavailable,
  wave,
  dropId,
  fixedDropMode,
  onAllDropsAdded,
  onServerDropCreated,
  onExitFixedDropMode,
  onDropAddedToQueue,
  curationComposerVariant = "default",
  initialCurationUrl = null,
  onSubmitCurationUrl,
  canSubmitCurationUrl,
  curationUrlSubmitRestrictionMessage,
  externalAttachmentDrop,
  onExternalAttachmentDropConsumed,
  termsSignatureFlowEnabled = true,
  identityPickerPlacement = "modal",
  forceStandardDropComposer = false,
  focusOnInitialActiveDrop = false,
}: PrivilegedDropCreatorProps) {
  const queryClient = useQueryClient();
  const { connectedProfile, activeProfileProxy, fetchingProfile } = useAuth();
  const { address, hasValidWalletAuth } = useSeizeConnectContext();
  const { updateEligibility } = useWaveEligibility();
  const refreshWaveAfterSlowModeExpires = useCallback(() => {
    queryClient
      .invalidateQueries({
        queryKey: [QueryKey.WAVE, { wave_id: wave.id }],
      })
      .catch(() => undefined);
  }, [queryClient, wave.id]);

  const hasProfile = Boolean(connectedProfile?.handle);
  const hasWalletAuth = Boolean(address && hasValidWalletAuth !== false);
  const isProfileLoadingForWallet = Boolean(
    hasWalletAuth && fetchingProfile && !hasProfile && !activeProfileProxy
  );
  const shouldOfferProfileSetup =
    shouldShowUserSetUpProfileCta({
      address,
      connectedProfileHandle: connectedProfile?.handle,
      fetchingProfile,
      hasValidWalletAuth,
    }) && !activeProfileProxy;
  const profileSetupHref =
    shouldOfferProfileSetup && address
      ? `/${address.toLowerCase()}`
      : undefined;

  const { submissionRestriction, chatRestriction } = useDropPrivileges({
    isLoggedIn: hasProfile || isProfileLoadingForWallet,
    needsProfile: shouldOfferProfileSetup,
    isProxy: !!activeProfileProxy,
    canChat: wave.chat.authenticated_user_eligible,
    canDrop: wave.participation.authenticated_user_eligible,
    chatDisabled: !wave.chat.enabled,
    slowModeCooldownMs: wave.chat.slow_mode_cooldown_ms ?? null,
    nextDropAllowed: wave.chat.next_drop_allowed ?? null,
    submissionStarts: wave.participation.period?.min ?? null,
    submissionEnds: wave.participation.period?.max ?? null,
    maxDropsCount:
      wave.participation.no_of_applications_allowed_per_participant ?? null,
    identityDropsCount: wave.metrics.your_participation_drops_count,
    onSlowModeCooldownExpired: refreshWaveAfterSlowModeExpires,
  });
  const blockingChatRestriction =
    chatRestriction === ChatRestriction.SLOW_MODE ? null : chatRestriction;

  useEffect(() => {
    updateEligibility(wave.id, {
      authenticated_user_chat_restriction: chatRestriction,
    });
  }, [chatRestriction, updateEligibility, wave.id]);

  if (isProfileLoadingForWallet) {
    return null;
  }

  if (submissionRestriction !== null && blockingChatRestriction !== null) {
    return (
      <DropPlaceholder
        type="both"
        chatRestriction={blockingChatRestriction}
        submissionRestriction={submissionRestriction}
        profileSetupHref={profileSetupHref}
      />
    );
  }

  if (fixedDropMode === DropMode.CHAT && blockingChatRestriction !== null) {
    return (
      <DropPlaceholder
        type="chat"
        chatRestriction={blockingChatRestriction}
        profileSetupHref={profileSetupHref}
      />
    );
  }

  if (
    fixedDropMode === DropMode.PARTICIPATION &&
    submissionRestriction !== null
  ) {
    return (
      <DropPlaceholder
        type="submission"
        submissionRestriction={submissionRestriction}
        profileSetupHref={profileSetupHref}
      />
    );
  }

  return (
    <CreateDrop
      activeDrop={activeDrop}
      onCancelReplyQuote={onCancelReplyQuote}
      onReplyTargetUnavailable={onReplyTargetUnavailable}
      onAllDropsAdded={onAllDropsAdded}
      onServerDropCreated={onServerDropCreated}
      onExitFixedDropMode={onExitFixedDropMode}
      wave={wave}
      dropId={dropId}
      fixedDropMode={fixedDropMode}
      privileges={{
        submissionRestriction,
        chatRestriction,
      }}
      onDropAddedToQueue={onDropAddedToQueue}
      curationComposerVariant={curationComposerVariant}
      initialCurationUrl={initialCurationUrl}
      onSubmitCurationUrl={onSubmitCurationUrl}
      canSubmitCurationUrl={canSubmitCurationUrl}
      curationUrlSubmitRestrictionMessage={curationUrlSubmitRestrictionMessage}
      externalAttachmentDrop={externalAttachmentDrop}
      onExternalAttachmentDropConsumed={onExternalAttachmentDropConsumed}
      termsSignatureFlowEnabled={termsSignatureFlowEnabled}
      identityPickerPlacement={identityPickerPlacement}
      forceStandardDropComposer={forceStandardDropComposer}
      focusOnInitialActiveDrop={focusOnInitialActiveDrop}
    />
  );
}
