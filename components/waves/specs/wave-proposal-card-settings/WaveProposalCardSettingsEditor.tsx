import {
  PROPOSAL_CARD_EXCERPT_MAX_LENGTH,
  PROPOSAL_CARD_EXCERPT_MIN_LENGTH,
} from "@/helpers/waves/proposal-card.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { CreateWaveProposalCardMode } from "@/types/waves.types";
import { CheckIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useId } from "react";
import WaveSettingEditorActions from "../WaveSettingEditorActions";
import ProposalCardLayoutPreview from "./ProposalCardLayoutPreview";
import type { ProposalCardDraft } from "./useWaveProposalCardSettings";

interface ProposalCardLayoutFieldsetProps {
  readonly disabled: boolean;
  readonly mode: CreateWaveProposalCardMode;
  readonly onChange: (mode: CreateWaveProposalCardMode) => void;
}

function ProposalCardLayoutFieldset({
  disabled,
  mode: selectedMode,
  onChange,
}: ProposalCardLayoutFieldsetProps) {
  const layoutName = useId();
  const locale = useBrowserLocale();

  return (
    <fieldset
      className="tw-m-0 tw-min-w-0 tw-border-0 tw-p-0"
      disabled={disabled}
    >
      <legend className="tw-mb-2 tw-text-sm tw-font-medium tw-text-iron-100">
        {t(locale, "waves.proposalCard.settings.layoutLabel")}
      </legend>
      <div className="tw-grid tw-grid-cols-2 tw-gap-2">
        {(["standard", "custom"] as const).map((mode) => (
          <label
            key={mode}
            className={clsx(
              "tw-group tw-relative tw-flex tw-min-w-0",
              disabled ? "tw-cursor-not-allowed" : "tw-cursor-pointer"
            )}
          >
            <input
              checked={selectedMode === mode}
              className="tw-peer tw-absolute tw-inset-0 tw-m-0 tw-h-full tw-w-full tw-cursor-pointer tw-opacity-0 disabled:tw-cursor-not-allowed"
              name={layoutName}
              type="radio"
              value={mode}
              onChange={() => onChange(mode)}
            />
            <span
              className={clsx(
                "tw-pointer-events-none tw-flex tw-min-h-[3.875rem] tw-w-full tw-min-w-0 tw-flex-col tw-items-center tw-justify-center tw-gap-1 tw-rounded-lg tw-border tw-border-solid tw-px-2 tw-py-2.5 tw-text-center peer-focus-visible:tw-ring-2 peer-focus-visible:tw-ring-primary-400 peer-focus-visible:tw-ring-offset-2 peer-focus-visible:tw-ring-offset-iron-950 peer-disabled:tw-opacity-50",
                selectedMode === mode
                  ? "tw-border-primary-400 tw-bg-primary-500/[0.08] tw-text-primary-300"
                  : "tw-border-iron-600 tw-bg-white/[0.015] tw-text-iron-300",
                !disabled &&
                  selectedMode !== mode &&
                  "desktop-hover:group-hover:tw-border-iron-400 desktop-hover:group-hover:tw-bg-white/[0.04]"
              )}
            >
              {selectedMode === mode && (
                <CheckIcon
                  aria-hidden="true"
                  className="tw-absolute tw-right-1 tw-top-1 tw-size-3.5"
                />
              )}
              <ProposalCardLayoutPreview
                mode={mode}
                className="tw-h-5 tw-w-[1.9375rem] tw-shrink-0"
              />
              <span className="tw-w-full tw-break-words tw-text-xs tw-font-medium tw-leading-4">
                {t(
                  locale,
                  mode === "standard"
                    ? "waves.proposalCard.mode.standard.label"
                    : "waves.proposalCard.mode.custom.label"
                )}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

interface SummaryCardFieldsProps {
  readonly draft: ProposalCardDraft;
  readonly hasExcerptError: boolean;
  readonly isSaving: boolean;
  readonly onChange: (draft: ProposalCardDraft) => void;
}

function SummaryCardFields({
  draft,
  hasExcerptError,
  isSaving,
  onChange,
}: SummaryCardFieldsProps) {
  const excerptInputId = useId();
  const excerptErrorId = useId();
  const locale = useBrowserLocale();

  return (
    <div className="tw-flex tw-flex-col tw-gap-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-pt-3">
      <label
        htmlFor={excerptInputId}
        className="tw-block tw-text-sm tw-font-medium tw-text-iron-200"
      >
        <span className="tw-block">
          {t(locale, "waves.proposalCard.excerptLabel")}
        </span>
        <span className="tw-mt-2 tw-flex tw-items-center tw-gap-2">
          <input
            id={excerptInputId}
            aria-describedby={hasExcerptError ? excerptErrorId : undefined}
            aria-invalid={hasExcerptError}
            className="tw-form-input tw-h-9 tw-w-20 tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-white tw-ring-1 tw-ring-inset tw-ring-iron-650 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-primary-400"
            disabled={isSaving}
            inputMode="numeric"
            max={PROPOSAL_CARD_EXCERPT_MAX_LENGTH}
            min={PROPOSAL_CARD_EXCERPT_MIN_LENGTH}
            step={1}
            type="number"
            value={draft.excerptMaxCharacters}
            onChange={(event) =>
              onChange({
                ...draft,
                excerptMaxCharacters: event.target.value,
              })
            }
          />
          <span className="tw-text-xs tw-font-normal tw-text-iron-500">
            {t(locale, "waves.proposalCard.characters")}
          </span>
        </span>
      </label>
      {hasExcerptError ? (
        <p
          id={excerptErrorId}
          role="alert"
          className="tw-m-0 tw-text-xs tw-font-medium tw-leading-4 tw-text-error"
        >
          {t(locale, "waves.proposalCard.excerptRangeError", {
            min: PROPOSAL_CARD_EXCERPT_MIN_LENGTH,
            max: PROPOSAL_CARD_EXCERPT_MAX_LENGTH,
          })}
        </p>
      ) : null}
      <label className="tw-flex tw-min-h-9 tw-cursor-pointer tw-items-center tw-justify-between tw-gap-3 tw-text-sm tw-font-medium tw-text-iron-200">
        <span>{t(locale, "waves.proposalCard.mediaLabel")}</span>
        <input
          checked={draft.showMediaThumbnail}
          className="tw-form-checkbox tw-size-5 tw-flex-shrink-0 tw-rounded tw-border tw-border-solid tw-border-iron-500 tw-bg-iron-950 tw-text-primary-500 focus:tw-ring-primary-400"
          disabled={isSaving}
          type="checkbox"
          onChange={(event) =>
            onChange({
              ...draft,
              showMediaThumbnail: event.target.checked,
            })
          }
        />
      </label>
    </div>
  );
}

interface WaveProposalCardSettingsEditorProps {
  readonly closeEditor: () => void;
  readonly draft: ProposalCardDraft;
  readonly hasExcerptError: boolean;
  readonly isSaving: boolean;
  readonly saveError: string | null;
  readonly submitDisabled: boolean;
  readonly onDraftChange: (draft: ProposalCardDraft) => void;
  readonly onSubmit: () => void;
}

export default function WaveProposalCardSettingsEditor({
  closeEditor,
  draft,
  hasExcerptError,
  isSaving,
  saveError,
  submitDisabled,
  onDraftChange,
  onSubmit,
}: WaveProposalCardSettingsEditorProps) {
  return (
    <form
      className="tw-flex tw-flex-col tw-gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <ProposalCardLayoutFieldset
        disabled={isSaving}
        mode={draft.mode}
        onChange={(mode) => onDraftChange({ ...draft, mode })}
      />
      {draft.mode === "custom" ? (
        <SummaryCardFields
          draft={draft}
          hasExcerptError={hasExcerptError}
          isSaving={isSaving}
          onChange={onDraftChange}
        />
      ) : null}
      {saveError ? (
        <p
          role="alert"
          className="tw-m-0 tw-text-xs tw-font-medium tw-leading-4 tw-text-error"
        >
          {saveError}
        </p>
      ) : null}
      <WaveSettingEditorActions
        disabled={isSaving}
        onCancel={closeEditor}
        submitDisabled={submitDisabled}
      />
    </form>
  );
}
