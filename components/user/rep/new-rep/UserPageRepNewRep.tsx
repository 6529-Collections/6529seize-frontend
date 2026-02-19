"use client";

import type {
  ApiProfileRepRatesState,
} from "@/entities/IProfile";
import UserPageRepNewRepSearch from "./UserPageRepNewRepSearch";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

export default function UserPageRepNewRep({
  profile,
  repRates,
}: {
  readonly profile: ApiIdentity;
  readonly repRates: ApiProfileRepRatesState | null;
}) {
  return (
    <UserPageRepNewRepSearch
      repRates={repRates}
      profile={profile}
    />
  );
}
