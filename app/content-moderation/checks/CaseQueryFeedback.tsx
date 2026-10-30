"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import { checkButtonClass } from "./checks.helpers";

export default function CaseQueryFeedback({
  query,
  empty,
  messages,
}: {
  readonly query: {
    readonly isLoading: boolean;
    readonly isError: boolean;
    readonly isSuccess: boolean;
    readonly refetch: () => Promise<unknown>;
  };
  readonly empty: boolean;
  readonly messages: {
    readonly loading: MessageKey;
    readonly error: MessageKey;
    readonly empty: MessageKey;
  };
}) {
  const locale = useBrowserLocale();
  return (
    <>
      {query.isLoading && <output>{t(locale, messages.loading)}</output>}
      {query.isError && (
        <div role="alert">
          <p>{t(locale, messages.error)}</p>
          <button
            type="button"
            className={checkButtonClass}
            onClick={() => void query.refetch()}
          >
            {t(locale, "checks.retry")}
          </button>
        </div>
      )}
      {query.isSuccess && empty && (
        <p className="tw-text-sm tw-text-iron-400">
          {t(locale, messages.empty)}
        </p>
      )}
    </>
  );
}
