import { useContext, useState } from "react";
import AllowlistToolSelectMenu, {
  AllowlistToolSelectMenuOption,
} from "../../../../../allowlist-tool/common/select-menu/AllowlistToolSelectMenu";
import DistributionPlanSecondaryText from "../../../../common/DistributionPlanSecondaryText";
import ComponentConfigNextBtn from "./ComponentConfigNextBtn";
import { DistributionPlanToolContext } from "../../../../DistributionPlanToolContext";
import { Pool } from "../../../../../allowlist-tool/allowlist-tool.types";

export default function SelectSnapshot({
  snapshots,
  onSelectSnapshot,
}: {
  snapshots: AllowlistToolSelectMenuOption[];
  onSelectSnapshot: (param: {
    snapshotId: string;
    snapshotType: Pool.TOKEN_POOL | Pool.CUSTOM_TOKEN_POOL;
  }) => void;
}) {
  const { setToasts } = useContext(DistributionPlanToolContext);

  const [selectedSnapshot, setSelectedSnapshot] =
    useState<AllowlistToolSelectMenuOption | null>(null);

  const onAddSnapshot = () => {
    if (!selectedSnapshot) {
      setToasts({
        messages: ["Please select a snapshot."],
        type: "error",
      });
      return;
    }
    onSelectSnapshot({
      snapshotId: selectedSnapshot.value,
      snapshotType:
        selectedSnapshot.subTitle === "Snapshot"
          ? Pool.TOKEN_POOL
          : Pool.CUSTOM_TOKEN_POOL,
    });
  };
  return (
    <div>
      <DistributionPlanSecondaryText>
        First, select a snapshot to include in this group.
        <br />
        You can add more snapshots later.
      </DistributionPlanSecondaryText>

      <div className="tw-mt-6">
        <AllowlistToolSelectMenu
          label="Snapshot"
          options={snapshots}
          selectedOption={selectedSnapshot}
          setSelectedOption={setSelectedSnapshot}
          placeholder="Select snapshot"
        />
      </div>

      <ComponentConfigNextBtn
        showSkip={false}
        onSkip={() => undefined}
        onNext={onAddSnapshot}
      />
    </div>
  );
}
