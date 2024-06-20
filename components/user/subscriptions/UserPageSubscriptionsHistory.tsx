import styles from "./UserPageSubscriptions.module.scss";
import { Container, Row, Col, Accordion } from "react-bootstrap";
import {
  RedeemedSubscription,
  SubscriptionLog,
  SubscriptionTopUp,
} from "../../../entities/ISubscription";
import EthereumIcon from "../utils/icons/EthereumIcon";
import EtherscanIcon from "../utils/icons/EtherscanIcon";
import {
  areEqualAddresses,
  formatAddress,
  getDateDisplay,
  getTransactionLink,
} from "../../../helpers/Helpers";
import { mainnet } from "wagmi/chains";
import { MEMES_CONTRACT } from "../../../constants";

export default function UserPageSubscriptionsHistory(
  props: Readonly<{
    topups: SubscriptionTopUp[];
    redeemed: RedeemedSubscription[];
    logs: SubscriptionLog[];
  }>
) {
  return (
    <Container className="no-padding">
      <Row>
        <Col>
          <h5>Subscription History</h5>
        </Col>
      </Row>
      <Row className="pt-2 pb-2">
        <Col>
          <RedeemedSubscriptionsAccordion history={props.redeemed} />
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
    </Container>
  );
}

function RedeemedSubscriptionsAccordion(
  props: Readonly<{ history: RedeemedSubscription[] }>
) {
  return (
    <Accordion>
      <Accordion.Item defaultChecked={true} eventKey={"0"}>
        <Accordion.Button className={styles.topUpHistoryAccordionButton}>
          <b>Redeemed Subscriptions</b>
        </Accordion.Button>
        <Accordion.Body className={styles.topUpHistoryAccordionBody}>
          <div className="d-flex flex-column gap-2">
            {props.history.length > 0 ? (
              props.history.map((redeem) => (
                <RedeemedEntry key={redeem.transaction} redeem={redeem} />
              ))
            ) : (
              <div className="font-color-silver">
                No Redeemed Subscriptions found
              </div>
            )}
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
            {props.logs.length > 0 ? (
              props.logs.map((log) => (
                <LogEntry key={`subscription-log-${log.id}`} log={log} />
              ))
            ) : (
              <div className="font-color-silver">No logs found</div>
            )}
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
            {props.history.length > 0 ? (
              props.history.map((topUp) => (
                <TopUpEntry key={topUp.hash} topUp={topUp} />
              ))
            ) : (
              <div className="font-color-silver">No Top Ups found</div>
            )}
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
    <div className={styles.subscriptionHistoryEntry}>
      <div className="d-flex align-items-center justify-content-between gap-2">
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-1 no-wrap">
            <b>+ {props.topUp.amount}</b>
            <div className="tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-h-5 tw-w-5">
              <EthereumIcon />
            </div>
          </div>
          <span>from: {props.topUp.from_wallet}</span>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="font-color-silver no-wrap">
            {getDateDisplay(new Date(props.topUp.transaction_date))}
          </div>
          <div className="tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-h-5 tw-w-5">
            <a
              className="d-flex align-items-center"
              target="_blank"
              rel="noreferrer"
              href={getTransactionLink(mainnet.id, props.topUp.hash)}>
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
    <div className={styles.subscriptionHistoryEntry}>
      <div className="d-flex align-items-center justify-content-between gap-2">
        <div className="d-flex flex-column gap-1">
          <div>{props.log.log}</div>
          {props.log.additional_info && (
            <div className="font-smaller font-color-silver">
              {props.log.additional_info}
            </div>
          )}
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="font-color-silver no-wrap">
            {getDateDisplay(new Date(props.log.created_at))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RedeemedEntry(
  props: Readonly<{
    redeem: RedeemedSubscription;
  }>
) {
  const contractName = areEqualAddresses(props.redeem.contract, MEMES_CONTRACT)
    ? "Meme"
    : `Contract ${formatAddress(props.redeem.contract)}`;

  return (
    <div className={styles.subscriptionHistoryEntry}>
      <div className="d-flex align-items-center justify-content-between gap-2">
        <div className="d-flex flex-column gap-1">
          <div>
            Redeemed Subscription for {contractName} #{props.redeem.token_id}
          </div>
          <div className="font-smaller font-color-silver">
            Airdrop Address: {props.redeem.address} - Balance after redemption:{" "}
            {props.redeem.balance_after} ETH
          </div>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="font-color-silver no-wrap">
            {getDateDisplay(
              new Date(props.redeem.transaction_date ?? props.redeem.created_at)
            )}
          </div>
          <div className="tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-h-5 tw-w-5">
            <a
              className="d-flex align-items-center"
              target="_blank"
              rel="noreferrer"
              href={getTransactionLink(mainnet.id, props.redeem.transaction)}>
              <EtherscanIcon />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
