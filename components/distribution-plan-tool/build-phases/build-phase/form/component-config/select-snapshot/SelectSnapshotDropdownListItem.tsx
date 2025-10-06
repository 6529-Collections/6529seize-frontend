"use client";

import { useEffect, useState } from "react";
import { DistributionPlanSnapshot } from "@/components/distribution-plan-tool/build-phases/build-phase/form/BuildPhaseFormConfigModal";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import { Pool } from "@/components/allowlist-tool/allowlist-tool.types";

export default function SelectSnapshotDropdownListItem({
  snapshot,
  selectedSnapshot,
  setSelectedSnapshot,
}: {
  snapshot: DistributionPlanSnapshot;
  selectedSnapshot: DistributionPlanSnapshot | null;
  setSelectedSnapshot: (snapshot: DistributionPlanSnapshot) => void;
}) {
  const [isSelected, setIsSelected] = useState(false);
  const [subTitle, setSubTitle] = useState("");

  useEffect(() => {
    switch (snapshot.poolType) {
      case Pool.TOKEN_POOL:
        setSubTitle("Snapshot");
        break;
      case Pool.CUSTOM_TOKEN_POOL:
        setSubTitle("Custom Snapshot");
        break;
      default:
        assertUnreachable(snapshot.poolType);
    }
  }, [snapshot.poolType]);

  useEffect(() => {
    setIsSelected(selectedSnapshot?.id === snapshot.id);
  }, [selectedSnapshot, snapshot.id]);

  return (
    <li
      onClick={(e) => {
        e.stopPropagation();
        setSelectedSnapshot(snapshot);
      }}
      className="tw-group tw-text-white tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-py-2.5 tw-pl-3 tw-pr-9 hover:tw-bg-neutral-700 tw-transition tw-duration-300 tw-ease-out"
      role="option"
      aria-selected="true">
      <div className="tw-w-full tw-flex tw-justify-between tw-items-center tw-gap-x-4 tw-pr-4">
        <div className="tw-flex-1">
          <span className="tw-font-normal tw-block tw-truncate">
            {snapshot.name}
          </span>
        </div>

        <div className="tw-flex-1 tw-text-right">
          <span className="tw-font-light tw-text-neutral-500 tw-text-xs tw-block tw-truncate group-hover:tw-text-neutral-400 tw-transition tw-duration-300 tw-ease-out">
            {subTitle}
          </span>
        </div>
        <div className="tw-flex-1 tw-text-right">
          <span className="tw-pl-2 tw-font-light tw-text-neutral-500 tw-text-xs tw-truncate group-hover:tw-text-neutral-400 tw-transition tw-duration-300 tw-ease-out">
            {snapshot.walletsCount} wallets
          </span>
        </div>
      </div>

      {isSelected && (
        <span className="tw-text-white tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-4">
          <svg
            className="tw-h-5 tw-w-5 tw-text-white"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      )}
    </li>
  );
}
