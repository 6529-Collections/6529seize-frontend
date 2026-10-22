import type { ApiWave } from "@/generated/models/ApiWave";
import { useWaveFollowersCount } from "@/hooks/useWaveFollowersCount";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { useId } from "react";

export default function WaveHeaderFollowers({
  wave,
  onFollowersClick,
}: {
  readonly wave: ApiWave;
  readonly onFollowersClick: () => void;
}) {
  const { data: count, isPending } = useWaveFollowersCount(wave.id);
  const locale = useBrowserLocale();
  const statusId = useId();
  const formattedCount =
    count === undefined ? "—" : formatInteger(locale, count);
  const unavailableStatusKey = isPending
    ? "waves.sidebar.rightPanel.followers.loading"
    : "waves.sidebar.rightPanel.followers.unavailable";
  const countStatus =
    count === undefined
      ? t(locale, unavailableStatusKey)
      : t(locale, "waves.sidebar.rightPanel.followers.count", {
          count: formattedCount,
        });
  return (
    <button
      onClick={onFollowersClick}
      aria-busy={isPending}
      aria-label={t(locale, "waves.sidebar.rightPanel.followers.open")}
      aria-describedby={statusId}
      className="tw-flex tw-items-center tw-gap-x-2 tw-border-none tw-bg-transparent tw-p-0 tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-4 focus-visible:tw-outline-primary-400"
    >
      <span aria-hidden="true">
        <span className="tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-50">
          {formattedCount}
        </span>{" "}
        <span className="tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-500">
          {t(locale, "waves.sidebar.rightPanel.followers.label")}
        </span>
      </span>
      <span
        id={statusId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="tw-sr-only"
      >
        {countStatus}
      </span>
    </button>
  );
}
