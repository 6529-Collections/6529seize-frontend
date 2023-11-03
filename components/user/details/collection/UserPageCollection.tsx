import { SortDirection } from "../../../../entities/ISort";
import { useState, useEffect } from "react";
import { NFT, NFTLite } from "../../../../entities/INFT";
import { fetchAllPages, fetchUrl } from "../../../../services/6529api";
import { Owner } from "../../../../entities/IOwner";
import { ConsolidatedTDHMetrics, TDHMetrics } from "../../../../entities/ITDH";
import { Season } from "../../../../entities/ISeason";
import UserPageCollectionNfts from "./UserPageCollectionNfts";
import UserPageCollectionControls from "./UserPageCollectionControls";

interface Props {
  show: boolean;
  owned: Owner[];
  tdh?: ConsolidatedTDHMetrics | TDHMetrics;
  memesLite: NFTLite[];
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
  const [gradients, setGradients] = useState<NFTLite[]>([]);
  const [nfts, setNfts] = useState<NFTLite[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(0);

  useEffect(() => {
    const url = `${process.env.API_ENDPOINT}/api/nfts/gradients?&page_size=101&sort=${sort}&sort_direction=${sortDir}`;
    fetchAllPages(url).then((gradients: NFT[]) => {
      setGradients(gradients);
    });
  }, []);

  useEffect(() => {
    if (!!props.memesLite.length && !!gradients.length) {
      setNfts(() => [...gradients, ...props.memesLite]);
    }
  }, [props.memesLite, gradients]);

  useEffect(() => {
    const url = `${process.env.API_ENDPOINT}/api/memes_seasons`;
    fetchUrl(url).then((seasons: any[]) => {
      setSeasons(seasons);
    });
  }, []);

  // gradients loaded
  // owned loaded
  // memes loaded
  // tdh loaded

  if (props.show) {
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
          seasons={seasons}
          selectedSeason={selectedSeason}
          setSelectedSeason={setSelectedSeason}
        />

        {!!nfts.length && (
          <UserPageCollectionNfts
            owned={props.owned}
            nfts={nfts}
            tdh={props.tdh}
            seasons={seasons}
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
  } else {
    return <></>;
  }
}
