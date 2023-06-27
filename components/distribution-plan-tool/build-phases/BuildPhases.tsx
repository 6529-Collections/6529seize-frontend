import { useContext, useEffect, useState } from "react";
import { DistributionPlanToolContext } from "../DistributionPlanToolContext";
import { AllowlistOperationCode } from "../../allowlist-tool/allowlist-tool.types";
import BuildPhase from "./build-phase/BuildPhase";

export interface BuildPhasesPhase {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly hasRan: boolean;
}

export default function BuildPhases() {
  const { operations } = useContext(DistributionPlanToolContext);
  const [phases, setPhases] = useState<BuildPhasesPhase[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<BuildPhasesPhase | null>();
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

  useEffect(() => {
    if (!phases.length) return;
    setSelectedPhase(phases.at(0));
  }, [phases]);

  return (
    <>
      <div className="tw-w-full tw-inline-flex tw-justify-between tw-mb-2">
        {phases.map((phase) => (
          <div key={phase.id} onClick={() => setSelectedPhase(phase)}>
            {phase.name}
          </div>
        ))}
      </div>
      {selectedPhase && (
        <BuildPhase
          phase={selectedPhase}
          key={`selected-phase-${selectedPhase.id}`}
        />
      )}
    </>
  );
}
