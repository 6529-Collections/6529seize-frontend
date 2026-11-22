import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { tRich } from "@/i18n/messages";
import type { RepDirection } from "./UserPageRep.helpers";

export default function AssignedRepSummary({
  amount,
  direction = "received",
  compact = false,
}: {
  readonly amount: number;
  readonly direction?: RepDirection;
  readonly compact?: boolean;
}) {
  const locale = useBrowserLocale();
  return (
    <span
      className={`tw-inline-flex tw-max-w-full tw-items-center tw-font-normal tw-text-iron-400 ${compact ? "tw-whitespace-normal tw-text-xs" : "tw-whitespace-nowrap tw-text-meta/4"}`}
    >
      <span>
        {tRich(
          locale,
          direction === "given"
            ? "user.profile.rep.rep.assignedToYou"
            : "user.profile.rep.rep.youAssigned",
          {
            value: (
              <span
                key="amount"
                className="tw-whitespace-nowrap tw-font-medium tw-text-iron-100"
              >
                {formatInteger(locale, amount)}
              </span>
            ),
          }
        )}
      </span>
    </span>
  );
}
