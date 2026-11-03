import type { ApiProfileProxyAction } from "@/generated/models/ApiProfileProxyAction";
import { formatNumberWithCommas } from "@/helpers/Helpers";

export default function ProfileProxyCreditSpent({
  profileProxyAction,
}: {
  readonly profileProxyAction: ApiProfileProxyAction;
}) {
  return (
    <div className="tw-flex tw-min-w-0 tw-items-center tw-justify-start">
      <p className="tw-m-0 tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-1.5 tw-text-meta tw-leading-5 tw-font-normal tw-text-iron-500">
        <span className="tw-font-normal tw-text-iron-500">Spent:</span>
        <span className="tw-break-all tw-font-medium tw-tabular-nums tw-text-iron-200">
          {formatNumberWithCommas(profileProxyAction.credit_spent ?? 0)}
        </span>
      </p>
    </div>
  );
}
