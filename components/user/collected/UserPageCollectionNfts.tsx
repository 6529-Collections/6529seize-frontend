import { useEffect, useState } from "react";
import { NFTLite } from "../../../entities/INFT";
import { OwnerLite } from "../../../entities/IOwner";
import {
  areEqualAddresses,
  isGradientsContract,
  isMemesContract,
} from "../../../helpers/Helpers";
import { ConsolidatedTDHMetrics, TDHMetrics } from "../../../entities/ITDH";
import { Season } from "../../../entities/ISeason";
import UserPageCollectionNft from "./UserPageCollectionNft";
import { Row } from "react-bootstrap";
import { UserCollectionSort } from "./UserPageCollection";
import { SortDirection } from "../../../entities/ISort";
import { assertUnreachable } from "../../../helpers/AllowlistToolHelpers";
import UserPageDetailsNothingHere from "../UserPageDetailsNothingHere";

export interface IUserNFT extends NFTLite {
  readonly nftTDH: number | null;
  readonly boostedTDH: number | null;
  readonly nftRank: number | null;
  readonly userBalance: number;
  readonly isMemes: boolean;
  readonly isGradients: boolean;
}

export default function UserPageCollectionNfts({
  owned,
  nfts,
  tdh,
  hideSeized,
  hideNonSeized,
  hideGradients,
  hideMemes,
  selectedSeason,
  seasons,
  sort,
  sortDir,
}: {
  readonly owned: OwnerLite[];
  readonly nfts: NFTLite[];
  readonly tdh: ConsolidatedTDHMetrics | TDHMetrics | null;
  readonly hideSeized: boolean;
  readonly hideNonSeized: boolean;
  readonly hideGradients: boolean;
  readonly hideMemes: boolean;
  readonly selectedSeason: number;
  readonly seasons: Season[];
  readonly sort: UserCollectionSort;
  readonly sortDir: SortDirection;
}) {
  const [allNfts, setAllNfts] = useState<IUserNFT[]>([]);
  const [filteredNfts, setFilteredNfts] = useState<IUserNFT[]>([]);
  const [finalNfts, setFinalNfts] = useState<IUserNFT[]>([]);

  const getNftTdhAndRank = ({
    nft,
    tdhs,
    isMemes,
    isGradients,
  }: {
    nft: NFTLite;
    tdhs: ConsolidatedTDHMetrics | TDHMetrics | null;
    isMemes: boolean;
    isGradients: boolean;
  }): { tdh: number | null; rank: number | null } => {
    if (!tdhs) {
      return {
        tdh: null,
        rank: null,
      };
    }

    if (isMemes) {
      return {
        tdh: tdhs.memes?.find((m) => m.id === nft.id)?.tdh ?? null,
        rank: tdhs.memes_ranks?.find((g) => g.id === nft.id)?.rank ?? null,
      };
    }

    if (isGradients) {
      return {
        tdh: tdhs.gradients?.find((m) => m.id === nft.id)?.tdh ?? null,
        rank: tdhs.gradients_ranks?.find((g) => g.id === nft.id)?.rank ?? null,
      };
    }

    return {
      tdh: null,
      rank: null,
    };
  };

  useEffect(() => {
    const nftsMapped = nfts.map<IUserNFT>((nft) => {
      const userBalance =
        owned.find(
          (b) =>
            b.token_id === nft.id && areEqualAddresses(b.contract, nft.contract)
        )?.balance ?? 0;
      const isMemes = isMemesContract(nft.contract);
      const isGradients = isGradientsContract(nft.contract);
      const { tdh: nftTDH, rank: nftRank } = getNftTdhAndRank({
        nft,
        tdhs: tdh,
        isMemes,
        isGradients,
      });
      return {
        ...nft,
        nftTDH,
        nftRank,
        userBalance,
        isMemes,
        isGradients,
        boostedTDH: nftTDH ? nftTDH * (tdh?.boost ?? 1) : null,
      };
    });
    setAllNfts(nftsMapped);
  }, [nfts, owned]);

  useEffect(() => {
    const filtered = allNfts.filter((nft) => {
      if (nft.userBalance > 0 && hideSeized) {
        return false;
      }
      if (nft.userBalance === 0 && (hideNonSeized || nft.isGradients)) {
        return false;
      }
      if (nft.userBalance > 0 && nft.isGradients && hideGradients) {
        return false;
      }
      if (nft.userBalance > 0 && nft.isMemes && hideMemes) {
        return false;
      }

      const season = seasons.find((s) => s.token_ids.includes(nft.id))?.season;

      if (selectedSeason != 0 && selectedSeason != season) {
        return false;
      }

      return true;
    });

    setFilteredNfts(filtered);
  }, [
    allNfts,
    hideSeized,
    hideNonSeized,
    hideGradients,
    hideMemes,
    selectedSeason,
    seasons,
  ]);

  useEffect(() => {
    switch (sort) {
      case UserCollectionSort.ID:
        setFinalNfts(
          [...filteredNfts].sort((a, b) => {
            if (a.contract !== b.contract) {
              return a.contract > b.contract ? 1 : -1;
            }
            if (sortDir === SortDirection.ASC) {
              return a.id > b.id ? 1 : -1;
            }
            return a.id > b.id ? -1 : 1;
          })
        );
        break;
      case UserCollectionSort.TDH:
        setFinalNfts(
          [...filteredNfts].sort((a, b) => {
            const aTDH = a.nftTDH ?? 0;
            const bTDH = b.nftTDH ?? 0;
            if (sortDir === SortDirection.ASC) {
              return aTDH > bTDH ? 1 : -1;
            }
            return aTDH > bTDH ? -1 : 1;
          })
        );
        break;
      case UserCollectionSort.RANK:
        setFinalNfts(
          [...filteredNfts].sort((a, b) => {
            const aRank = a.nftRank ?? 0;
            const bRank = b.nftRank ?? 0;
            if (sortDir === SortDirection.ASC) {
              return aRank > bRank ? 1 : -1;
            }
            return aRank > bRank ? -1 : 1;
          })
        );
        break;
      default:
        assertUnreachable(sort);
    }
  }, [sort, sortDir, filteredNfts]);

  return (
    <Row className="pt-2">
      {finalNfts.length ? (
        finalNfts.map((nft) => (
          <UserPageCollectionNft
            key={`user-page-collection-nft-${nft.contract}-${nft.id}`}
            nft={nft}
          />
        ))
      ) : (
        <UserPageDetailsNothingHere />
      )}
    </Row>
  );
}
