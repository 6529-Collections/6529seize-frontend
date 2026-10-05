import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import UserRateAdjustmentHelperValue from "./UserRateAdjustmentHelperValue";

export default function UserRateAdjustmentHelper({
  id,
  inLineValues,
  originalValue,
  adjustedValue,
  adjustmentType,
}: {
  readonly id?: string | undefined;
  readonly inLineValues: boolean;
  readonly originalValue: number;
  readonly adjustedValue: number;
  readonly adjustmentType: string;
}) {
  const locale = useBrowserLocale();
  return (
    <div
      id={id}
      className={`${
        inLineValues
          ? "tw-mt-2 tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-1"
          : "tw-mb-4 tw-grid tw-grid-cols-2 tw-gap-2"
      } `}
    >
      <UserRateAdjustmentHelperValue
        value={originalValue}
        title={t(locale, "user.rate.current", { type: adjustmentType })}
      />
      <UserRateAdjustmentHelperValue
        value={adjustedValue - originalValue}
        title={t(locale, "user.rate.adjustment")}
      />
    </div>
  );
}
