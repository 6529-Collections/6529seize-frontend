import { publicEnv } from "@/config/env";
import { getAppEnvironment } from "@/config/appEnvironment";

interface EnvironmentBadgeProps {
  readonly compact?: boolean | undefined;
}

export default function EnvironmentBadge({
  compact = false,
}: EnvironmentBadgeProps) {
  const { badge } = getAppEnvironment(publicEnv.BASE_ENDPOINT);

  if (!badge) {
    return null;
  }

  return (
    <span
      aria-label={`Environment: ${badge}`}
      title={`Environment: ${badge}`}
      className={`tw-inline-flex tw-min-w-0 tw-items-center tw-justify-center tw-gap-1 tw-overflow-hidden tw-rounded-md tw-border tw-border-solid tw-border-amber-400/40 tw-bg-amber-500/10 tw-font-mono tw-text-xs tw-font-semibold tw-leading-none tw-text-amber-200 ${
        compact
          ? "tw-max-w-[4.75rem] tw-px-0.5 tw-py-1"
          : "tw-max-w-48 tw-px-1.5 tw-py-1"
      }`}
    >
      {!compact && (
        <span
          aria-hidden="true"
          className="tw-size-1 tw-flex-shrink-0 tw-rounded-full tw-bg-amber-400"
        />
      )}
      <span className="tw-min-w-0 tw-truncate">{badge}</span>
    </span>
  );
}
