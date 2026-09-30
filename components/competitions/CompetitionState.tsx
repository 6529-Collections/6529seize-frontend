"use client";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export const COMPETITION_BUTTON =
  "tw-no-underline tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 hover:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50";
export const COMPETITION_INPUT =
  "tw-block tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-3 tw-text-iron-100 focus:tw-outline focus:tw-outline-2 focus:tw-outline-primary-400";

export function CompetitionState({
  error = false,
  empty = false,
  retry,
}: {
  readonly error?: boolean;
  readonly empty?: boolean;
  readonly retry?: () => void;
}) {
  const locale = useBrowserLocale();
  let message = "competitions.loading" as
    | "competitions.loading"
    | "competitions.error"
    | "competitions.emptyResource";
  if (error) message = "competitions.error";
  else if (empty) message = "competitions.emptyResource";
  return (
    <div className="tw-space-y-3 tw-p-6" role={error ? "alert" : "status"}>
      <p className="tw-m-0 tw-text-sm tw-text-iron-300">{t(locale, message)}</p>
      {error && retry && (
        <button type="button" className={COMPETITION_BUTTON} onClick={retry}>
          {t(locale, "competitions.retry")}
        </button>
      )}
    </div>
  );
}
