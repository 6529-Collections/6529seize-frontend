"use client";

import type {
  ApiProfileRepRatesState,
} from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

import UserPageRepNewRepSearch from "./UserPageRepNewRepSearch";

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
