import { UserPageMintsPhase } from "./UserPageMints";
import UserPageMintsPhasesPhase from "./UserPageMintsPhasesPhase";

export default function UserPageMintsPhases({
  phases,
}: {
  readonly phases: UserPageMintsPhase[];
}) {
  return (
    <>
      {phases.map((phase) => (
        <UserPageMintsPhasesPhase key={phase.name} phase={phase} />
      ))}
    </>
  );
}
