import { BuildPhasesPhase } from "../BuildPhases";

export default function BuildPhase({ phase }: { phase: BuildPhasesPhase }) {
    
  return <div>{phase.name}</div>;
}
