"use client";

import type {
  ApiProfileRepRatesState,
} from "@/entities/IProfile";
import UserPageRepNewRepSearch from "./UserPageRepNewRepSearch";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

export default function UserPageRepNewRep({
  profile,
  repRates,
  onSuccess,
}: {
  readonly profile: ApiIdentity;
  readonly repRates: ApiProfileRepRatesState | null;
  readonly onSuccess?: () => void;
}) {
  const searchProps = onSuccess ? { onSuccess } : {};

  return (
    <UserPageRepNewRepSearch
      repRates={repRates}
      profile={profile}
      {...searchProps}
    />
  );
}
