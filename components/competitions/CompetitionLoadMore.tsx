"use client";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { COMPETITION_BUTTON } from "./CompetitionState";
export function CompetitionLoadMore({
  query,
}: {
  readonly query: {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => unknown;
  };
}) {
  const locale = useBrowserLocale();
  return query.hasNextPage ? (
    <button
      type="button"
      className={COMPETITION_BUTTON}
      disabled={query.isFetchingNextPage}
      onClick={() => void query.fetchNextPage()}
    >
      {t(locale, "competitions.more")}
    </button>
  ) : null;
}
