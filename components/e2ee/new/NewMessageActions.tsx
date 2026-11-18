import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useNativeKeyboard } from "@/hooks/useNativeKeyboard";
import { t, type MessageKey } from "@/i18n/messages";
import { formatLegacyDmDeletionDate } from "../legacy/legacyDmRetention";
import { E2eeBadge } from "../ui/E2eeBadge";
import { E2eeBanner } from "../ui/E2eeBanner";

export interface NewMessageAlternateAction {
  readonly kind: "group" | "encryption";
  readonly label: MessageKey;
  readonly onClick: () => void;
}

export function NewMessageActions({
  actionLabel,
  canSubmit,
  creating,
  encrypted,
  errorMessage,
  warning,
  alternateActions,
  onCancel,
}: {
  readonly actionLabel: MessageKey;
  readonly canSubmit: boolean;
  readonly creating: boolean;
  readonly encrypted: boolean;
  readonly errorMessage: string | null;
  readonly warning: "blocked" | "closed" | "retention" | null;
  readonly alternateActions: readonly NewMessageAlternateAction[];
  readonly onCancel: (() => void) | undefined;
}) {
  const locale = useBrowserLocale();
  const { isVisible: isKeyboardVisible } = useNativeKeyboard();

  let warningText: string | undefined;
  if (warning === "blocked") {
    warningText = t(locale, "e2ee.new.notEligibleSummary");
  } else if (warning === "closed") {
    warningText = t(locale, "e2ee.new.legacyClosed");
  } else if (warning === "retention") {
    warningText = t(locale, "e2ee.legacy.create.warning", {
      date: formatLegacyDmDeletionDate(locale),
    });
  }

  return (
    <div
      className={`tw-flex tw-shrink-0 tw-flex-col tw-gap-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-px-4 tw-pt-3 ${isKeyboardVisible ? "tw-pb-2" : "tw-pb-[max(0.75rem,env(safe-area-inset-bottom))]"}`}
    >
      {warningText && <E2eeBanner tone="warning">{warningText}</E2eeBanner>}
      {errorMessage && (
        <p role="alert" className="tw-m-0 tw-text-sm tw-text-rose-300">
          {errorMessage}
        </p>
      )}
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-2">
        {encrypted && (
          <E2eeBadge
            label={t(locale, "e2ee.badge.encrypted")}
            className="tw-me-auto"
          />
        )}
        {alternateActions.map(({ kind, label, onClick }) => (
          <button
            key={kind}
            type="button"
            className="tw-min-h-9 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-1 tw-text-sm tw-text-iron-300 tw-underline tw-underline-offset-2 hover:tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
            disabled={creating}
            onClick={onClick}
          >
            {t(locale, label)}
          </button>
        ))}
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={creating}
          >
            {t(locale, "e2ee.action.cancel")}
          </Button>
        )}
        <Button
          type="submit"
          variant={warning === "retention" ? "secondary" : "action"}
          size="md"
          loading={creating}
          disabled={!canSubmit}
        >
          {t(locale, creating ? "e2ee.new.creating" : actionLabel)}
        </Button>
      </div>
    </div>
  );
}
