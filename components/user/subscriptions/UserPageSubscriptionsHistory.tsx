import Pagination from "@/components/pagination/Pagination";
import { MEMES_CONTRACT } from "@/constants";
import { RedeemedSubscription } from "@/generated/models/RedeemedSubscription";
import { SubscriptionLog } from "@/generated/models/SubscriptionLog";
import { SubscriptionTopUp } from "@/generated/models/SubscriptionTopUp";
import {
  areEqualAddresses,
  formatAddress,
  getDateDisplay,
  getTransactionLink,
} from "@/helpers/Helpers";
import { Page } from "@/helpers/Types";
import { Accordion, Col, Container, Row } from "react-bootstrap";
import { mainnet } from "wagmi/chains";
import EthereumIcon from "../utils/icons/EthereumIcon";
import EtherscanIcon from "../utils/icons/EtherscanIcon";
import styles from "./UserPageSubscriptions.module.scss";

export default function UserPageSubscriptionsHistory(
  props: Readonly<{
    topups: Page<SubscriptionTopUp>;
    redeemed: Page<RedeemedSubscription>;
    logs: Page<SubscriptionLog>;
    setRedeemedPage: (page: number) => void;
    setTopUpPage: (page: number) => void;
    setLogsPage: (page: number) => void;
  }>
) {
  return (
    <Container className="no-padding">
      <Row>
        <Col>
          <h5 className="mb-0 tw-font-semibold">Subscription History</h5>
        </Col>
      </Row>
      <hr className="tw-border-white tw-opacity-100 tw-border-2 tw-mt-1" />
      <Row className="pb-2">
        <Col>
          <RedeemedSubscriptionsAccordion
            history={props.redeemed}
            setPage={props.setRedeemedPage}
          />
        </Col>
      </Row>
      <Row className="pt-2 pb-2">
        <Col>
          <LogAccordion logs={props.logs} setPage={props.setLogsPage} />
        </Col>
      </Row>
      <Row className="pt-2 pb-2">
        <Col>
          <TopUpAccordion history={props.topups} setPage={props.setTopUpPage} />
        </Col>
      </Row>
    </Container>
  );
}

function RedeemedSubscriptionsAccordion(
  props: Readonly<{
    history: Page<RedeemedSubscription>;
    setPage: (page: number) => void;
  }>
) {
  return (
    <Accordion>
      <Accordion.Item defaultChecked={true} eventKey={"0"}>
        <Accordion.Button className={styles.topUpHistoryAccordionButton}>
          <b>Redeemed Subscriptions</b>
        </Accordion.Button>
        <Accordion.Body className={styles.topUpHistoryAccordionBody}>
          <div className="d-flex flex-column gap-2">
            {props.history.data.length > 0 ? (
              props.history.data.map((redeem) => (
                <RedeemedEntry key={redeem.transaction} redeem={redeem} />
              ))
            ) : (
              <div className="font-color-silver">
                No Redeemed Subscriptions found
              </div>
            )}
          </div>
          {props.history.count > 0 && props.history.count / 10 > 1 && (
            <div className="text-center mt-3">
              <Pagination
                page={props.history.page}
                pageSize={10}
                totalResults={props.history.count}
                setPage={props.setPage}
              />
            </div>
          )}
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}

function LogAccordion(
  props: Readonly<{
    logs: Page<SubscriptionLog>;
    setPage: (page: number) => void;
  }>
) {
  return (
    <Accordion>
      <Accordion.Item defaultChecked={true} eventKey={"0"}>
        <Accordion.Button className={styles.topUpHistoryAccordionButton}>
          <b>Log History</b>
        </Accordion.Button>
        <Accordion.Body className={styles.topUpHistoryAccordionBody}>
          <div className="d-flex flex-column gap-2">
            {props.logs.data.length > 0 ? (
              props.logs.data.map((log) => (
                <LogEntry key={`subscription-log-${log.id}`} log={log} />
              ))
            ) : (
              <div className="font-color-silver">No logs found</div>
            )}
            {props.logs.count > 0 && props.logs.count / 10 > 1 && (
              <div className="text-center mt-3">
                <Pagination
                  page={props.logs.page}
                  pageSize={10}
                  totalResults={props.logs.count}
                  setPage={props.setPage}
                />
              </div>
            )}
          </div>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}

function TopUpAccordion(
  props: Readonly<{
    history: Page<SubscriptionTopUp>;
    setPage: (page: number) => void;
  }>
) {
  return (
    <Accordion>
      <Accordion.Item defaultChecked={true} eventKey={"0"}>
        <Accordion.Button className={styles.topUpHistoryAccordionButton}>
          <b>Top Up History</b>
        </Accordion.Button>
        <Accordion.Body className={styles.topUpHistoryAccordionBody}>
          <div className="d-flex flex-column gap-2">
            {props.history.data.length > 0 ? (
              props.history.data.map((topUp) => (
                <TopUpEntry key={topUp.hash} topUp={topUp} />
              ))
            ) : (
              <div className="font-color-silver">No Top Ups found</div>
            )}
          </div>
          {props.history.count > 0 && props.history.count / 10 > 1 && (
            <div className="text-center mt-3">
              <Pagination
                page={props.history.page}
                pageSize={10}
                totalResults={props.history.count}
                setPage={props.setPage}
              />
            </div>
          )}
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
              rel="noopener noreferrer"
              href={getTransactionLink(mainnet.id, props.topUp.hash)}
              aria-label="View transaction on Etherscan">
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
            {props.log.created_at &&
              getDateDisplay(new Date(props.log.created_at))}
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
            Redeemed Subscription for {contractName} #{props.redeem.token_id} x
            {props.redeem.count}
          </div>
          <div className="font-smaller font-color-silver">
            Airdrop Address: {formatAddress(props.redeem.address)} - Balance
            after redemption: {props.redeem.balance_after} ETH
          </div>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="font-color-silver no-wrap">
            {(props.redeem.transaction_date ?? props.redeem.created_at) &&
              getDateDisplay(
                new Date(
                  (props.redeem.transaction_date ??
                    props.redeem.created_at) as Date
                )
              )}
          </div>
          <div className="tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-h-5 tw-w-5">
            <a
              className="d-flex align-items-center"
              target="_blank"
              rel="noopener noreferrer"
              href={getTransactionLink(mainnet.id, props.redeem.transaction)}
              aria-label="View transaction on Etherscan">
              <EtherscanIcon />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
