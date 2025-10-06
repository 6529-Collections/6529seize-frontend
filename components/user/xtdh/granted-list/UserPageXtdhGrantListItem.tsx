import type { ApiTdhGrantsPage } from "@/generated/models/ApiTdhGrantsPage";
import {
  formatAmount,
  formatDateTime,
  formatTargetTokens,
} from "@/components/user/xtdh/utils/xtdhGrantFormatters";

export interface UserPageXtdhGrantListItemProps {
  readonly grant: ApiTdhGrantsPage["data"][number];
}

export function UserPageXtdhGrantListItem({
  grant,
}: Readonly<UserPageXtdhGrantListItemProps>) {
  return (
    <li className="tw-list-none tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4 tw-space-y-2">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
        <h3 className="tw-text-sm tw-font-semibold tw-text-iron-100 tw-m-0">
          {grant.target_contract}
        </h3>
        <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-800 tw-px-2 tw-py-0.5 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-200">
          {grant.status}
        </span>
      </div>
      <p className="tw-text-xs tw-text-iron-300 tw-m-0">
        Tokens: {formatTargetTokens(grant.target_tokens)}
      </p>
      <div className="tw-flex tw-flex-wrap tw-gap-4 tw-text-xs tw-text-iron-200">
        <span>TDH rate: {formatAmount(grant.tdh_rate)}</span>
        <span>Valid until: {formatDateTime(grant.valid_to ?? null)}</span>
      </div>
    </li>
  );
}
