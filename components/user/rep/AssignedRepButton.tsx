import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { tRich } from "@/i18n/messages";
import { ChevronRightIcon } from "@heroicons/react/24/solid";

export default function AssignedRepButton({
  amount,
  onClick,
  compact = false,
}: {
  readonly amount: number;
  readonly onClick: () => void;
  readonly compact?: boolean;
}) {
  const locale = useBrowserLocale();
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={onClick}
      className={`tw-inline-flex tw-min-h-9 tw-max-w-full tw-cursor-pointer tw-items-center tw-gap-1.5 tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-font-normal tw-text-iron-400 tw-transition-colors hover:tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none ${compact ? "tw-text-xs" : "tw-text-meta/4"}`}
    >
      <span>
        {tRich(locale, "user.profile.rep.rep.youAssigned", {
          value: (
            <span key="amount" className="tw-font-medium tw-text-iron-100">
              {formatInteger(locale, amount)}
            </span>
          ),
        })}
      </span>
      <ChevronRightIcon
        aria-hidden="true"
        className="tw-size-4 tw-shrink-0 tw-text-iron-500"
      />
    </button>
  );
}
