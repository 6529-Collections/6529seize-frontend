import { SortDirection } from "../../../../entities/ISort";
import { useState } from "react";
import { NFT, NFTLite } from "../../../../entities/INFT";
import { OwnerLite } from "../../../../entities/IOwner";
import { ConsolidatedTDHMetrics, TDHMetrics } from "../../../../entities/ITDH";
import { Season } from "../../../../entities/ISeason";
import UserPageCollectionNfts from "./UserPageCollectionNfts";
import UserPageCollectionControls from "./UserPageCollectionControls";
import DotLoader from "../../../dotLoader/DotLoader";

interface Props {
  show: boolean;
  owned: OwnerLite[];
  tdh: ConsolidatedTDHMetrics | TDHMetrics | null;
  memesLite: NFTLite[];
  gradients: NFT[];
  seasons: Season[];
  loading: boolean;
}

export enum UserCollectionSort {
  ID = "id",
  TDH = "tdh",
  RANK = "tdh_rank",
}

export default function UserPageCollection(props: Props) {
  const [sortDir, setSortDir] = useState<SortDirection>(SortDirection.ASC);
  const [sort, setSort] = useState<UserCollectionSort>(UserCollectionSort.ID);
  const [hideSeized, setHideSeized] = useState(false);
  const [hideNonSeized, setHideNonSeized] = useState(true);
  const [hideMemes, setHideMemes] = useState(false);
  const [hideGradients, setHideGradients] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(0);

  if (!props.show) {
    return <></>;
  }

  return (
    <>
      <UserPageCollectionControls
        tdh={props.tdh}
        hideSeized={hideSeized}
        hideNonSeized={hideNonSeized}
        setHideSeized={setHideSeized}
        setHideNonSeized={setHideNonSeized}
        hideGradients={hideGradients}
        setHideGradients={setHideGradients}
        hideMemes={hideMemes}
        setHideMemes={setHideMemes}
        sort={sort}
        setSort={setSort}
        sortDir={sortDir}
        setSortDir={setSortDir}
        seasons={props.seasons}
        selectedSeason={selectedSeason}
        setSelectedSeason={setSelectedSeason}
      />
      {props.loading ? (
        <DotLoader />
      ) : (
        <UserPageCollectionNfts
          owned={props.owned}
          nfts={[...props.gradients, ...props.memesLite]}
          tdh={props.tdh}
          seasons={props.seasons}
          selectedSeason={selectedSeason}
          hideSeized={hideSeized}
          hideNonSeized={hideNonSeized}
          hideMemes={hideMemes}
          hideGradients={hideGradients}
          sort={sort}
          sortDir={sortDir}
        />
      )}
    </>
  );
}
