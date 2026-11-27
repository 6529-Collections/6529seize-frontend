"use client";

import type { ChangeEventHandler, ReactNode, Ref } from "react";
import { useId, useState } from "react";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { PHONE_WAVES_LAYOUT_QUERY } from "@/constants/waves-layout";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { CreateWaveStep } from "@/types/waves.types";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";

const MOBILE_TEXT_STYLES =
  "max-md:[&_:is(p,span).tw-font-normal.tw-text-iron-300]:tw-text-meta max-md:[&_:is(p,span).tw-font-normal.tw-text-iron-300]:tw-leading-[18px] max-md:[&_:is(p,span).tw-font-normal.tw-text-iron-300]:tw-text-iron-400 max-md:[&_:is(p,span,div,output).tw-text-iron-400]:tw-text-meta max-md:[&_:is(p,span,div,output).tw-text-iron-400]:tw-font-normal max-md:[&_:is(p,span,div,output).tw-text-iron-400]:tw-leading-[18px]";

const RULES_LOCKED_NOTE_ID = "competition-draft-rules-locked";

/** Reuse the existing validation message in the responsive editor layout. */
export function getDecisionValidationFeedback(
  locale: SupportedLocale,
  errors: readonly CREATE_WAVE_VALIDATION_ERROR[],
  invalid: boolean,
  feedbackId: string,
  isPhone: boolean
) {
  const feedback = errors.length > 0 && invalid && (
    <p id={feedbackId} role="alert" className="tw-m-0 tw-text-red">
      {t(locale, "competitions.required")}
    </p>
  );
  return {
    body: isPhone ? false : feedback,
    footer: isPhone ? feedback : false,
  } as const;
}

export function DecisionNameField({
  locale,
  inputClassName,
  errors,
  currentErrors,
  feedbackId,
  value,
  onChange,
}: {
  readonly locale: SupportedLocale;
  readonly inputClassName: string;
  readonly errors: readonly CREATE_WAVE_VALIDATION_ERROR[];
  readonly currentErrors: readonly CREATE_WAVE_VALIDATION_ERROR[];
  readonly feedbackId: string;
  readonly value: string;
  readonly onChange: ChangeEventHandler<HTMLInputElement>;
}) {
  const labelId = useId();
  const nameErrors = [
    CREATE_WAVE_VALIDATION_ERROR.NAME_REQUIRED,
    CREATE_WAVE_VALIDATION_ERROR.NAME_TOO_LONG,
  ];
  const isNameError =
    nameErrors.some((error) => errors.includes(error)) &&
    nameErrors.some((error) => currentErrors.includes(error));
  return (
    <label className="tw-block tw-min-w-0 tw-space-y-2 tw-text-sm tw-font-medium tw-text-iron-300">
      <span>
        <span id={labelId}>{t(locale, "competitions.titleLabel")}</span>
        <span aria-hidden="true" className="tw-ml-1 tw-text-error">
          *
        </span>
      </span>
      <input
        required
        maxLength={250}
        aria-labelledby={labelId}
        aria-invalid={isNameError}
        aria-describedby={isNameError ? feedbackId : undefined}
        className={`${inputClassName} aria-[invalid=true]:tw-border-error aria-[invalid=true]:hover:tw-border-error aria-[invalid=true]:focus:tw-border-error aria-[invalid=true]:focus:tw-outline-1 aria-[invalid=true]:focus:tw-outline-error`}
        value={value}
        onChange={onChange}
      />
    </label>
  );
}

/** Keep the disclosure open across responsive remounts and reset on step exit. */
export function useDisplaySettingsDisclosure(step: CreateWaveStep) {
  const [open, setOpen] = useState(false);
  if (step !== CreateWaveStep.OVERVIEW && open) {
    setOpen(false);
  }
  return [open, setOpen] as const;
}

export const rulesLockedNoteId = (lockedRules: boolean): string | undefined =>
  lockedRules ? RULES_LOCKED_NOTE_ID : undefined;

