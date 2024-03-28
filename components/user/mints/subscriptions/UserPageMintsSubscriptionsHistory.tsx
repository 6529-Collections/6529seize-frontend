import styles from "./UserPageMintsSubscriptions.module.scss";
import { Container, Row, Col, Accordion } from "react-bootstrap";
import {
  SubscriptionLog,
  SubscriptionTopUp,
} from "../../../../entities/ISubscription";
import EthereumIcon from "../../utils/icons/EthereumIcon";
import EtherscanIcon from "../../utils/icons/EtherscanIcon";
import {
  getDateDisplay,
  getTransactionLink,
} from "../../../../helpers/Helpers";
import { sepolia } from "wagmi";

export default function UserPageMintsSubscriptionsHistory(
  props: Readonly<{
    topups: SubscriptionTopUp[];
    logs: SubscriptionLog[];
  }>
) {
  return (
    <Container className="no-padding">
      <Row>
        <Col>
          <h2 className="tw-mb-1 tw-text-xl tw-font-semibold tw-text-iron-50 sm:tw-text-l sm:tw-tracking-tight">
            Subscription History
          </h2>
        </Col>
      </Row>
      <Row className="pt-2 pb-2">
        <Col>
          <LogAccordion logs={props.logs} />
        </Col>
      </Row>
      <Row className="pt-2 pb-2">
        <Col>
          <TopUpAccordion history={props.topups} />
        </Col>
      </Row>
      <Row className="pt-2 pb-2">
        <Col>
          <RedeemedSubscriptionsAccordion history={props.topups} />
        </Col>
      </Row>
    </Container>
  );
}

function RedeemedSubscriptionsAccordion(
  props: Readonly<{ history: SubscriptionTopUp[] }>
) {
  return (
    <Accordion>
      <Accordion.Item defaultChecked={true} eventKey={"0"}>
        <Accordion.Button className={styles.topUpHistoryAccordionButton}>
          <b>Redeemed Subscriptions</b>
        </Accordion.Button>
        <Accordion.Body className={styles.topUpHistoryAccordionBody}>
          <div className="d-flex flex-column gap-2">
            {props.history.map((topUp) => (
              <TopUpEntry key={topUp.hash} topUp={topUp} />
            ))}
          </div>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}

function LogAccordion(props: Readonly<{ logs: SubscriptionLog[] }>) {
  return (
    <Accordion>
      <Accordion.Item defaultChecked={true} eventKey={"0"}>
        <Accordion.Button className={styles.topUpHistoryAccordionButton}>
          <b>Log History</b>
        </Accordion.Button>
        <Accordion.Body className={styles.topUpHistoryAccordionBody}>
          <div className="d-flex flex-column gap-2">
            {props.logs.map((log) => (
              <LogEntry key={`subscription-log-${log.id}`} log={log} />
            ))}
          </div>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}

function TopUpAccordion(props: Readonly<{ history: SubscriptionTopUp[] }>) {
  return (
    <Accordion>
      <Accordion.Item defaultChecked={true} eventKey={"0"}>
        <Accordion.Button className={styles.topUpHistoryAccordionButton}>
          <b>Top Up History</b>
        </Accordion.Button>
        <Accordion.Body className={styles.topUpHistoryAccordionBody}>
          <div className="d-flex flex-column gap-2">
            {props.history.map((topUp) => (
              <TopUpEntry key={topUp.hash} topUp={topUp} />
            ))}
          </div>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}

function TopUpEntry(
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
          <span>from: {props.topUp.from_wallet}</span>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="font-color-silver">
            {getDateDisplay(new Date(props.topUp.transaction_date))}
          </div>
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

function LogEntry(
  props: Readonly<{
    log: SubscriptionLog;
  }>
) {
  return (
    <div className={styles.topUpHistoryEntry}>
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-1">{props.log.log}</div>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="font-color-silver">
            {getDateDisplay(new Date(props.log.created_at))}
          </div>
        </div>
      </div>
    </div>
  );
}
