import DropPfp from "../../../drops/create/utils/DropPfp";
import { formatNumberWithCommasOrDash } from "../../../../helpers/Helpers";
import { useIdentity } from "../../../../hooks/useIdentity";
import { useIdentityBalance } from "../../../../hooks/useIdentityBalance";
import UserCICTypeIcon from "../user-cic-type/UserCICTypeIcon";
import UserLevel from "../level/UserLevel";
import { CLASSIFICATIONS, CicStatement } from "../../../../entities/IProfile";
import { useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "../../../../services/api/common-api";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { STATEMENT_GROUP, STATEMENT_TYPE } from "../../../../helpers/Types";
import { useEffect, useState } from "react";

export default function UserProfileTooltip({
  user,
}: {
  readonly user: string;
}) {
  const { profile } = useIdentity({
    handleOrWallet: user,
    initialProfile: null,
  });

  const { data: balance } = useIdentityBalance({
    consolidationKey: profile?.consolidation_key ?? null,
  });

  const { data: statements } = useQuery<CicStatement[]>({
    queryKey: [QueryKey.PROFILE_CIC_STATEMENTS, user.toLowerCase()],
    queryFn: async () =>
      await commonApiFetch<CicStatement[]>({
        endpoint: `profiles/${user}/cic/statements`,
      }),
    enabled: !!user && !!profile?.handle,
  });

  const [aboutStatement, setAboutStatement] = useState<CicStatement | null>(
    null
  );

  useEffect(() => {
    const about = statements?.find(
      (statement) =>
        statement.statement_type === STATEMENT_TYPE.BIO &&
        statement.statement_group === STATEMENT_GROUP.GENERAL
    );
    setAboutStatement(about ?? null);
  }, [statements]);

  const description = profile?.classification
    ? CLASSIFICATIONS[profile.classification]?.title
    : null;

  return (
    <div className="tailwind-scope tw-bg-iron-950 tw-border tw-border-iron-800 tw-rounded-lg tw-p-4 tw-min-w-[280px] tw-max-w-[320px]">
      <div className="tw-flex tw-gap-x-4">
        <div className="tw-flex-shrink-0">
          <DropPfp pfpUrl={profile?.pfp} />
        </div>
        <div className="tw-flex tw-flex-col tw-gap-y-1 -tw-mt-1">
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <span className="tw-text-base tw-font-semibold tw-text-iron-50 tw-truncate">
              {profile?.handle || profile?.display}
            </span>
            {profile && (
              <div className="tw-h-4 tw-w-4">
                <UserCICTypeIcon cic={profile.cic} />
              </div>
            )}
          </div>
          {description && (
            <p className="tw-text-xs tw-text-iron-400 tw-mb-0">{description}</p>
          )}
        </div>
      </div>
      {profile && (
        <div className="tw-mt-4">
          <UserLevel level={profile.level} size="xs" />
        </div>
      )}

      {aboutStatement && (
        <p className="tw-text-sm tw-text-iron-300 tw-mt-4 tw-line-clamp-5">
          {aboutStatement.statement_value}
        </p>
      )}
      <div className="tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-2 tw-mt-4">
        <div className="tw-flex tw-items-center tw-gap-x-1.5">
          <span className="tw-text-sm tw-font-medium tw-text-iron-100">
            {formatNumberWithCommasOrDash(profile?.tdh ?? 0)}
          </span>
          <span className="tw-text-sm tw-text-iron-500">TDH</span>
        </div>
        <div className="tw-flex tw-items-center tw-gap-x-1.5">
          <span className="tw-text-sm tw-font-medium tw-text-iron-100">
            {formatNumberWithCommasOrDash(profile?.rep ?? 0)}
          </span>
          <span className="tw-text-sm tw-text-iron-500">REP</span>
        </div>
        <div className="tw-flex tw-items-center tw-gap-x-1.5">
          <span className="tw-text-sm tw-font-medium tw-text-iron-100">
            {formatNumberWithCommasOrDash(profile?.cic ?? 0)}
          </span>
          <span className="tw-text-sm tw-text-iron-500">NIC</span>
        </div>
        <div className="tw-flex tw-items-center tw-gap-x-1.5">
          <span className="tw-text-sm tw-font-medium tw-text-iron-100">
            {formatNumberWithCommasOrDash(balance?.total_balance ?? 0)}
          </span>
          <span className="tw-text-sm tw-text-iron-500">Balance</span>
        </div>
      </div>
    </div>
  );
}
