"use client";

import {
  DROPDOWN_CHECKMARK_CLASSES,
  getDropdownOptionStateClasses,
} from "@/components/utils/select/dropdown/dropdownTriggerStyles";
import { Pool } from "@/components/allowlist-tool/allowlist-tool.types";
import type { DistributionPlanSnapshot } from "@/components/distribution-plan-tool/build-phases/build-phase/form/BuildPhaseFormConfigModal";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import { useEffect, useState } from "react";

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
      case Pool.WALLET_POOL:
        setSubTitle("Wallets");
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
      className={`tw-group tw-relative tw-cursor-pointer tw-select-none tw-rounded-lg tw-py-2.5 tw-pl-3 tw-pr-9 tw-transition tw-duration-300 tw-ease-out ${getDropdownOptionStateClasses(isSelected)}`}
      role="option"
      aria-selected="true"
    >
      <div className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-x-4 tw-pr-4">
        <div className="tw-flex-1">
          <span className="tw-block tw-truncate tw-font-normal">
            {snapshot.name}
          </span>
        </div>

        <div className="tw-flex-1 tw-text-right">
          <span className="tw-block tw-truncate tw-text-xs tw-font-light tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out group-hover:tw-text-iron-400">
            {subTitle}
          </span>
        </div>
        <div className="tw-flex-1 tw-text-right">
          <span className="tw-truncate tw-pl-2 tw-text-xs tw-font-light tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out group-hover:tw-text-iron-400">
            {snapshot.walletsCount} wallets
          </span>
        </div>
      </div>

      {isSelected && (
        <span className="tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-4 tw-text-white">
          <svg
            className={`tw-h-5 tw-w-5 ${DROPDOWN_CHECKMARK_CLASSES}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
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
