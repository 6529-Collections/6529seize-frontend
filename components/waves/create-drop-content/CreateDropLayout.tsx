import { useAuth } from "@/components/auth/Auth";
import type { SelectableIdentityOption } from "@/components/utils/input/profile-search/getSelectableIdentity";
import type { MissingRequirements } from "@/components/waves/utils/getMissingRequirements";
import type {
  CreateDropConfig,
  MentionedUser,
  MentionedWave,
  ReferencedNft,
} from "@/entities/IDrop";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted } from "@/generated/models/ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { EditorState } from "lexical";
import dynamic from "next/dynamic";
import type React from "react";
import CreateDropIdentityField from "../CreateDropIdentityField";
import CreateDropIdentityPickerModal from "../CreateDropIdentityPickerModal";
import type { CreateDropInputHandles } from "../CreateDropInput";
import type { CreateDropPollDraft } from "../CreateDropPoll";
import CreateDropReplyingWrapper from "../CreateDropReplyingWrapper";
import CreateDropComposer from "./CreateDropComposer";
import { exportComposerMarkdown } from "./exportComposerMarkdown";
import InlineIdentityPicker from "./InlineIdentityPicker";
import type {
  CreateDropMetadataType,
  MutableCurrentRef,
  UploadingFile,
} from "./types";
import { useWaveDraftPersistence } from "./useWaveDraftPersistence";

const TermsSignatureFlow = dynamic(
  () => import("../../terms/TermsSignatureFlow"),
  { loading: () => null }
);

export interface CreateDropLayoutProps {
  readonly activeDrop: ActiveDropState | null;
  readonly onCancelReplyQuote: () => void;
  readonly dropId: string | null;
  readonly submitting: boolean;
  readonly wave: ApiWave;
  readonly isApp: boolean;
  readonly isDropMode: boolean;
  readonly isStormModeActive: boolean;
  readonly showIdentityField: boolean;
  readonly showInlineIdentityPicker: boolean;
  readonly showModalIdentityPicker: boolean;
  readonly isIdentityPickerOpen: boolean;
  readonly showComposer: boolean;
  readonly identitySubmissionMode: ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted | null;
  readonly selectedIdentitySelection: SelectableIdentityOption | null;
  readonly viewerIdentity: SelectableIdentityOption | null;
  readonly showIdentityValidationMessage: boolean;
  readonly identityValidationMessage: string | null;
  readonly openIdentityPicker: () => void;
  readonly canExitDropMode: boolean;
  readonly dropModeToggleExitLabel: string | null;
  readonly closeIdentitySelectionPanel: () => void;
  readonly identityPickerErrorMessage: string | null;
  readonly canDismissIdentityPicker: boolean;
  readonly closeIdentityPicker: () => void;
  readonly handleIdentitySelection: (
    selection: SelectableIdentityOption
  ) => void;
  readonly setActionsContainerRef: (node: HTMLDivElement | null) => void;
  readonly isLinksSubmitBlocked: boolean;
  readonly canAddPart: boolean;
  readonly hasCurrentDraft: boolean;
  readonly isCompactLayout: boolean;
  readonly showOptions: boolean;
  readonly animateOptions: boolean;
  readonly missingRequirements: MissingRequirements;
  readonly canCreatePoll: boolean;
  readonly hasPoll: boolean;
  readonly handleFileChange: (newFiles: File[]) => void;
  readonly openMetadata: () => void;
  readonly togglePoll: () => void;
  readonly breakIntoStorm: () => void;
  readonly editingPartIndex: number | null;
  readonly onCancelPartEdit: () => void;
  readonly onEditPart: (partIndex: number) => void;
  readonly onMovePart: (partIndex: number, direction: -1 | 1) => void;
  readonly onRemovePart: (partIndex: number) => void;
  readonly onDiscardStorm: () => void;
  readonly handleSetShowOptions: (next: boolean) => void;
  readonly onGifDrop: (gif: string) => Promise<void>;
  readonly dropEditorRefreshKey: number;
  readonly createDropInputRef: MutableCurrentRef<CreateDropInputHandles | null>;
  readonly editorState: EditorState | null;
  readonly canMentionAll: boolean;
  readonly canSubmit: boolean;
  readonly handleEditorStateChange: (newEditorState: EditorState) => void;
  readonly handleEditorBlur: (event: React.FocusEvent<HTMLDivElement>) => void;
  readonly onReferencedNft: (newNft: ReferencedNft) => void;
  readonly onMentionedUser: (
    newUser: Omit<MentionedUser, "current_handle">
  ) => void;
  readonly onMentionedWave: (newWave: MentionedWave) => void;
  readonly canEditLastDropWithArrow: boolean;
  readonly handleRequestEditLastDrop: () => boolean;
  readonly initialMarkdown: string | null;
  readonly initialMarkdownKey: string | null;
  readonly onDrop: (resolvedMarkdown?: string) => Promise<void>;
  readonly pollDraft: CreateDropPollDraft | null;
  readonly pollQuestionError: string | null;
  readonly pollValidationError: string | null;
  readonly updatePollDraft: (value: CreateDropPollDraft) => void;
  readonly removePoll: () => void;
  readonly showCurationDropModeWarning: boolean;
  readonly canSubmitCurationUrl: boolean;
  readonly curationUrlSubmitRestrictionMessage: string | null;
  readonly onSwitchToDropMode: () => void;
  readonly isMetadataOpen: boolean;
  readonly metadata: CreateDropMetadataType[];
  readonly metadataErrorById: Record<string, string>;
  readonly onChangeKey: (params: { index: number; newKey: string }) => void;
  readonly onChangeValue: (params: {
    index: number;
    newValue: string | number | null;
  }) => void;
  readonly onAddMetadata: () => void;
  readonly onRemoveMetadata: (index: number) => void;
  readonly closeMetadata: () => void;
  readonly drop: CreateDropConfig | null;
  readonly files: File[];
  readonly uploadingFiles: UploadingFile[];
  readonly removeFile: (file: File, partIndex?: number) => void;
  readonly termsSignatureFlowEnabled: boolean;
  readonly suppressInitialHeightAnimation?: boolean | undefined;
}

