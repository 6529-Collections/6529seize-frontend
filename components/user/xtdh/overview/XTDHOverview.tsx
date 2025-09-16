"use client";

import XTDHHeaderStats from "../header/XTDHHeaderStats";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import NextActions from "./NextActions";
import WhatIsXTDHCard from "./WhatIsXTDHCard";

export default function XTDHOverview({ profile }: { readonly profile: ApiIdentity }) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <XTDHHeaderStats profile={profile} />

      <NextActions profile={profile} />

      <WhatIsXTDHCard />
    </div>
  );
}
