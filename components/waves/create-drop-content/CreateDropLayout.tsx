import type {
  CreateDropConfig,
  MentionedUser,
  MentionedWave,
  ReferencedNft,
} from "@/entities/IDrop";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted } from "@/generated/models/ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { CHAT_LINK_RESTRICTION_MESSAGE } from "@/helpers/waves/chat-link-restriction.helpers";
import type { MissingRequirements } from "@/components/waves/utils/getMissingRequirements";
import type { SelectableIdentityOption } from "@/components/utils/input/profile-search/getSelectableIdentity";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import type { EditorState } from "lexical";
import dynamic from "next/dynamic";
import type React from "react";
import CreateDropActions from "../CreateDropActions";
import { CreateDropContentFiles } from "../CreateDropContentFiles";
import CreateDropContentRequirements from "../CreateDropContentRequirements";
import CreateDropIdentityField from "../CreateDropIdentityField";
import CreateDropIdentityPickerModal from "../CreateDropIdentityPickerModal";
import type { CreateDropInputHandles } from "../CreateDropInput";
import CreateDropInput from "../CreateDropInput";
import CreateDropMetadata from "../CreateDropMetadata";
import CreateDropPoll, { type CreateDropPollDraft } from "../CreateDropPoll";
import CreateDropReplyingWrapper from "../CreateDropReplyingWrapper";
import CreateDropStormParts from "../CreateDropStormParts";
import { CreateDropSubmit } from "../CreateDropSubmit";
import SlowModeChatNotice from "../SlowModeChatNotice";
import InlineIdentityPicker from "./InlineIdentityPicker";
import type {
  CreateDropMetadataType,
  MutableCurrentRef,
  UploadingFile,
} from "./types";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

const TermsSignatureFlow = dynamic(
  () => import("../../terms/TermsSignatureFlow"),
  { loading: () => null }
);

