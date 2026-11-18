import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { formatInteger } from "@/i18n/format";

export default function GrantRepStats({
  available,
  assigned,
  profileName,
  overAllowance,
  id,
}: {
  readonly available: number;
  readonly assigned: number;
  readonly profileName: string;
  readonly overAllowance: boolean;
  readonly id: string;
}) {
  const locale = useBrowserLocale();
  return (
    <dl className="tw-m-0 tw-mb-4 tw-space-y-2 tw-text-xs">
      <div
        id={id}
        className={`tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-x-4 tw-gap-y-1 ${overAllowance ? "tw-text-rose-400" : "tw-text-iron-400"}`}
      >
        <dt className="tw-font-normal">
          {t(locale, "rep.categories.grant.availableRepLabel")}
        </dt>
        <dd
          className={`tw-m-0 tw-ml-auto tw-whitespace-nowrap tw-font-medium ${overAllowance ? "tw-text-rose-400" : "tw-text-iron-100"}`}
        >
          {formatInteger(locale, available)}
        </dd>
      </div>
      <div className="tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-x-4 tw-gap-y-1">
        <dt className="tw-min-w-0 tw-break-words tw-font-normal tw-text-iron-400">
          {t(locale, "rep.categories.grant.assignedRepLabel", {
            name: profileName,
          })}
        </dt>
        <dd className="tw-m-0 tw-ml-auto tw-whitespace-nowrap tw-font-medium tw-text-iron-100">
          {formatInteger(locale, assigned)}
        </dd>
      </div>
    </dl>
  );
}
