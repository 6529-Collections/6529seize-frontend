import styles from "./UserPageMintsSubscriptions.module.scss";
import { Container, Row, Col, Accordion } from "react-bootstrap";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { SubscriptionTopUp } from "../../../../entities/ISubscription";
import { useState, useEffect } from "react";
import { commonApiFetch } from "../../../../services/api/common-api";
import EthereumIcon from "../../utils/icons/EthereumIcon";
import EtherscanIcon from "../../utils/icons/EtherscanIcon";
import { getTransactionLink } from "../../../../helpers/Helpers";
import { sepolia } from "wagmi";

export default function UserPageMintsSubscriptionsTopUpHistory(
  props: Readonly<{
    profile: IProfileAndConsolidations;
  }>
) {
  const [topUp, setTopUp] = useState<SubscriptionTopUp[]>([]);

  useEffect(() => {
    commonApiFetch<{
      count: number;
      page: number;
      next: boolean;
      data: SubscriptionTopUp[];
    }>({
      endpoint: `subscriptions/consolidation-top-up/${props.profile.consolidation.consolidation_key}`,
    }).then((data) => {
      setTopUp(data.data);
    });
  }, []);

  return (
    <Container className="no-padding">
      <Row>
        <Col>
          <Accordion>
            <Accordion.Item defaultChecked={true} eventKey={"0"}>
              <Accordion.Button className={styles.topUpHistoryAccordionButton}>
                <b>Top Up History</b>
              </Accordion.Button>
              <Accordion.Body className={styles.topUpHistoryAccordionBody}>
                <div className="d-flex flex-column gap-2">
                  {topUp.map((topUp) => (
                    <TopUpEntry key={topUp.hash} topUp={topUp} />
                  ))}
                </div>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Col>
      </Row>
    </Container>
  );
}

export function TopUpEntry(
  props: Readonly<{
    topUp: SubscriptionTopUp;
  }>
) {
  return (
    <div className={styles.topUpHistoryEntry}>
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-1">
            <b>+ {props.topUp.amount}</b>
            <div className="tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-h-5 tw-w-5">
              <EthereumIcon />
            </div>
          </div>
          <span className="font-color-silver">
            from: {props.topUp.from_wallet}
          </span>
        </div>
        <div className="d-flex align-items-center">
          <div className="tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-h-5 tw-w-5">
            <a
              className="d-flex align-items-center"
              target="_blank"
              rel="noreferrer"
              href={getTransactionLink(sepolia.id, props.topUp.hash)}>
              <EtherscanIcon />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
