import type { ApiWave } from "@/generated/models/ApiWave";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import { useDropPrivileges } from "@/hooks/useDropPriviledges";
import { useAuth } from "../auth/Auth";
import DropPlaceholder from "./DropPlaceholder";
import CreateDrop from "./CreateDrop";
import { DropMode, type CurationComposerVariant } from "./dropComposer.types";

export { DropMode } from "./dropComposer.types";

interface PrivilegedDropCreatorProps {
  readonly activeDrop: ActiveDropState | null;
  readonly onCancelReplyQuote: () => void;
  readonly onDropAddedToQueue: () => void;
  readonly onAllDropsAdded?: (() => void) | undefined;
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
}

export default function PrivilegedDropCreator({
  activeDrop,
  onCancelReplyQuote,
  wave,
  dropId,
  fixedDropMode,
  onAllDropsAdded,
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
}: PrivilegedDropCreatorProps) {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const { submissionRestriction, chatRestriction } = useDropPrivileges({
    isLoggedIn: !!connectedProfile?.handle,
    isProxy: !!activeProfileProxy,
    canChat: wave.chat.authenticated_user_eligible,
    canDrop: wave.participation.authenticated_user_eligible,
    chatDisabled: !wave.chat.enabled,
    submissionStarts: wave.participation.period?.min ?? null,
    submissionEnds: wave.participation.period?.max ?? null,
    maxDropsCount:
      wave.participation.no_of_applications_allowed_per_participant ?? null,
    identityDropsCount: wave.metrics.your_participation_drops_count,
  });

  if (submissionRestriction !== null && chatRestriction !== null) {
    return (
      <DropPlaceholder
        type="both"
        chatRestriction={chatRestriction}
        submissionRestriction={submissionRestriction}
      />
    );
  }

  if (fixedDropMode === DropMode.CHAT && chatRestriction !== null) {
    return <DropPlaceholder type="chat" chatRestriction={chatRestriction} />;
  }

  if (
    fixedDropMode === DropMode.PARTICIPATION &&
    submissionRestriction !== null
  ) {
    return (
      <DropPlaceholder
        type="submission"
        submissionRestriction={submissionRestriction}
      />
    );
  }

  return (
    <CreateDrop
      activeDrop={activeDrop}
      onCancelReplyQuote={onCancelReplyQuote}
      onAllDropsAdded={onAllDropsAdded}
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
    />
  );
}
