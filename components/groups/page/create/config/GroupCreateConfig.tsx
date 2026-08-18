import type { ApiCreateGroupDescription } from "@/generated/models/ApiCreateGroupDescription";
import type { Dispatch, SetStateAction } from "react";
import GroupCreateConfigHeader from "../GroupCreateConfigHeader";
import GroupCreateCIC from "./GroupCreateCIC";
import GroupCreateLevel from "./GroupCreateLevel";
import GroupCreateRep from "./GroupCreateRep";
import GroupCreateTDH from "./GroupCreateTDH";
import GroupCreateCollections from "./nfts/GroupCreateCollections";
import GroupCreateNfts from "./nfts/GroupCreateNfts";
import GroupCreateXtdhGrant from "./xtdh-grant/GroupCreateXtdhGrant";
import GroupCreateWallets, {
  type GroupCreateWalletSources,
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
  beneficiaryGrantId,
  beneficiaryGrantMatchMode,
  iAmIncluded,
  includeWalletSources,
  excludeWalletSources,
  setLevel,
  setTDH,
  setCIC,
  setRep,
  setWallets,
  setExcludeWallets,
  setNfts,
  setBeneficiaryGrantId,
  setBeneficiaryGrantMatchMode,
  setIncludeWalletSources,
  setExcludeWalletSources,
}: {
  readonly level: ApiCreateGroupDescription["level"];
  readonly tdh: ApiCreateGroupDescription["tdh"];
  readonly cic: ApiCreateGroupDescription["cic"];
  readonly rep: ApiCreateGroupDescription["rep"];
  readonly wallets: ApiCreateGroupDescription["identity_addresses"];
  readonly excludeWallets: ApiCreateGroupDescription["excluded_identity_addresses"];
  readonly nfts: ApiCreateGroupDescription["owns_nfts"];
  readonly beneficiaryGrantId: ApiCreateGroupDescription["is_beneficiary_of_grant_id"];
  readonly beneficiaryGrantMatchMode: ApiCreateGroupDescription["is_beneficiary_of_grant_match_mode"];
  readonly iAmIncluded: boolean;
  readonly includeWalletSources: GroupCreateWalletSources;
  readonly excludeWalletSources: GroupCreateWalletSources;
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
  readonly setBeneficiaryGrantId: (
    grantId: ApiCreateGroupDescription["is_beneficiary_of_grant_id"]
  ) => void;
  readonly setBeneficiaryGrantMatchMode: (
    matchMode: ApiCreateGroupDescription["is_beneficiary_of_grant_match_mode"]
  ) => void;
  readonly setIncludeWalletSources: Dispatch<
    SetStateAction<GroupCreateWalletSources>
  >;
  readonly setExcludeWalletSources: Dispatch<
    SetStateAction<GroupCreateWalletSources>
  >;
}) {
  return (
    <div className="tw-grid tw-grid-cols-2 tw-gap-x-6 tw-gap-y-6 sm:tw-gap-y-8">
      <div className="tw-col-span-full tw-space-y-4 sm:tw-space-y-5">
        <GroupCreateConfigHeader />
        <div className="tw-grid tw-grid-cols-1 tw-gap-x-6 tw-gap-y-4 sm:tw-gap-y-6 lg:tw-grid-cols-2">
          <GroupCreateLevel level={level} setLevel={setLevel} />
          <GroupCreateTDH tdh={tdh} setTDH={setTDH} />
          <GroupCreateCIC cic={cic} setCIC={setCIC} />
          <GroupCreateRep rep={rep} setRep={setRep} />
          <GroupCreateNfts nfts={nfts} setNfts={setNfts} />
          <GroupCreateCollections nfts={nfts} setNfts={setNfts} />
          <GroupCreateXtdhGrant
            beneficiaryGrantId={beneficiaryGrantId}
            beneficiaryGrantMatchMode={beneficiaryGrantMatchMode}
            setBeneficiaryGrantId={setBeneficiaryGrantId}
            setBeneficiaryGrantMatchMode={setBeneficiaryGrantMatchMode}
          />
        </div>
      </div>

      <GroupCreateWallets
        type={GroupCreateWalletsType.INCLUDE}
        iAmIncluded={iAmIncluded}
        wallets={wallets}
        sources={includeWalletSources}
        setSources={setIncludeWalletSources}
        setWallets={setWallets}
        walletsLimit={10000}
      />
      <GroupCreateWallets
        type={GroupCreateWalletsType.EXCLUDE}
        wallets={excludeWallets}
        iAmIncluded={iAmIncluded}
        sources={excludeWalletSources}
        setSources={setExcludeWalletSources}
        setWallets={setExcludeWallets}
        walletsLimit={1000}
      />
    </div>
  );
}
