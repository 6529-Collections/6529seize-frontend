import { Container, Row } from "react-bootstrap";
import { Owner } from "../../../entities/IOwner";
import { ConsolidatedTDHMetrics, TDHMetrics } from "../../../entities/ITDH";
import { VIEW } from "../../consolidation-switch/ConsolidationSwitch";
import UserPageCollection from "./collection/UserPageCollection";
import UserPageActivity from "./UserPageActivity";
import UserPageDistributions from "./UserPageDistributions";
import UserPageStats from "./UserPageStats";
import UserPageOverview from "../UserPageOverview";
import { use, useEffect, useState } from "react";
import UserPageDetailsHeader from "./UserPageDetailsHeader";
import { NFTLite } from "../../../entities/INFT";
import { commonApiFetch } from "../../../services/api/common-api";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import DotLoader from "../../dotLoader/DotLoader";
import { useRouter } from "next/router";

// ?focus=collection
// ?focus=activity
// ?focus=distributions
// ?focus=stats

interface Props {
  ownerAddress: `0x${string}` | undefined;
  owned: Owner[];
  view: VIEW;
  tdh?: ConsolidatedTDHMetrics | TDHMetrics;
  profile: IProfileAndConsolidations;
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
  const [memesLite, setMemesLite] = useState<NFTLite[]>([]);

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

  useEffect(() => {
    const getMemesLite = async () => {
      const response = await commonApiFetch<{ data: NFTLite[] }>({
        endpoint: "memes_lite",
      });
      setMemesLite(response.data);
    };
    getMemesLite();
  }, []);

  if (!memesLite.length) {
    return (
      <Row>
        <DotLoader />
      </Row>
    );
  }

  return (
    <Container>
      <UserPageDetailsHeader focus={focus} setFocus={setFocus} />
      <UserPageCollection
        show={focus === Focus.COLLECTION}
        owned={props.owned}
        tdh={props.tdh}
        memesLite={memesLite}
      />
      <UserPageActivity
        show={focus === Focus.ACTIVITY}
        ownerAddress={props.ownerAddress}
        view={props.view}
        memesLite={memesLite}
        profile={props.profile}
      />
      <UserPageDistributions
        show={focus === Focus.DISTRIBUTIONS}
        ownerAddress={props.ownerAddress}
        view={props.view}
        profile={props.profile}
      />
      <UserPageOverview show={focus === Focus.STATS} tdh={props.tdh} />
      <UserPageStats
        show={focus === Focus.STATS}
        ownerAddress={props.ownerAddress}
      />
    </Container>
  );
}
