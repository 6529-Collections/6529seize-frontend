"use client";

import { useState } from "react";
import CommonSelect, {
  type CommonSelectItem,
} from "@/components/utils/select/CommonSelect";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

type XtdhViewFilter = "granted" | "received";

const XTDH_FILTER_ITEMS: CommonSelectItem<XtdhViewFilter>[] = [
  {
    key: "granted",
    label: "Granted",
    value: "granted",
  },
  {
    key: "received",
    label: "Received",
    value: "received",
  },
];

export default function UserPageXtdh({
  profile: _profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const [activeFilter, setActiveFilter] = useState<XtdhViewFilter>("granted");

  return (
    <div className="tailwind-scope tw-flex tw-flex-col tw-gap-6">
      <div className="tw-w-full tw-overflow-x-auto horizontal-menu-hide-scrollbar">
        <CommonSelect
          items={XTDH_FILTER_ITEMS}
          activeItem={activeFilter}
          filterLabel="xTDH View"
          setSelected={setActiveFilter}
        />
      </div>

      <div className="tw-text-sm tw-text-iron-300">
        {activeFilter === "granted"
          ? "Showing xTDH items you have granted."
          : "Showing xTDH items you have received."}
      </div>
    </div>
  );
}
