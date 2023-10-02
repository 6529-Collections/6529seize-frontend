import styles from "./UserPage.module.scss";
import { Col, Container, Row } from "react-bootstrap";
import { Owner } from "../../entities/IOwner";
import { ConsolidatedTDHMetrics, TDHMetrics } from "../../entities/ITDH";
import { VIEW } from "../consolidation-switch/ConsolidationSwitch";
import UserPageCollection from "./UserPageCollection";
import UserPageActivity from "./UserPageActivity";
import UserPageDistributions from "./UserPageDistributions";
import UserPageStats from "./UserPageStats";
import UserPageOverview from "./UserPageOverview";
import { useRouter } from "next/router";

interface Props {
  ownerAddress: `0x${string}` | undefined;
  owned: Owner[];
  view: VIEW;
  consolidatedTDH?: ConsolidatedTDHMetrics;
  tdh?: ConsolidatedTDHMetrics | TDHMetrics;
  isConsolidation: boolean;
  focus: Focus;
  setFocus: (focus: Focus) => void;
}

export enum Focus {
  COLLECTION = "collection",
  ACTIVITY = "activity",
  DISTRIBUTIONS = "distributions",
  STATS = "stats",
}

export default function UserPageDetails(props: Props) {
  const router = useRouter();

  return (
    <Container>
      <Row className="pt-5 pb-5">
        <Col className="d-flex align-items-center justify-content-center">
          <h3
            className={
              props.focus === Focus.COLLECTION
                ? styles.focusActive
                : styles.focus
            }
            onClick={() => props.setFocus(Focus.COLLECTION)}>
            Collection
          </h3>
          <h3>&nbsp;|&nbsp;</h3>
          <h3
            className={
              props.focus === Focus.ACTIVITY ? styles.focusActive : styles.focus
            }
            onClick={() => props.setFocus(Focus.ACTIVITY)}>
            Activity
          </h3>
          <h3>&nbsp;|&nbsp;</h3>
          <h3
            className={
              props.focus === Focus.DISTRIBUTIONS
                ? styles.focusActive
                : styles.focus
            }
            onClick={() => props.setFocus(Focus.DISTRIBUTIONS)}>
            Distributions
          </h3>
          <h3>&nbsp;|&nbsp;</h3>
          <h3
            className={
              props.focus === Focus.STATS ? styles.focusActive : styles.focus
            }
            onClick={() => props.setFocus(Focus.STATS)}>
            Stats
          </h3>
        </Col>
      </Row>
      <UserPageCollection
        show={props.focus === Focus.COLLECTION}
        owned={props.owned}
        tdh={props.tdh}
      />
      <UserPageActivity
        show={props.focus === Focus.ACTIVITY}
        ownerAddress={props.ownerAddress}
        view={props.view}
        consolidatedTDH={props.consolidatedTDH}
      />
      <UserPageDistributions
        show={props.focus === Focus.DISTRIBUTIONS}
        ownerAddress={props.ownerAddress}
        view={props.view}
        consolidatedTDH={props.consolidatedTDH}
        isConsolidation={props.isConsolidation}
      />
      <UserPageOverview show={props.focus === Focus.STATS} tdh={props.tdh} />
      <UserPageStats
        show={props.focus === Focus.STATS}
        ownerAddress={props.ownerAddress}
      />
    </Container>
  );
}
