"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { COMPETITION_BUTTON } from "./CompetitionState";

export default function CompetitionConfigSaveActions({
  busy,
  error,
  invalid,
  onCancel,
}: {
  readonly busy: boolean;
  readonly error: "failure" | "conflict" | null;
  readonly invalid: boolean;
  readonly onCancel: () => void;
}) {
  const locale = useBrowserLocale();
  return (
    <div className="tw-space-y-3">
      {error && (
        <p role="alert" className="tw-m-0 tw-text-sm tw-text-error">
          {t(
            locale,
            error === "conflict"
              ? "competitions.inlineConflict"
              : "competitions.failure"
          )}
        </p>
      )}
      <div className="tw-flex tw-flex-wrap tw-justify-end tw-gap-2">
        <button
          type="button"
          className={COMPETITION_BUTTON}
          disabled={busy}
          onClick={onCancel}
        >
          {t(locale, "competitions.cancelChanges")}
        </button>
        <button
          type="submit"
          className={COMPETITION_BUTTON}
          disabled={busy || invalid || error === "conflict"}
        >
          {t(locale, busy ? "competitions.saving" : "competitions.save")}
        </button>
      </div>
    </div>
  );
}
