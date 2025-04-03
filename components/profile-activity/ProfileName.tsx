import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { IProfileAndConsolidations } from "../../entities/IProfile";
import { commonApiFetch } from "../../services/api/common-api";
import { useEffect, useState } from "react";
import { createPossessionStr } from "../../helpers/Helpers";
import { assertUnreachable } from "../../helpers/AllowlistToolHelpers";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
export enum ProfileNameType {
  POSSESSION = "POSSESSION",
  DEFAULT = "DEFAULT",
}

export default function ProfileName({
  type,
}: {
  readonly type: ProfileNameType;
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

  const createName = (profile: IProfileAndConsolidations | null): string => {
    switch (type) {
      case ProfileNameType.POSSESSION:
        return createPossessionStr(profile?.profile?.handle ?? null);
      case ProfileNameType.DEFAULT:
        return profile?.profile?.handle ?? "";
      default:
        assertUnreachable(type);
        return "";
    }
  };

  const [name, setName] = useState<string>(createName(profile ?? null));

  useEffect(() => {
    setName(createName(profile ?? null));
  }, [profile]);

  return <>{name}</>;
}