/** Explains why entries have fixed the decision's rules. */
export function RulesLockedNote({
  locale,
  show,
}: {
  readonly locale: SupportedLocale;
  readonly show: boolean;
}) {
  if (!show) return null;
  return (
    <p id={RULES_LOCKED_NOTE_ID} className="tw-m-0 tw-text-sm tw-text-iron-400">
      {t(locale, "competitions.rulesLockedAfterEntries")}
    </p>
  );
}

function StepProgress({
  steps,
  index,
}: {
  readonly steps: readonly CreateWaveStep[];
  readonly index: number;
}) {
  return (
    <div
      aria-hidden="true"
      data-testid="competition-step-progress"
      className="tw-mt-3 tw-flex tw-gap-1 md:tw-hidden"
    >
      {steps.map((step, stepIndex) => (
        <span
          key={step}
          className={`tw-h-[3px] tw-flex-1 tw-rounded-full ${stepIndex <= index ? "tw-bg-iron-100" : "tw-bg-white/10"}`}
        />
      ))}
    </div>
  );
}

/** The editor state stays in its parent while its presentation follows md. */
export default function CompetitionDraftEditorLayout({
  title,
  saveStatus,
  steps,
  index,
  busy,
  onClose,
  contentRef,
  describedBy,
  actions,
  children,
  footer,
}: {
  readonly title: string;
  readonly saveStatus: string;
  readonly steps: readonly CreateWaveStep[];
  readonly index: number;
  readonly busy: boolean;
  readonly onClose: () => void;
  readonly contentRef: Ref<HTMLElement>;
  readonly describedBy: string | undefined;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
  readonly footer: ReactNode;
}) {
  const isPhone = useMediaQuery(PHONE_WAVES_LAYOUT_QUERY);
  const progress = <StepProgress steps={steps} index={index} />;

  if (isPhone) {
    return (
      <MobileWrapperDialog
        isOpen
        className="[--mobile-wrapper-dialog-viewport-reserve:env(safe-area-inset-top,0px)]"
        title={title}
        onClose={onClose}
        busy={busy}
        noPadding
        tall
        fixedHeight
        scrollableContent={false}
        headerClassName="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.06] tw-py-4"
        headerActions={
          <div className="tw-w-full">
            <output className="tw-text-meta tw-leading-[18px] tw-text-iron-500">
              {saveStatus}
            </output>
            {progress}
          </div>
        }
      >
        <section
          ref={contentRef}
          data-decision-editor="true"
          aria-label={title}
          aria-describedby={describedBy}
          className={`tw-group/decision-editor tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-overflow-y-auto ${MOBILE_TEXT_STYLES}`}
        >
          <div className="tw-min-h-0 tw-flex-1 tw-scroll-py-3 tw-overflow-y-auto">
            <div className="tw-flex tw-flex-col tw-gap-6 tw-px-4 tw-pb-6 tw-pt-5 sm:tw-px-6">
              {actions}
              {children}
            </div>
          </div>
          {footer}
        </section>
      </MobileWrapperDialog>
    );
  }

  return (
    <>
      {actions}
      <section
        ref={contentRef}
        aria-labelledby="competition-draft-title"
        aria-describedby={describedBy}
        className={`tw-mx-auto tw-flex tw-w-full tw-max-w-[680px] tw-flex-1 tw-flex-col tw-gap-6 ${MOBILE_TEXT_STYLES}`}
      >
        <div>
          <div className="tw-flex tw-flex-col tw-gap-1 md:tw-flex-row md:tw-flex-wrap md:tw-items-center md:tw-justify-between md:tw-gap-3">
            <h1
              id="competition-draft-title"
              className="tw-m-0 tw-text-2xl tw-font-semibold tw-tracking-title tw-text-iron-50 sm:tw-text-[28px] sm:tw-leading-[34px]"
            >
              {title}
            </h1>
            <output className="tw-text-meta tw-leading-[18px] tw-text-iron-500 md:tw-text-xs md:tw-text-iron-400">
              {saveStatus}
            </output>
          </div>
          {progress}
        </div>
        {children}
        {footer}
      </section>
    </>
  );
}
