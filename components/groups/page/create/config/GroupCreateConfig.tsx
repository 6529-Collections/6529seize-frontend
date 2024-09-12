import { CreateGroupDescription } from "../../../../../generated/models/CreateGroupDescription";
import GroupCreateConfigHeader from "../GroupCreateConfigHeader";
import GroupCreateCIC from "./GroupCreateCIC";
import GroupCreateLevel from "./GroupCreateLevel";
import GroupCreateRep from "./GroupCreateRep";
import GroupCreateTDH from "./GroupCreateTDH";
import GroupCreateNfts from "./nfts/GroupCreateNfts";
import GroupCreateWallets, {
  GroupCreateWalletsType,
} from "./wallets/GroupCreateWallets";

export default function GroupCreateConfig({
  level,
  tdh,
  cic,
  rep,
  wallets,
  excludeWallets,
  nfts,
  iAmIncluded,
  setLevel,
  setTDH,
  setCIC,
  setRep,
  setWallets,
  setExcludeWallets,
  setNfts,
}: {
  readonly level: CreateGroupDescription["level"];
  readonly tdh: CreateGroupDescription["tdh"];
  readonly cic: CreateGroupDescription["cic"];
  readonly rep: CreateGroupDescription["rep"];
  readonly wallets: CreateGroupDescription["identity_addresses"];
  readonly excludeWallets: CreateGroupDescription["excluded_identity_addresses"];
  readonly nfts: CreateGroupDescription["owns_nfts"];
  readonly iAmIncluded: boolean;
  readonly setLevel: (level: CreateGroupDescription["level"]) => void;
  readonly setTDH: (tdh: CreateGroupDescription["tdh"]) => void;
  readonly setCIC: (cic: CreateGroupDescription["cic"]) => void;
  readonly setRep: (rep: CreateGroupDescription["rep"]) => void;
  readonly setWallets: (
    wallets: CreateGroupDescription["identity_addresses"]
  ) => void;
  readonly setExcludeWallets: (
    wallets: CreateGroupDescription["excluded_identity_addresses"]
  ) => void;
  readonly setNfts: (nfts: CreateGroupDescription["owns_nfts"]) => void;
}) {
  return (
    <div className="tw-grid tw-grid-cols-2 tw-gap-x-6 tw-gap-y-6 sm:tw-gap-y-8">
      <div className="tw-space-y-4 sm:tw-space-y-5 tw-col-span-full">
        <GroupCreateConfigHeader />
        <div className="tw-gap-x-6 tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-y-4 sm:tw-gap-y-6">
          <GroupCreateLevel level={level} setLevel={setLevel} />
          <GroupCreateTDH tdh={tdh} setTDH={setTDH} />
          <GroupCreateCIC cic={cic} setCIC={setCIC} />
          <GroupCreateRep rep={rep} setRep={setRep} />
        </div>
      </div>
      <GroupCreateNfts nfts={nfts} setNfts={setNfts} />
      <GroupCreateWallets
        type={GroupCreateWalletsType.INCLUDE}
        iAmIncluded={iAmIncluded}
        wallets={wallets}
        setWallets={setWallets}
        walletsLimit={10000}
      />
      <GroupCreateWallets
        type={GroupCreateWalletsType.EXCLUDE}
        wallets={excludeWallets}
        iAmIncluded={iAmIncluded}
        setWallets={setExcludeWallets}
        walletsLimit={1000}
      />
    </div>
  );
}
