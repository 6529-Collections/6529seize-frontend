"use client";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import { createPossessionStr } from "@/helpers/Helpers";
import { useIdentity } from "@/hooks/useIdentity";
import { useParams } from "next/navigation";

export enum ProfileNameType {
  POSSESSION = "POSSESSION",
  DEFAULT = "DEFAULT",
}

const createProfileName = (
  profile: ApiIdentity | null,
  type: ProfileNameType
): string => {
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

export default function ProfileName({
  type,
}: {
  readonly type: ProfileNameType;
}) {
  const params = useParams();
  const handleOrWallet = params?.["user"]?.toString().toLowerCase();

  const { profile } = useIdentity({
    handleOrWallet,
    initialProfile: null,
  });

  return <>{createProfileName(profile ?? null, type)}</>;
}
