import { CreateGroupDescription } from "../../../../../generated/models/CreateGroupDescription";
import GroupCreateCIC from "./GroupCreateCIC";
import GroupCreateLevel from "./GroupCreateLevel";
import GroupCreateRep from "./GroupCreateRep";
import GroupCreateTDH from "./GroupCreateTDH";
import GroupCreateWallets from "./wallets/GroupCreateWallets";

export default function GroupCreateConfig({
  level,
  tdh,
  cic,
  rep,
  wallets,
  setLevel,
  setTDH,
  setCIC,
  setRep,
  setWallets,
}: {
  readonly level: CreateGroupDescription["level"];
  readonly tdh: CreateGroupDescription["tdh"];
  readonly cic: CreateGroupDescription["cic"];
  readonly rep: CreateGroupDescription["rep"];
  readonly wallets: CreateGroupDescription["identity_addresses"];
  readonly setLevel: (level: CreateGroupDescription["level"]) => void;
  readonly setTDH: (tdh: CreateGroupDescription["tdh"]) => void;
  readonly setCIC: (cic: CreateGroupDescription["cic"]) => void;
  readonly setRep: (rep: CreateGroupDescription["rep"]) => void;
  readonly setWallets: (
    wallets: CreateGroupDescription["identity_addresses"]
  ) => void;
}) {
  return (
    <div className="tw-grid tw-grid-cols-2 tw-gap-x-6 tw-gap-y-8">
      <div className="tw-col-span-full tw-gap-x-8 tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-y-6 lg:tw-gap-y-8">
        <GroupCreateLevel level={level} setLevel={setLevel} />
        <GroupCreateTDH tdh={tdh} setTDH={setTDH} />
        <GroupCreateCIC cic={cic} setCIC={setCIC} />
        <GroupCreateRep rep={rep} setRep={setRep} />
      </div>
      <GroupCreateWallets wallets={wallets} setWallets={setWallets} />
    </div>
  );
}
