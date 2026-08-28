import { CHAT_LINK_RESTRICTION_MESSAGE } from "@/helpers/waves/chat-link-restriction.helpers";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import MobileWrapperDialog from "../../mobile-wrapper-dialog/MobileWrapperDialog";
import Button from "../../utils/button/Button";
import CreateDropActions from "../CreateDropActions";
import { CreateDropContentFiles } from "../CreateDropContentFiles";
import CreateDropContentRequirements from "../CreateDropContentRequirements";
import CreateDropInput from "../CreateDropInput";
import CreateDropMetadata from "../CreateDropMetadata";
import CreateDropPoll from "../CreateDropPoll";
import CreateDropStormParts from "../CreateDropStormParts";
import { CreateDropSubmit } from "../CreateDropSubmit";
import SlowModeChatNotice from "../SlowModeChatNotice";
import type { CreateDropLayoutProps } from "./CreateDropLayout";

interface CreateDropComposerProps extends CreateDropLayoutProps {
  readonly initialDraftJson: string | null;
  readonly locale: SupportedLocale;
  readonly submitWithResolvedAliases: () => Promise<void>;
}

export default function CreateDropComposer({
  activeDrop,
  submitting,
  wave,
  isApp,
  isDropMode,
  isStormModeActive,
  setActionsContainerRef,
  isLinksSubmitBlocked,
  canAddPart,
  hasCurrentDraft,
  isCompactLayout,
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
  pollDraft,
  pollQuestionError,
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
  initialDraftJson,
  locale,
  submitWithResolvedAliases,
}: CreateDropComposerProps) {
  const displayedStormPartNumber =
    editingPartIndex === null
      ? (drop?.parts.length ?? 0) + 1
      : editingPartIndex + 1;
  let submitLabel: string | undefined;
  if (isStormModeActive) {
    if (editingPartIndex !== null) {
      submitLabel = t(locale, "waves.stormComposer.saveChanges");
    } else if (canAddPart || (drop?.parts.length ?? 0) === 0) {
      submitLabel = t(locale, "waves.stormComposer.addPart");
    } else {
      submitLabel = t(locale, "waves.stormComposer.postStorm");
    }
  }
  const postLabel = t(locale, "waves.header.postLabel.one");
  return (
    <>
      {isStormModeActive && (
        <CreateDropStormParts
          parts={drop?.parts ?? []}
          mentionedUsers={drop?.mentioned_users ?? []}
          mentionedGroups={drop?.mentioned_groups ?? []}
          mentionedWaves={drop?.mentioned_waves ?? []}
          referencedNfts={drop?.referenced_nfts ?? []}
          editingPartIndex={editingPartIndex}
          isCompactLayout={isCompactLayout}
          controlsDisabled={submitting}
          canEditParts={!canAddPart && editingPartIndex === null}
          hasCurrentDraft={hasCurrentDraft}
          onEditPart={onEditPart}
          onCancelPartEdit={onCancelPartEdit}
          onMovePart={onMovePart}
          onRemovePart={onRemovePart}
          onDiscardStorm={onDiscardStorm}
        />
      )}
      <div
        ref={setActionsContainerRef}
        className="tw-grid tw-w-full tw-flex-none tw-grid-cols-[auto_minmax(0,1fr)_auto] tw-items-center tw-gap-x-2 lg:tw-gap-x-3"
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
        <CreateDropActions
          isStormMode={isStormModeActive}
          isDropMode={isDropMode}
          submitting={submitting}
          isCompactLayout={isCompactLayout}
          showOptions={showOptions}
          animateOptions={animateOptions}
          isRequiredMetadataMissing={!!missingRequirements.metadata.length}
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
        <CreateDropInput
          waveId={wave.id}
          key={dropEditorRefreshKey}
          ref={createDropInputRef}
          editorState={editorState}
          initialEditorStateJson={initialDraftJson}
          type={activeDrop?.action ?? null}
          submitting={submitting}
          isStormMode={isStormModeActive}
          stormPartNumber={displayedStormPartNumber}
          isDropMode={isDropMode}
          isPollActive={hasPoll}
          containerClassName="tw-col-start-2 tw-row-start-2 tw-w-full tw-min-w-0"
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
          hasValidationError={pollQuestionError !== null}
          validationHelperText={pollQuestionError}
          validationHelperClassName="tw-col-start-2 tw-row-start-3 tw-mb-0 tw-mt-2 tw-text-[11px] tw-font-medium tw-leading-4 tw-text-amber-200/90"
          onDrop={submitWithResolvedAliases}
        />
        <div className="tw-col-start-3 tw-row-start-2 tw-self-end md:tw-row-span-2">
          <CreateDropSubmit
            submitting={submitting}
            canSubmit={canSubmit}
            onDrop={submitWithResolvedAliases}
            isDropMode={isDropMode}
            label={submitLabel}
            showLabelOnMobile={isStormModeActive}
            disabledTooltip={
              isLinksSubmitBlocked ? CHAT_LINK_RESTRICTION_MESSAGE : null
            }
          />
        </div>
        {showCurationDropModeWarning && (
          <div
            className={`tw-col-span-3 tw-col-start-1 tw-min-w-0 md:tw-col-span-1 md:tw-col-start-2 ${
              pollQuestionError ? "tw-row-start-4" : "tw-row-start-3"
            }`}
          >
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
          </div>
        )}
      </div>
      {pollDraft && !isApp && (
        <CreateDropPoll
          draft={pollDraft}
          disabled={submitting}
          validationError={pollValidationError}
          onChange={updatePollDraft}
          onRemove={removePoll}
        />
      )}
      {isApp && pollDraft && (
        <MobileWrapperDialog
          title={t(locale, "waves.poll.composer.title")}
          ariaLabel={t(locale, "waves.poll.composer.title")}
          isOpen
          onClose={removePoll}
          onBack={submitting ? undefined : removePoll}
          dismissible={!submitting}
          noPadding
          enableDragToClose
          showHeaderCloseButton={false}
          showHeaderDivider
          surfaceClassName="tw-bg-iron-950"
        >
          <CreateDropPoll
            draft={pollDraft}
            disabled={submitting}
            validationError={pollValidationError}
            onChange={updatePollDraft}
            onRemove={removePoll}
            presentation="sheet"
          />
          <div className="tw-sticky tw-bottom-0 tw-z-10 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-bg-iron-950/95 tw-px-4 tw-pb-3 tw-pt-3 tw-backdrop-blur">
            <Button
              onClick={submitWithResolvedAliases}
              loading={submitting}
              disabled={!canSubmit}
              variant="primary"
              size="lg"
              fullWidth
              aria-label={submitting ? `${postLabel} in progress` : postLabel}
              hideChildrenWhenLoading
            >
              {postLabel}
            </Button>
          </div>
        </MobileWrapperDialog>
      )}
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
        currentPartNumber={isStormModeActive ? displayedStormPartNumber : null}
      />
    </>
  );
}
