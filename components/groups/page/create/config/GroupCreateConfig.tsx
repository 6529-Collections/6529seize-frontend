import { GroupDescription } from "../../../../../generated/models/GroupDescription";
import GroupCreateCIC from "./GroupCreateCIC";
import GroupCreateLevel from "./GroupCreateLevel";
import GroupCreateRep from "./GroupCreateRep";
import GroupCreateTDH from "./GroupCreateTDH";
import GroupCreateWallets from "./GroupCreateWallets";

export default function GroupCreateConfig({
  level,
  tdh,
  cic,
  rep,
  setLevel,
  setTDH,
  setCIC,
  setRep,
}: {
  readonly level: GroupDescription["level"];
  readonly tdh: GroupDescription["tdh"];
  readonly cic: GroupDescription["cic"];
  readonly rep: GroupDescription["rep"];
  readonly setLevel: (level: GroupDescription["level"]) => void;
  readonly setTDH: (tdh: GroupDescription["tdh"]) => void;
  readonly setCIC: (cic: GroupDescription["cic"]) => void;
  readonly setRep: (rep: GroupDescription["rep"]) => void;
}) {
  return (
    <div className="tw-px-8 tw-flex tw-flex-col tw-gap-y-6">
      <GroupCreateLevel level={level} setLevel={setLevel} />
      <GroupCreateTDH tdh={tdh} setTDH={setTDH} />
      <GroupCreateCIC cic={cic} setCIC={setCIC} />
      <GroupCreateRep rep={rep} setRep={setRep} />
      <GroupCreateWallets />
    </div>
  );
}
