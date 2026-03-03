"use client";

import type { ApiRepOverview } from "@/generated/models/ApiRepOverview";
import UserPageRepNewRepSearch from "./UserPageRepNewRepSearch";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

export default function UserPageRepNewRep({
  profile,
  overview,
  onSuccess,
  onCancel,
}: {
  readonly profile: ApiIdentity;
  readonly overview: ApiRepOverview | null;
  readonly onSuccess?: () => void;
  readonly onCancel?: () => void;
}) {
  const searchProps = onSuccess ? { onSuccess } : {};

  return (
    <UserPageRepNewRepSearch
      overview={overview}
      profile={profile}
      onCancel={onCancel}
      {...searchProps}
    />
  );
}
