import { useEffect, useState } from "react";
import { Transaction } from "../../../../../../../entities/ITransaction";
import CommonTimeAgo from "../../../../../../utils/CommonTimeAgo";
import UserPageStatsActivityWalletTableRowIcon from "./UserPageStatsActivityWalletTableRowIcon";
import { areEqualAddresses } from "../../../../../../../helpers/Helpers";
import {
  MANIFOLD,
  NULL_ADDRESS,
  NULL_DEAD_ADDRESS,
} from "../../../../../../../constants";
import { IProfileAndConsolidations } from "../../../../../../../entities/IProfile";
import UserPageStatsActivityWalletTableRowMainAddress from "./UserPageStatsActivityWalletTableRowMainAddress";
import { MemeLite } from "../../../../../settings/UserSettingsImgSelectMeme";
import UserPageStatsActivityWalletTableRowSecondAddress from "./UserPageStatsActivityWalletTableRowSecondAddress";

export enum TransactionType {
  AIRDROP = "AIRDROP",
  MINT = "MINT",
  SALE = "SALE",
  PURCHASE = "PURCHASE",
  TRANSFER_IN = "TRANSFER_IN",
  TRANSFER_OUT = "TRANSFER_OUT",
  BURN = "BURN",
}

const TYPE_TP_ACTION: Record<TransactionType, string> = {
  [TransactionType.AIRDROP]: "received airdrop",
  [TransactionType.MINT]: "minted",
  [TransactionType.SALE]: "sold",
  [TransactionType.PURCHASE]: "purchased",
  [TransactionType.TRANSFER_IN]: "received",
  [TransactionType.TRANSFER_OUT]: "transferred",
  [TransactionType.BURN]: "burned",
};

export default function UserPageStatsActivityWalletTableRow({
  transaction,
  profile,
  memes,
}: {
  readonly transaction: Transaction;
  readonly profile: IProfileAndConsolidations;
  readonly memes: MemeLite[];
}) {
  const [consolidatedAddresses, setConsolidatedAddresses] = useState<string[]>(
    profile.consolidation.wallets.map((w) => w.wallet.address.toLowerCase())
  );

  useEffect(
    () =>
      setConsolidatedAddresses(
        profile.consolidation.wallets.map((w) => w.wallet.address.toLowerCase())
      ),
    [profile]
  );

  const getType = (): TransactionType => {
    if (
      areEqualAddresses(NULL_ADDRESS, transaction.from_address) &&
      !transaction.value
    ) {
      return TransactionType.AIRDROP;
    }

    if (
      areEqualAddresses(NULL_ADDRESS, transaction.from_address) ||
      areEqualAddresses(MANIFOLD, transaction.from_address)
    ) {
      return TransactionType.MINT;
    }

    if (
      areEqualAddresses(NULL_ADDRESS, transaction.to_address) ||
      areEqualAddresses(NULL_DEAD_ADDRESS, transaction.to_address)
    ) {
      return TransactionType.BURN;
    }

    if (
      transaction.value &&
      consolidatedAddresses.includes(transaction.to_address.toLowerCase())
    ) {
      return TransactionType.PURCHASE;
    }

    if (
      transaction.value &&
      consolidatedAddresses.includes(transaction.from_address.toLowerCase())
    ) {
      return TransactionType.SALE;
    }

    if (consolidatedAddresses.includes(transaction.to_address.toLowerCase())) {
      return TransactionType.TRANSFER_IN;
    }
    return TransactionType.TRANSFER_OUT;
  };

  const type = getType();

  const meme = memes.find((m) => m.id === transaction.token_id);
  const showAnotherSide = [
    TransactionType.PURCHASE,
    TransactionType.SALE,
    TransactionType.TRANSFER_IN,
    TransactionType.TRANSFER_OUT,
  ].includes(type);

  const value = transaction.value;

  return (
    <tr className="tw-flex tw-items-center tw-justify-between">
      <td className="tw-py-2.5 tw-inline-flex tw-space-x-2">
        <UserPageStatsActivityWalletTableRowIcon type={type} />
        <UserPageStatsActivityWalletTableRowMainAddress
          transaction={transaction}
          type={type}
          profile={profile}
        />
        <div>{TYPE_TP_ACTION[type]}</div>
        {transaction.token_count > 1 && <div>x{transaction.token_count}</div>}
        <div>
          {meme?.name} (#{transaction.token_id})
        </div>
        <img src={meme?.icon ?? ""} alt={meme?.name ?? ""} />
        {showAnotherSide && (
          <UserPageStatsActivityWalletTableRowSecondAddress
            type={type}
            transaction={transaction}
          />
        )}
        {value && <div>for {value} ETH</div>}
      </td>
      <td className="tw-py-2.5 tw-pl-3 tw-text-right">
        <CommonTimeAgo
          timestamp={new Date(transaction.transaction_date).getTime()}
        />
      </td>
    </tr>
  );
}
