"use client";

import styles from "./LatestActivity.module.scss";
import LatestActivityRow from "./LatestActivityRow";
import { areEqualAddresses, isNextgenContract } from "@/helpers/Helpers";
import { normalizeNextgenTokenID } from "../nextGen/nextgen_helpers";
import type { Transaction } from "@/entities/ITransaction";
import type { NFT } from "@/entities/INFT";
import type { NextGenCollection } from "@/entities/INextgen";

interface ActivityTableProps {
  readonly activity: Transaction[] | undefined;
  readonly nfts: NFT[] | undefined;
  readonly nextgenCollections: NextGenCollection[];
}

export default function ActivityTable({
  activity,
  nfts,
  nextgenCollections,
}: ActivityTableProps) {
  if (activity === undefined || nfts === undefined) {
    return null;
  }

  return (
    <div className={`tw-pt-3 ${styles["scrollContainer"] ?? ""}`}>
      <table className={styles["activityTable"]}>
        <tbody>
          {activity.map((tr) => {
            let nft = undefined;
            let nextgenCollection = undefined;
            if (isNextgenContract(tr.contract)) {
              const normalized = normalizeNextgenTokenID(tr.token_id);
              nextgenCollection = nextgenCollections.find(
                (c) => c.id === normalized.collection_id
              );
            } else {
              nft = nfts.find(
                (n) =>
                  n.id === tr.token_id &&
                  areEqualAddresses(n.contract, tr.contract)
              );
            }

            return (
              <LatestActivityRow
                nft={nft}
                nextgen_collection={nextgenCollection}
                tr={tr}
                key={`${tr.from_address}-${tr.to_address}-${tr.transaction}-${tr.token_id}`}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
