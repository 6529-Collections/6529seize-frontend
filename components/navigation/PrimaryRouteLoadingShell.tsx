import type { MessageKey } from "@/i18n/messages";
import PrimaryRouteLoadingStatus from "./PrimaryRouteLoadingStatus";

type PrimaryRouteLoadingVariant =
  | "cards"
  | "home"
  | "network"
  | "notifications";

interface PrimaryRouteLoadingShellProps {
  readonly messageKey: MessageKey;
  readonly variant: PrimaryRouteLoadingVariant;
}

const CARD_SKELETON_IDS = [
  "card-1",
  "card-2",
  "card-3",
  "card-4",
  "card-5",
  "card-6",
] as const;

const LIST_SKELETON_ROWS = [
  { id: "row-1", titleWidthClass: "tw-w-2/3" },
  { id: "row-2", titleWidthClass: "tw-w-1/2" },
  { id: "row-3", titleWidthClass: "tw-w-2/3" },
  { id: "row-4", titleWidthClass: "tw-w-1/2" },
  { id: "row-5", titleWidthClass: "tw-w-2/3" },
  { id: "row-6", titleWidthClass: "tw-w-1/2" },
  { id: "row-7", titleWidthClass: "tw-w-2/3" },
] as const;

const SkeletonBlock = ({ className }: { readonly className: string }) => (
  <div
    aria-hidden="true"
    className={`tw-animate-pulse tw-rounded-lg tw-bg-iron-900 motion-reduce:tw-animate-none ${className}`}
  />
);

const CardsLoadingShell = () => (
  <div className="tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
    {CARD_SKELETON_IDS.map((id) => (
      <div
        key={id}
        className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-white/10 tw-bg-iron-950"
      >
        <SkeletonBlock className="tw-aspect-[16/10] tw-w-full tw-rounded-none" />
        <div className="tw-space-y-3 tw-p-4">
          <SkeletonBlock className="tw-h-5 tw-w-2/3" />
          <SkeletonBlock className="tw-h-3 tw-w-full" />
          <SkeletonBlock className="tw-h-3 tw-w-3/4" />
        </div>
      </div>
    ))}
  </div>
);

const HomeLoadingShell = () => (
  <div className="tw-space-y-10">
    <div className="tw-space-y-5 tw-py-8 sm:tw-py-14">
      <SkeletonBlock className="tw-h-9 tw-w-3/4 tw-max-w-xl sm:tw-h-12" />
      <SkeletonBlock className="tw-h-4 tw-w-full tw-max-w-2xl" />
      <SkeletonBlock className="tw-h-4 tw-w-2/3 tw-max-w-lg" />
      <SkeletonBlock className="tw-h-11 tw-w-36 tw-rounded-full" />
    </div>
    <CardsLoadingShell />
  </div>
);

const ListLoadingShell = ({
  showAvatars,
}: {
  readonly showAvatars: boolean;
}) => (
  <div className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-white/10 tw-bg-iron-950">
    {LIST_SKELETON_ROWS.map((row) => (
      <div
        key={row.id}
        className="tw-flex tw-items-center tw-gap-4 tw-border-b tw-border-white/10 tw-p-4 last:tw-border-b-0"
      >
        {showAvatars && (
          <SkeletonBlock className="tw-size-10 tw-shrink-0 tw-rounded-full" />
        )}
        <div className="tw-min-w-0 tw-flex-1 tw-space-y-3">
          <SkeletonBlock className={`tw-h-4 ${row.titleWidthClass}`} />
          <SkeletonBlock className="tw-h-3 tw-w-1/3" />
        </div>
      </div>
    ))}
  </div>
);

export default function PrimaryRouteLoadingShell({
  messageKey,
  variant,
}: PrimaryRouteLoadingShellProps) {
  return (
    <>
      <PrimaryRouteLoadingStatus messageKey={messageKey} />
      <div
        aria-hidden="true"
        className="tailwind-scope tw-min-h-screen tw-bg-black tw-px-4 tw-pb-28 tw-pt-8 tw-text-iron-50 sm:tw-px-6 lg:tw-px-8"
        data-testid="primary-route-loading-shell"
      >
        <div className="tw-mx-auto tw-w-full tw-max-w-7xl">
          {variant !== "home" && (
            <div className="tw-mb-8 tw-space-y-3">
              <SkeletonBlock className="tw-h-8 tw-w-52 sm:tw-h-9" />
              <SkeletonBlock className="tw-h-4 tw-w-full tw-max-w-md" />
            </div>
          )}
          {variant === "home" && <HomeLoadingShell />}
          {variant === "cards" && <CardsLoadingShell />}
          {variant === "network" && <ListLoadingShell showAvatars />}
          {variant === "notifications" && (
            <ListLoadingShell showAvatars={false} />
          )}
        </div>
      </div>
    </>
  );
}
