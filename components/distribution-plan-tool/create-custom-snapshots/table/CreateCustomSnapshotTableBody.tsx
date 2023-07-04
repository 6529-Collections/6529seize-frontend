import { useContext, useEffect, useState } from "react";
import { DistributionPlanToolContext } from "../../DistributionPlanToolContext";
import {
  AllowlistCustomTokenPool,
  AllowlistOperationCode,
} from "../../../allowlist-tool/allowlist-tool.types";
import { AnimatePresence, motion } from "framer-motion";
import AllowlistToolAnimationWrapper from "../../../allowlist-tool/common/animation/AllowlistToolAnimationWrapper";
import DistributionPlanTableBodyWrapper from "../../common/DistributionPlanTableBodyWrapper";
import DistributionPlanTableRowWrapper from "../../common/DistributionPlanTableRowWrapper";
import CreateCustomSnapshotTableRow from "./CreateCustomSnapshotTableRow";

export default function CreateCustomSnapshotTableBody() {
  const { distributionPlan, operations } = useContext(
    DistributionPlanToolContext
  );

  const [customSnapshots, setCustomSnapshots] = useState<
    AllowlistCustomTokenPool[]
  >([]);

  useEffect(() => {
    if (!distributionPlan) return;
    const customSnapshotOperations = operations.filter(
      (o) => o.code === AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL
    );
    setCustomSnapshots(
      customSnapshotOperations.map<AllowlistCustomTokenPool>((o) => ({
        id: o.params.id,
        allowlistId: distributionPlan.id,
        name: o.params.name,
        description: o.params.description,
        walletsCount: new Set(o.params.tokens.map((t: any) => t.owner)).size,
        tokensCount: o.params.tokens.length,
      }))
    );
  }, [operations, distributionPlan]);
  return (
    <DistributionPlanTableBodyWrapper>
      {customSnapshots.map((snapshot) => (
        <CreateCustomSnapshotTableRow key={snapshot.id} snapshot={snapshot} />
      ))}
    </DistributionPlanTableBodyWrapper>
  );
}
