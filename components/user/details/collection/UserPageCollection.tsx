import { SortDirection } from "../../../../entities/ISort";
import { useState, useEffect } from "react";
import { NFT, NFTLite } from "../../../../entities/INFT";
import { fetchAllPages, fetchUrl } from "../../../../services/6529api";
import { Owner } from "../../../../entities/IOwner";
import { ConsolidatedTDHMetrics, TDHMetrics } from "../../../../entities/ITDH";
import { Season } from "../../../../entities/ISeason";
import UserPageCollectionNfts from "./UserPageCollectionNfts";
import UserPageCollectionControls from "./UserPageCollectionControls";
import DotLoader from "../../../dotLoader/DotLoader";
import { Row } from "react-bootstrap";

interface Props {
  show: boolean;
  owned: Owner[];
  tdh: ConsolidatedTDHMetrics | TDHMetrics | null;
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
  const [gradientsLoaded, setGradientsLoaded] = useState(false);
  const [nfts, setNfts] = useState<NFTLite[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonsLoaded, setSeasonsLoaded] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (seasonsLoaded && gradientsLoaded) {
      setDataLoaded(true);
      return;
    }
    setDataLoaded(false);
  }, [seasonsLoaded, gradientsLoaded]);

  useEffect(() => {
    if (!props.show) {
      return;
    }
    if (gradientsLoaded) {
      return;
    }
    const url = `${process.env.API_ENDPOINT}/api/nfts/gradients?&page_size=101&sort=${sort}&sort_direction=${sortDir}`;
    fetchAllPages(url).then((gradients: NFT[]) => {
      setGradients(gradients);
      setGradientsLoaded(true);
    });
  }, [props.show, gradientsLoaded]);

  useEffect(() => {
    if (!!props.memesLite.length && !!gradients.length) {
      setNfts(() => [...gradients, ...props.memesLite]);
    }
  }, [props.memesLite, gradients]);

  useEffect(() => {
    if (seasonsLoaded) {
      return;
    }

    if (!props.show) {
      return;
    }

    const url = `${process.env.API_ENDPOINT}/api/memes_seasons`;
    fetchUrl(url).then((seasons: any[]) => {
      setSeasons(seasons);
      setSeasonsLoaded(true);
    });
  }, [props.show, seasonsLoaded]);

  if (!props.show) {
    return <></>;
  }

  if (!dataLoaded) {
    return (
      <Row>
        <DotLoader />
      </Row>
    );
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
        seasons={seasons}
        selectedSeason={selectedSeason}
        setSelectedSeason={setSelectedSeason}
      />
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
    </>
  );
}