interface CreateDropLayoutProps {
  readonly activeDrop: ActiveDropState | null;
  readonly onCancelReplyQuote: () => void;
  readonly dropId: string | null;
  readonly submitting: boolean;
  readonly wave: ApiWave;
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
  readonly onDrop: () => Promise<void>;
  readonly pollDraft: CreateDropPollDraft | null;
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

export default function CreateDropLayout({
  activeDrop,
  onCancelReplyQuote,
  dropId,
  submitting,
  wave,
  isDropMode,
  isStormModeActive,
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
  setActionsContainerRef,
  isLinksSubmitBlocked,
  canAddPart,
  showOptions,
  animateOptions,
  missingRequirements,
  canCreatePoll,
  hasPoll,
  handleFileChange,
  openMetadata,
  togglePoll,
  breakIntoStorm,
  editingPartIndex,
  onCancelPartEdit,
  onEditPart,
  onMovePart,
  onRemovePart,
  onDiscardStorm,
  handleSetShowOptions,
  onGifDrop,
  dropEditorRefreshKey,
  createDropInputRef,
  editorState,
  canMentionAll,
  canSubmit,
  handleEditorStateChange,
  handleEditorBlur,
  onReferencedNft,
  onMentionedUser,
  onMentionedWave,
  canEditLastDropWithArrow,
  handleRequestEditLastDrop,
  initialMarkdown,
  initialMarkdownKey,
  onDrop,
  pollDraft,
  pollValidationError,
  updatePollDraft,
  removePoll,
  showCurationDropModeWarning,
  canSubmitCurationUrl,
  curationUrlSubmitRestrictionMessage,
  onSwitchToDropMode,
  isMetadataOpen,
  metadata,
  metadataErrorById,
  onChangeKey,
  onChangeValue,
  onAddMetadata,
  onRemoveMetadata,
  closeMetadata,
  drop,
  files,
  uploadingFiles,
  removeFile,
  termsSignatureFlowEnabled,
  suppressInitialHeightAnimation = false,
}: CreateDropLayoutProps) {
  const locale = useBrowserLocale();
  const isChatClosed =
    wave.wave.type === ApiWaveType.Chat && !wave.chat.enabled;
  const displayedStormPartNumber =
    editingPartIndex === null
      ? (drop?.parts.length ?? 0) + 1
      : editingPartIndex + 1;
  let submitLabel: string | undefined;
  if (isStormModeActive) {
    if (editingPartIndex !== null) {
      submitLabel = t(locale, "waves.stormComposer.saveChanges");
    } else if (canAddPart) {
      submitLabel = t(locale, "waves.stormComposer.addPart");
    } else {
      submitLabel = t(locale, "waves.stormComposer.postStorm");
    }
  }

  if (isChatClosed) {
    return (
      <div className="tw-w-full tw-flex-grow tw-rounded-lg tw-bg-iron-900 tw-p-4 tw-text-center tw-text-sm tw-font-medium tw-text-iron-500">
        Wave is closed
      </div>
    );
  }

  return (
    <div className="tw-flex-grow">
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
        <>
          {isStormModeActive && (drop?.parts.length ?? 0) > 0 && (
            <CreateDropStormParts
              parts={drop?.parts ?? []}
              mentionedUsers={drop?.mentioned_users ?? []}
              mentionedGroups={drop?.mentioned_groups ?? []}
              mentionedWaves={drop?.mentioned_waves ?? []}
              referencedNfts={drop?.referenced_nfts ?? []}
              editingPartIndex={editingPartIndex}
              controlsDisabled={submitting}
              canEditParts={!canAddPart && editingPartIndex === null}
              onEditPart={onEditPart}
              onCancelPartEdit={onCancelPartEdit}
              onMovePart={onMovePart}
              onRemovePart={onRemovePart}
              onDiscardStorm={onDiscardStorm}
            />
          )}
          <div className="tw-flex tw-w-full tw-items-end">
            <div
              ref={setActionsContainerRef}
              className="tw-grid tw-w-full tw-grid-cols-[auto_minmax(0,1fr)] tw-items-center tw-gap-x-2 lg:tw-gap-x-3"
            >
              <div className="tw-col-start-2 tw-row-start-1 tw-min-w-0">
                <SlowModeChatNotice wave={wave} isDropMode={isDropMode} />
                {isLinksSubmitBlocked && (
                  <p
                    className="tw-mb-2 tw-mt-0 tw-text-[11px] tw-font-medium tw-leading-4 tw-text-iron-400"
                    aria-live="polite"
                  >
                    {CHAT_LINK_RESTRICTION_MESSAGE}
                  </p>
                )}
              </div>
              <div className="tw-col-start-1 tw-row-start-2 tw-mb-1 tw-self-end">
                <CreateDropActions
                  isStormMode={isStormModeActive}
                  isDropMode={isDropMode}
                  canAddPart={canAddPart}
                  submitting={submitting}
                  showOptions={showOptions}
                  animateOptions={animateOptions}
                  isRequiredMetadataMissing={
                    !!missingRequirements.metadata.length
                  }
                  isRequiredMediaMissing={!!missingRequirements.media.length}
                  canCreatePoll={canCreatePoll}
                  isPollActive={hasPoll}
                  handleFileChange={handleFileChange}
                  onAddMetadataClick={openMetadata}
                  onTogglePoll={togglePoll}
                  breakIntoStorm={breakIntoStorm}
                  setShowOptions={handleSetShowOptions}
                  onGifDrop={onGifDrop}
                />
              </div>
              <div className="tw-col-start-2 tw-row-start-2 tw-w-full tw-min-w-0">
                <CreateDropInput
                  waveId={wave.id}
                  key={dropEditorRefreshKey}
                  ref={createDropInputRef}
                  editorState={editorState}
                  type={activeDrop?.action ?? null}
                  submitting={submitting}
                  isStormMode={isStormModeActive}
                  stormPartNumber={displayedStormPartNumber}
                  isDropMode={isDropMode}
                  canMentionAll={canMentionAll}
                  canSubmit={canSubmit}
                  onEditorState={handleEditorStateChange}
                  onEditorBlur={handleEditorBlur}
                  onReferencedNft={onReferencedNft}
                  onMentionedUser={onMentionedUser}
                  onMentionedWave={onMentionedWave}
                  onAttachmentFiles={handleFileChange}
                  canEditLastDropWithArrow={canEditLastDropWithArrow}
                  onRequestEditLastDrop={handleRequestEditLastDrop}
                  initialMarkdown={initialMarkdown}
                  initialMarkdownKey={initialMarkdownKey}
                  onDrop={onDrop}
                />
                {pollDraft && (
                  <CreateDropPoll
                    draft={pollDraft}
                    disabled={submitting}
                    validationError={pollValidationError}
                    onChange={updatePollDraft}
                    onRemove={removePoll}
                  />
                )}
                {showCurationDropModeWarning && (
                  <div className="tw-mt-2 tw-text-[11px] tw-leading-4 tw-text-amber-200/90">
                    This looks like a curation URL.{" "}
                    {canSubmitCurationUrl ? (
                      <button
                        type="button"
                        className="tw-border-0 tw-bg-transparent tw-p-0 tw-text-[11px] tw-font-medium tw-text-amber-300 tw-underline tw-transition desktop-hover:hover:tw-text-amber-100"
                        onClick={onSwitchToDropMode}
                      >
                        Submit it as a drop
                      </button>
                    ) : (
                      <span>{curationUrlSubmitRestrictionMessage}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="tw-ml-2 lg:tw-ml-3">
              <div className="tw-flex tw-items-center tw-gap-x-3">
                <CreateDropSubmit
                  submitting={submitting}
                  canSubmit={canSubmit}
                  onDrop={onDrop}
                  isDropMode={isDropMode}
                  label={submitLabel}
                  showLabelOnMobile={isStormModeActive}
                  disabledTooltip={
                    isLinksSubmitBlocked ? CHAT_LINK_RESTRICTION_MESSAGE : null
                  }
                />
              </div>
            </div>
          </div>
          {isDropMode && (
            <CreateDropContentRequirements
              canSubmit={canSubmit}
              wave={wave}
              missingMedia={missingRequirements.media}
              missingMetadata={missingRequirements.metadata}
              onOpenMetadata={openMetadata}
              setFiles={handleFileChange}
              disabled={submitting}
            />
          )}
          <LazyMotion features={domAnimation}>
            <AnimatePresence>
              {isDropMode && isMetadataOpen && (
                <m.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CreateDropMetadata
                    disabled={submitting}
                    onRemoveMetadata={onRemoveMetadata}
                    closeMetadata={closeMetadata}
                    metadata={metadata}
                    missingRequiredMetadataKeys={missingRequirements.metadata}
                    metadataErrorById={metadataErrorById}
                    onChangeKey={onChangeKey}
                    onChangeValue={onChangeValue}
                    onAddMetadata={onAddMetadata}
                  />
                </m.div>
              )}
            </AnimatePresence>
          </LazyMotion>
          <CreateDropContentFiles
            parts={drop?.parts ?? []}
            files={files}
            uploadingFiles={uploadingFiles}
            removeFile={removeFile}
            disabled={submitting}
            showPartFiles={!isStormModeActive}
            currentPartNumber={
              isStormModeActive ? displayedStormPartNumber : null
            }
          />
        </>
      )}
      <TermsSignatureFlow enabled={termsSignatureFlowEnabled} />
    </div>
  );
}
