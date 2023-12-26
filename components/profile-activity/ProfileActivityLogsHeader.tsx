import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { IProfileAndConsolidations } from "../../entities/IProfile";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../services/api/common-api";
import { useEffect, useState } from "react";
import { createPossessionStr } from "../../helpers/Helpers";

export default function ProfileActivityLogsHeader({
  subTitle,
}: {
  readonly subTitle: string;
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
          <span>{possessionName}</span> {subTitle} Activity Log
        </h3>
      </div>
    </div>
  );
}
