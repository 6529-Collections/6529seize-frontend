"use client";

import { useContext, useState } from "react";
import DistributionPlanSecondaryText from "@/components/distribution-plan-tool/common/DistributionPlanSecondaryText";
import ComponentConfigNextBtn from "../ComponentConfigNextBtn";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import type { Pool } from "@/components/allowlist-tool/allowlist-tool.types";
import BuildPhaseFormConfigModalTitle from "../BuildPhaseFormConfigModalTitle";
import SelectSnapshotDropdown from "./SelectSnapshotDropdown";
import type { DistributionPlanSnapshot } from "@/components/distribution-plan-tool/build-phases/build-phase/form/BuildPhaseFormConfigModal";
import ComponentConfigMeta from "../ComponentConfigMeta";

export default function SelectSnapshot({
  snapshots,
  onSelectSnapshot,
  title,
  onClose,
  isLoading,
}: {
  snapshots: DistributionPlanSnapshot[];
  onSelectSnapshot: (param: {
    snapshotId: string;
    snapshotType: Pool;
    uniqueWalletsCount: number | null;
  }) => void;
  title: string;
  onClose: () => void;
  isLoading: boolean;
}) {
  const { setToasts } = useContext(DistributionPlanToolContext);

  const [selectedSnapshot, setSelectedSnapshot] =
    useState<DistributionPlanSnapshot | null>(null);

  const onAddSnapshot = async () => {
    if (!selectedSnapshot) {
      setToasts({
        messages: ["Please select a snapshot."],
        type: "error",
      });
      return;
    }
    onSelectSnapshot({
      snapshotId: selectedSnapshot.id,
      snapshotType: selectedSnapshot.poolType,
      uniqueWalletsCount: selectedSnapshot.walletsCount,
    });
  };

  return (
    <div className="tw-p-6">
      <BuildPhaseFormConfigModalTitle title={title} onClose={onClose} />
      <DistributionPlanSecondaryText>
        First, select a snapshot to include in this group.
        <br />
        You can add more snapshots later.
      </DistributionPlanSecondaryText>

      <div className="tw-mt-6">
        <SelectSnapshotDropdown
          snapshots={snapshots}
          selectedSnapshot={selectedSnapshot}
          setSelectedSnapshot={setSelectedSnapshot}
        />
      </div>
      <ComponentConfigNextBtn
        showSkipBtn={false}
        showNextBtn={!!selectedSnapshot}
        onSkip={() => undefined}
        onNext={onAddSnapshot}
        isDisabled={false}
        isLoading={isLoading}>
        <ComponentConfigMeta
          tags={[]}
          walletsCount={selectedSnapshot?.walletsCount ?? null}
          isLoading={false}
        />
      </ComponentConfigNextBtn>
    </div>
  );
}
