"use client";

import CapacityCard from "./CapacityCard";
import AllocateSection from "./allocate/AllocateSection";
import GivenGrantsTable from "./given/GivenGrantsTable";
import { useXtdhGivenGrants, useXtdhSummary } from "@/hooks/useXtdh";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

export default function XTDHGiven({ profile }: { readonly profile: ApiIdentity }) {
  const { data: summary } = useXtdhSummary(
    typeof profile?.tdh_rate === "number" ? profile.tdh_rate : null,
  );
  const { data: outgoing, isLoading, isFetching } = useXtdhGivenGrants();

  const base = typeof summary?.baseRatePerDay === "number" ? summary.baseRatePerDay : 0;
  const multiplier = typeof summary?.multiplier === "number" ? summary.multiplier : 0;
  const capacity = base * multiplier;
  const allocated = typeof summary?.allocatedRatePerDay === "number" ? summary.allocatedRatePerDay : 0;
  const remaining = Math.max(0, capacity - allocated);

  return (
    <>
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-5 tw-gap-4">
        <div className="lg:tw-col-span-2 tw-flex tw-flex-col tw-gap-4">
          <CapacityCard
            allocatedPerDay={summary?.allocatedRatePerDay ?? null}
            capacityPerDay={capacity}
            remainingPerDay={remaining}
          />
        </div>

        <div className="lg:tw-col-span-3">
          <AllocateSection
            capacityPerDay={capacity}
            allocatedPerDay={allocated}
            onAllocate={() => {
              /* kept for future wiring */
            }}
          />
        </div>
      </div>

      <GivenGrantsTable rows={outgoing?.rows ?? []} loading={isLoading || isFetching} />
    </>
  );
}
