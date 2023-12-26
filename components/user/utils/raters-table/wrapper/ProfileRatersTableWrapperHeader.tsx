import { useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import { createPossessionStr } from "../../../../../helpers/Helpers";
import { ProfileRatersTableType } from "./ProfileRatersTableWrapper";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../../services/api/common-api";
import { useRouter } from "next/router";

export default function ProfileRatersTableWrapperHeader({
  type,
}: {
  readonly type: ProfileRatersTableType;
}) {
  const router = useRouter();
  const handleOrWallet = (router.query.user as string).toLowerCase();

  const { data: profile } = useQuery<IProfileAndConsolidations>({
    queryKey: [QueryKey.PROFILE, handleOrWallet],
    queryFn: async () =>
      await commonApiFetch<IProfileAndConsolidations>({
        endpoint: `profiles/${handleOrWallet}`,
      }),
    enabled: !!handleOrWallet,
  });

  const [possessionName, setPossessionName] = useState<string>(
    createPossessionStr(profile?.profile?.handle ?? null)
  );

  useEffect(() => {
    setPossessionName(createPossessionStr(profile?.profile?.handle ?? null));
  }, [profile]);

  return (
    <div className="tw-h-16 tw-px-6 md:tw-px-8">
      <div className="tw-h-full tw-flex tw-items-center tw-justify-between tw-w-full tw-border-b tw-border-t-0 tw-border-x-0 tw-border-solid tw-border-white/10">
        <h3 className="mb-0 tw-text-lg tw-font-semibold tw-text-iron-50 tw-tracking-tight">
          {type === ProfileRatersTableType.CIC_RECEIVED && (
            <div>
              CIC Ratings of <span>{possessionName}</span>
            </div>
          )}
          {type === ProfileRatersTableType.REP_RECEIVED && (
            <div>Who&apos;s Repping {profile?.profile?.handle}</div>
          )}
          {type === ProfileRatersTableType.REP_GIVEN && (
            <div>Who&apos;s {profile?.profile?.handle} Repping</div>
          )}
        </h3>
      </div>
    </div>
  );
}
