import Button from "@/components/utils/button/Button";
import type { ReactElement } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

const MOBILE_EDITOR_ACTION =
  "max-md:tw-h-11 max-md:tw-rounded-xl max-md:tw-px-4 max-md:tw-text-[15px]";

/** Presentation for the decision editor's existing navigation and save actions. */
export default function CompetitionDraftEditorFooter({
  locale,
  index,
  stepCount,
  published,
  busy,
  conflict,
  validationFeedback,
  onClose,
  onPrevious,
  onNext,
  onPublish,
  onSave,
}: {
  readonly locale: SupportedLocale;
  readonly index: number;
  readonly stepCount: number;
  readonly published: boolean;
  readonly busy: boolean;
  readonly conflict: boolean;
  readonly validationFeedback: ReactElement | false;
  readonly onClose: () => void;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
  readonly onPublish: () => void;
  readonly onSave: () => void;
}) {
  return (
    <div
      className={`tw-sticky tw-bottom-0 tw-z-20 tw-mt-auto tw-grid tw-items-center tw-justify-end tw-gap-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-bg-iron-950 tw-px-4 tw-pb-3 tw-pt-3 max-md:tw-shrink-0 md:tw-flex md:tw-flex-wrap md:tw-border-white/10 md:tw-bg-black md:tw-px-0 md:tw-py-4 md:tw-pb-[max(1rem,env(safe-area-inset-bottom))] ${index > 0 ? "tw-grid-cols-[minmax(0,1fr)_auto_auto]" : "tw-grid-cols-[minmax(0,1fr)_auto]"}`}
    >
      {validationFeedback !== false && (
        <div className="tw-col-span-full tw-text-meta tw-leading-[18px] md:tw-hidden">
          {validationFeedback}
        </div>
      )}
      <Button
        type="button"
        variant="ghost"
        size="md"
        className="tw-mr-auto max-md:tw-h-11 max-md:tw-rounded-xl max-md:tw-px-1"
        disabled={busy}
        onClick={() => {
          onClose();
        }}
      >
        {t(locale, "competitions.cancelEdit")}
      </Button>
      {index > 0 && (
        <Button
          type="button"
          variant="secondary"
          size="md"
          className={MOBILE_EDITOR_ACTION}
          disabled={busy}
          onClick={onPrevious}
        >
          {t(locale, "competitions.previous")}
        </Button>
      )}
      {index < stepCount - 1 && (
        <Button
          type="button"
          variant="action"
          size="md"
          className={MOBILE_EDITOR_ACTION}
          disabled={busy}
          onClick={onNext}
        >
          {t(locale, "competitions.next")}
        </Button>
      )}
      {index === stepCount - 1 && !published && (
        <Button
          type="button"
          variant="action"
          size="md"
          className={MOBILE_EDITOR_ACTION}
          disabled={busy || conflict}
          onClick={() => {
            onPublish();
          }}
        >
          {t(locale, "competitions.publish")}
        </Button>
      )}
      {index === stepCount - 1 && published && (
        <Button
          type="button"
          variant="action"
          size="md"
          className={MOBILE_EDITOR_ACTION}
          disabled={busy || conflict}
          onClick={() => {
            onSave();
          }}
        >
          {t(locale, "competitions.save")}
        </Button>
      )}
    </div>
  );
}
