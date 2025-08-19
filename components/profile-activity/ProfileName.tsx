"use client";

import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import { createPossessionStr } from "@/helpers/Helpers";
import { useIdentity } from "@/hooks/useIdentity";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
export enum ProfileNameType {
  POSSESSION = "POSSESSION",
  DEFAULT = "DEFAULT",
}

export default function ProfileName({
  type,
}: {
  readonly type: ProfileNameType;
}) {
  const params = useParams();
  const handleOrWallet = params?.user?.toString().toLowerCase();

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
