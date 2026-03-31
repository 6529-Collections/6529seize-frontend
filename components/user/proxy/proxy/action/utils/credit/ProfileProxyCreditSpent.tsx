import type { ApiProfileProxyAction } from "@/generated/models/ApiProfileProxyAction";
import { formatNumberWithCommas } from "@/helpers/Helpers";

export default function ProfileProxyCreditSpent({
  profileProxyAction,
}: {
  readonly profileProxyAction: ApiProfileProxyAction;
}) {
  return (
    <div className="tw-flex tw-items-center lg:tw-justify-center">
      <p className="tw-mb-0 tw-flex tw-items-center tw-gap-x-1.5 tw-text-md tw-font-normal tw-text-iron-500">
        <span className="tw-font-normal tw-text-iron-500">Spent:</span>
        <span className="tw-font-medium tw-text-iron-300">
          {formatNumberWithCommas(profileProxyAction.credit_spent ?? 0)}
        </span>
      </p>
    </div>
  );
}
