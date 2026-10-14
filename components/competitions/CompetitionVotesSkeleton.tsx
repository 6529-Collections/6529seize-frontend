import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export function CompetitionVoterSkeleton() {
  return (
    <div
      aria-hidden="true"
      data-testid="competition-voter-skeleton"
      className="tw-flex tw-min-w-0 tw-items-center tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-900 tw-py-3 motion-safe:tw-animate-pulse"
    >
      <div className="tw-h-3 tw-w-5 tw-shrink-0 tw-rounded tw-bg-iron-800" />
      <div className="tw-flex tw-min-h-11 tw-min-w-0 tw-flex-1 tw-items-center tw-gap-3">
        <div className="tw-size-7 tw-shrink-0 tw-rounded-full tw-bg-iron-800" />
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-2">
          <div className="tw-h-3.5 tw-w-full tw-max-w-32 tw-rounded tw-bg-iron-800" />
          <div className="tw-h-3 tw-w-3/4 tw-max-w-24 tw-rounded tw-bg-iron-900" />
        </div>
      </div>
      <div className="tw-h-3.5 tw-w-32 tw-max-w-[40%] tw-shrink-0 tw-rounded tw-bg-iron-800" />
    </div>
  );
}

function CompetitionActivitySkeleton() {
  return (
    <div
      aria-hidden="true"
      data-testid="competition-activity-skeleton"
      className="tw-grid tw-min-w-0 tw-grid-cols-[minmax(0,1fr)_auto] tw-items-center tw-gap-x-3 tw-gap-y-1 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-900 tw-py-3 motion-safe:tw-animate-pulse sm:tw-grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto] sm:tw-gap-x-5"
    >
      <div className="tw-col-start-1 tw-row-start-1 tw-flex tw-min-h-8 tw-min-w-0 tw-items-center tw-gap-2">
        <div className="tw-size-6 tw-shrink-0 tw-rounded-full tw-bg-iron-800" />
        <div className="tw-h-3.5 tw-w-24 tw-max-w-full tw-rounded tw-bg-iron-800" />
      </div>
      <div className="tw-col-start-2 tw-row-start-1 tw-flex tw-items-center tw-gap-1 sm:tw-col-start-4">
        <div className="tw-h-3 tw-w-6 tw-rounded tw-bg-iron-900" />
        <div className="tw-flex tw-size-10 tw-items-center tw-justify-center">
          <div className="tw-size-4 tw-rounded tw-bg-iron-900" />
        </div>
      </div>
      <div className="tw-col-span-2 tw-row-start-2 tw-flex tw-min-w-0 tw-flex-col tw-gap-2 tw-pl-8 sm:tw-contents">
        <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2 sm:tw-col-start-2 sm:tw-row-start-1">
          <div className="tw-h-3 tw-w-9 tw-shrink-0 tw-rounded tw-bg-iron-900" />
          <div className="tw-h-6 tw-w-24 tw-min-w-0 tw-rounded-md tw-bg-iron-800 sm:tw-h-7" />
        </div>
        <div className="tw-flex tw-min-h-6 tw-min-w-0 tw-items-center tw-gap-2 sm:tw-col-start-3 sm:tw-row-start-1">
          <div className="tw-size-3.5 tw-shrink-0 tw-rounded tw-bg-iron-900" />
          <div className="tw-size-5 tw-shrink-0 tw-rounded-full tw-bg-iron-800" />
          <div className="tw-h-3 tw-w-24 tw-min-w-0 tw-rounded tw-bg-iron-900" />
        </div>
      </div>
    </div>
  );
}

export function CompetitionVotesSkeleton({
  variant,
}: {
  readonly variant: "voters" | "activity";
}) {
  const locale = useBrowserLocale();
  const Row =
    variant === "voters"
      ? CompetitionVoterSkeleton
      : CompetitionActivitySkeleton;
  return (
    <div className="tw-w-full tw-max-w-6xl">
      <output className="tw-sr-only">{t(locale, "competitions.loading")}</output>
      {[0, 1, 2, 3, 4, 5].map((row) => (
        <Row key={row} />
      ))}
    </div>
  );
}
