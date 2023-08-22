import styles from "./UserPage.module.scss";
import { Col, Container, Row } from "react-bootstrap";
import { useState } from "react";
import { Owner } from "../../entities/IOwner";
import { ConsolidatedTDHMetrics, TDHMetrics } from "../../entities/ITDH";
import { VIEW } from "../consolidation-switch/ConsolidationSwitch";
import UserPageCollection from "./UserPageCollection";
import UserPageActivity from "./UserPageActivity";
import UserPageDistributions from "./UserPageDistributions";
import UserPageStats from "./UserPageStats";

interface Props {
  ownerAddress: `0x${string}` | undefined;
  owned: Owner[];
  view: VIEW;
  consolidatedTDH?: ConsolidatedTDHMetrics;
  tdh?: ConsolidatedTDHMetrics | TDHMetrics;
  isConsolidation: boolean;
}

export enum Focus {
  COLLECTION,
  ACTIVITY,
  DISTRIBUTIONS,
  STATS,
}

const DISTRIBUTIONS_PAGE_SIZE = 25;

export default function UserPageDetails(props: Props) {
  const [focus, setFocus] = useState<Focus>(Focus.COLLECTION);

  return (
    <Container>
      <Row className="pt-5 pb-5">
        <Col className="d-flex align-items-center justify-content-center">
          <h3
            className={
              focus === Focus.COLLECTION ? styles.focusActive : styles.focus
            }
            onClick={() => setFocus(Focus.COLLECTION)}>
            Collection
          </h3>
          <h3>&nbsp;|&nbsp;</h3>
          <h3
            className={
              focus === Focus.ACTIVITY ? styles.focusActive : styles.focus
            }
            onClick={() => setFocus(Focus.ACTIVITY)}>
            Activity
          </h3>
          <h3>&nbsp;|&nbsp;</h3>
          <h3
            className={
              focus === Focus.DISTRIBUTIONS ? styles.focusActive : styles.focus
            }
            onClick={() => setFocus(Focus.DISTRIBUTIONS)}>
            Distributions
          </h3>
          <h3>&nbsp;|&nbsp;</h3>
          <h3
            className={
              focus === Focus.STATS ? styles.focusActive : styles.focus
            }
            onClick={() => setFocus(Focus.STATS)}>
            Stats
          </h3>
        </Col>
      </Row>
      <UserPageCollection
        show={focus === Focus.COLLECTION}
        owned={props.owned}
        tdh={props.tdh}
      />
      <UserPageActivity
        show={focus === Focus.ACTIVITY}
        ownerAddress={props.ownerAddress}
        view={props.view}
        consolidatedTDH={props.consolidatedTDH}
      />
      <UserPageDistributions
        show={focus === Focus.DISTRIBUTIONS}
        ownerAddress={props.ownerAddress}
        view={props.view}
        consolidatedTDH={props.consolidatedTDH}
        isConsolidation={props.isConsolidation}
      />
      <UserPageStats
        show={focus === Focus.STATS}
        ownerAddress={props.ownerAddress}
      />
    </Container>
  );
}
