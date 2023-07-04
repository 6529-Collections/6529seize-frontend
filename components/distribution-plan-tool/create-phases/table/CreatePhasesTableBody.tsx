import { useContext, useEffect, useState } from "react";
import DistributionPlanTableBodyWrapper from "../../common/DistributionPlanTableBodyWrapper";
import { DistributionPlanToolContext } from "../../DistributionPlanToolContext";
import { AllowlistOperationCode } from "../../../allowlist-tool/allowlist-tool.types";
import CreateTablePhasesRow from "./CreateTablePhasesRow";
export interface CreatePhasesPhase {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly hasRan: boolean;
}

export default function CreatePhasesTableBody() {
  const { operations } = useContext(DistributionPlanToolContext);

  const [phases, setPhases] = useState<CreatePhasesPhase[]>([]);

  useEffect(() => {
    const createPhasesOperations = operations.filter(
      (operation) => operation.code === AllowlistOperationCode.ADD_PHASE
    );
    setPhases(
      createPhasesOperations.map((operation) => ({
        id: operation.params.id,
        name: operation.params.name,
        description: operation.params.description,
        hasRan: operation.hasRan,
      }))
    );
  }, [operations]);
  return (
    <DistributionPlanTableBodyWrapper>
      {phases.map((phase) => (
        <CreateTablePhasesRow key={phase.id} phase={phase} />
      ))}
    </DistributionPlanTableBodyWrapper>
  );
}
