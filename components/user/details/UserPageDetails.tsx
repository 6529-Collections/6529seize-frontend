import { Container } from "react-bootstrap";
import { OwnerLite } from "../../../entities/IOwner";
import { ConsolidatedTDHMetrics, TDHMetrics } from "../../../entities/ITDH";
import UserPageCollection from "./collection/UserPageCollection";
import UserPageActivity from "./UserPageActivity";
import UserPageDistributions from "./UserPageDistributions";
import UserPageStats from "./UserPageStats";
import UserPageOverview from "../UserPageOverview";
import { useEffect, useState } from "react";
import UserPageDetailsHeader from "./UserPageDetailsHeader";
import { NFT, NFTLite } from "../../../entities/INFT";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { useRouter } from "next/router";
import { Season } from "../../../entities/ISeason";

interface Props {
  activeAddress: string | null;
  mainAddress: string;
  owned: OwnerLite[];
  tdh: ConsolidatedTDHMetrics | TDHMetrics | null;
  profile: IProfileAndConsolidations;
  loading: boolean;
  memesLite: NFTLite[];
  gradients: NFT[];
  seasons: Season[];
}

export enum Focus {
  COLLECTION = "collection",
  ACTIVITY = "activity",
  DISTRIBUTIONS = "distributions",
  STATS = "stats",
}

export default function UserPageDetails(props: Props) {
  const router = useRouter();
  const [focus, setFocus] = useState<Focus>(
    (router.query.focus as Focus) ?? Focus.COLLECTION
  );

  useEffect(() => {
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, focus },
      },
      undefined,
      { shallow: true }
    );
  }, [focus]);

  return (
    <Container>
      <UserPageDetailsHeader focus={focus} setFocus={setFocus} />
      <UserPageCollection
        show={focus === Focus.COLLECTION}
        owned={props.owned}
        tdh={props.tdh}
        memesLite={props.memesLite}
        loading={props.loading}
        gradients={props.gradients}
        seasons={props.seasons}
      />
      <UserPageActivity
        show={focus === Focus.ACTIVITY}
        activeAddress={props.activeAddress}
        memesLite={props.memesLite}
        profile={props.profile}
      />
      <UserPageDistributions
        show={focus === Focus.DISTRIBUTIONS}
        activeAddress={props.activeAddress}
        profile={props.profile}
      />
      <UserPageOverview show={focus === Focus.STATS} tdh={props.tdh} />
      <UserPageStats
        show={focus === Focus.STATS}
        mainAddress={props.mainAddress}
      />
    </Container>
  );
}