export default function CreateDropLayout(props: CreateDropLayoutProps) {
  const {
    activeDrop,
    onCancelReplyQuote,
    dropId,
    submitting,
    wave,
    showIdentityField,
    showInlineIdentityPicker,
    showModalIdentityPicker,
    isIdentityPickerOpen,
    showComposer,
    identitySubmissionMode,
    selectedIdentitySelection,
    viewerIdentity,
    showIdentityValidationMessage,
    identityValidationMessage,
    openIdentityPicker,
    canExitDropMode,
    dropModeToggleExitLabel,
    closeIdentitySelectionPanel,
    identityPickerErrorMessage,
    canDismissIdentityPicker,
    closeIdentityPicker,
    handleIdentitySelection,
    termsSignatureFlowEnabled,
    suppressInitialHeightAnimation = false,
  } = props;
  const { setToast } = useAuth();
  const { initialDraftJson } = useWaveDraftPersistence({
    waveId: wave.id,
    activeDrop,
    editorState: props.editorState,
    dropEditorRefreshKey: props.dropEditorRefreshKey,
  });
  const locale = useBrowserLocale();
  const submitWithResolvedAliases = async () => {
    let expansion: Awaited<
      ReturnType<CreateDropInputHandles["expandMentionAliases"]>
    >;
    try {
      const expandMentionAliases =
        props.createDropInputRef.current?.expandMentionAliases;
      if (!expandMentionAliases) {
        throw new Error("Quick Tags are not ready yet.");
      }
      expansion = await expandMentionAliases();
    } catch {
      setToast({
        type: "error",
        title: t(locale, "waves.composer.mentionShortcuts.loadErrorTitle"),
        message: t(locale, "waves.composer.mentionShortcuts.loadErrorMessage"),
      });
      return;
    }
    if (!expansion.completed) return;
    await props.onDrop(exportComposerMarkdown(expansion.editorState));
  };
  const isChatClosed =
    wave.wave.type === ApiWaveType.Chat && !wave.chat.enabled;

  if (isChatClosed) {
    return (
      <div className="tw-w-full tw-flex-grow tw-rounded-lg tw-bg-iron-900 tw-p-4 tw-text-center tw-text-sm tw-font-medium tw-text-iron-500">
        Wave is closed
      </div>
    );
  }

  return (
    <div className="tw-flex tw-min-h-0 tw-flex-grow tw-flex-col">
      <CreateDropReplyingWrapper
        activeDrop={activeDrop}
        submitting={submitting}
        onCancelReplyQuote={onCancelReplyQuote}
        dropId={dropId}
        suppressInitialHeightAnimation={suppressInitialHeightAnimation}
      />
      {showIdentityField && (
        <CreateDropIdentityField
          mode={identitySubmissionMode!}
          selectedIdentity={selectedIdentitySelection}
          selfIdentity={viewerIdentity}
          disabled={submitting}
          errorMessage={
            showIdentityValidationMessage ? identityValidationMessage : null
          }
          onOpenPicker={openIdentityPicker}
          onClosePanel={
            canExitDropMode && dropModeToggleExitLabel === null
              ? closeIdentitySelectionPanel
              : undefined
          }
        />
      )}
      {showInlineIdentityPicker && (
        <InlineIdentityPicker
          mode={identitySubmissionMode!}
          selectedIdentity={selectedIdentitySelection}
          disabled={submitting}
          errorMessage={identityPickerErrorMessage}
          canClose={canDismissIdentityPicker}
          onClose={closeIdentityPicker}
          onSelect={handleIdentitySelection}
        />
      )}
      {showModalIdentityPicker && (
        <CreateDropIdentityPickerModal
          isOpen={isIdentityPickerOpen}
          mode={identitySubmissionMode!}
          selectedIdentity={selectedIdentitySelection}
          disabled={submitting}
          errorMessage={identityPickerErrorMessage}
          canClose={canDismissIdentityPicker}
          onClose={closeIdentityPicker}
          onSelect={handleIdentitySelection}
        />
      )}
      {showComposer && (
        <CreateDropComposer
          {...props}
          initialDraftJson={initialDraftJson}
          locale={locale}
          submitWithResolvedAliases={submitWithResolvedAliases}
        />
      )}
      <TermsSignatureFlow enabled={termsSignatureFlowEnabled} />
    </div>
  );
}
