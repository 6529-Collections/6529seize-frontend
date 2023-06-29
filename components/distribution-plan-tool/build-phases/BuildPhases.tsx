import { useContext, useEffect, useState } from "react";
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "../DistributionPlanToolContext";
import { AllowlistOperationCode } from "../../allowlist-tool/allowlist-tool.types";
import BuildPhase from "./build-phase/BuildPhase";

export interface BuildPhasesPhase {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly hasRan: boolean;
  readonly components: BuildPhasesPhaseComponent[];
}

export interface BuildPhasesPhaseComponent {
  id: string;
  name: string;
  description: string;
  spotsNotRan: boolean;
  spots: number | null;
}

export default function BuildPhases() {
  const { operations, phases, setStep, runOperations } = useContext(
    DistributionPlanToolContext
  );
  const [phasesByOp, setPhasesByOp] = useState<BuildPhasesPhase[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<BuildPhasesPhase | null>();
  useEffect(() => {
    const createPhasesOperations = operations.filter(
      (operation) => operation.code === AllowlistOperationCode.ADD_PHASE
    );
    setPhasesByOp(
      createPhasesOperations.map((phaseOp) => ({
        id: phaseOp.params.id,
        name: phaseOp.params.name,
        description: phaseOp.params.description,
        hasRan: phaseOp.hasRan,
        components: operations
          .filter(
            (operation) =>
              operation.code === AllowlistOperationCode.ADD_COMPONENT &&
              operation.params.phaseId === phaseOp.params.id
          )
          .map((operation) => ({
            id: operation.params.id,
            name: operation.params.name,
            description: operation.params.description,
            spotsNotRan: operations.some(
              (operation2) =>
                operation2.code ===
                  AllowlistOperationCode.COMPONENT_ADD_SPOTS_TO_ALL_ITEM_WALLETS &&
                operation2.params.componentId === operation.params.id &&
                !operation2.hasRan
            ),
            spots:
              phases
                .find((p) => p.id === phaseOp.params.id)
                ?.components.find((c) => c.id === operation.params.id)
                ?.winnersSpotsCount || null,
          })),
      }))
    );
  }, [operations, phases]);

  useEffect(() => {
    if (!phasesByOp.length) return;
    if (selectedPhase) {
      setSelectedPhase(phasesByOp.find((p) => p.id === selectedPhase.id));
      return;
    }
    setSelectedPhase(phasesByOp.at(0));
  }, [phasesByOp, selectedPhase]);

  const onNextStep = async () => {
    const index = phasesByOp.findIndex((p) => p.id === selectedPhase?.id);
    if (index === -1) return;
    if (index === phasesByOp.length - 1) {
      const haveNotRan = operations.some((op) => !op.hasRan);
      if (haveNotRan) {
        await runOperations();
      }
      setStep(DistributionPlanToolStep.REVIEW);
      return;
    }
    setSelectedPhase(phasesByOp.at(index + 1));
  };

  return (
    <>
      {selectedPhase && (
        <BuildPhase
          onNextStep={onNextStep}
          phase={selectedPhase}
          key={`selected-phase-${selectedPhase.id}`}
        />
      )}
    </>
  );
}
