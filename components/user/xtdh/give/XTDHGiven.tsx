"use client";

import CapacityCard from "./CapacityCard";
import AllocateSection from "./allocate/AllocateSection";
import GivenGrantsTable from "./given/GivenGrantsTable";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

export default function XTDHGiven({ profile }: { readonly profile: ApiIdentity }) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <CapacityCard profile={profile} />

      <AllocateSection profile={profile} onAllocate={() => { /* future wiring */ }} />

      <GivenGrantsTable />
    </div>
  );
}
