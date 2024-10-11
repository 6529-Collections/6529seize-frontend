import { ApiCreateGroupDescription } from "../../../../../generated/models/ApiCreateGroupDescription";
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
  readonly level: ApiCreateGroupDescription["level"];
  readonly tdh: ApiCreateGroupDescription["tdh"];
  readonly cic: ApiCreateGroupDescription["cic"];
  readonly rep: ApiCreateGroupDescription["rep"];
  readonly wallets: ApiCreateGroupDescription["identity_addresses"];
  readonly excludeWallets: ApiCreateGroupDescription["excluded_identity_addresses"];
  readonly nfts: ApiCreateGroupDescription["owns_nfts"];
  readonly iAmIncluded: boolean;
  readonly setLevel: (level: ApiCreateGroupDescription["level"]) => void;
  readonly setTDH: (tdh: ApiCreateGroupDescription["tdh"]) => void;
  readonly setCIC: (cic: ApiCreateGroupDescription["cic"]) => void;
  readonly setRep: (rep: ApiCreateGroupDescription["rep"]) => void;
  readonly setWallets: (
    wallets: ApiCreateGroupDescription["identity_addresses"]
  ) => void;
  readonly setExcludeWallets: (
    wallets: ApiCreateGroupDescription["excluded_identity_addresses"]
  ) => void;
  readonly setNfts: (nfts: ApiCreateGroupDescription["owns_nfts"]) => void;
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
