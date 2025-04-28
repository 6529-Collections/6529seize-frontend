import { useRouter } from "next/router";
import { ApiIdentity } from "../../generated/models/ApiIdentity";
import { useEffect, useState } from "react";
import { createPossessionStr } from "../../helpers/Helpers";
import { assertUnreachable } from "../../helpers/AllowlistToolHelpers";
import { useIdentity } from "../../hooks/useIdentity";
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

  const { profile } = useIdentity({
    handleOrWallet: handleOrWallet,
    initialProfile: null,
  });

  const createName = (profile: ApiIdentity | null): string => {
    switch (type) {
      case ProfileNameType.POSSESSION:
        return createPossessionStr(profile?.handle ?? null);
      case ProfileNameType.DEFAULT:
        return profile?.handle ?? "";
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
