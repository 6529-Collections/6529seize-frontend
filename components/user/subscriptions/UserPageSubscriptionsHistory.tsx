import Pagination from "@/components/pagination/Pagination";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { RedeemedSubscription } from "@/generated/models/RedeemedSubscription";
import type { SubscriptionLog } from "@/generated/models/SubscriptionLog";
import type { SubscriptionTopUp } from "@/generated/models/SubscriptionTopUp";
import {
  areEqualAddresses,
  formatAddress,
  getDateDisplay,
  getTransactionLink,
} from "@/helpers/Helpers";
import type { Page } from "@/helpers/Types";
import { mainnet } from "wagmi/chains";
import EthereumIcon from "../utils/icons/EthereumIcon";
import EtherscanIcon from "../utils/icons/EtherscanIcon";
import styles from "./UserPageSubscriptions.module.scss";

function className(...classNames: readonly (string | undefined)[]): string {
  return classNames
    .filter((value): value is string => value !== undefined && value !== "")
    .join(" ");
}

const HISTORY_DISCLOSURE_SUMMARY_CLASS = className(
  styles["topUpHistoryAccordionButton"],
  "tw-flex tw-w-full tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-3 tw-px-5 tw-py-4 tw-text-left tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 [&::-webkit-details-marker]:tw-hidden"
);
const HISTORY_DISCLOSURE_CARET_CLASS =
  "tw-h-2 tw-w-2 tw-shrink-0 tw-rotate-45 tw-border-b-2 tw-border-r-2 tw-border-iron-400 tw-transition-transform tw-duration-200 group-open:tw-rotate-[225deg]";
const HISTORY_DISCLOSURE_BODY_CLASS = className(
  styles["topUpHistoryAccordionBody"],
  "tw-px-5 tw-py-4"
);

function getSubscriptionLogKey(log: SubscriptionLog): string {
  return log.id === undefined
    ? "subscription-log-undefined"
    : `subscription-log-${String(log.id)}`;
}

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
    <div>
      <div>
        <div>
          <h5 className="tw-mb-0 tw-font-semibold">Subscription History</h5>
        </div>
      </div>
      <hr className="tw-mt-1 tw-border-2 tw-border-white tw-opacity-100" />
      <div className="tw-pb-2">
        <div>
          <RedeemedSubscriptionsAccordion
            history={props.redeemed}
            setPage={props.setRedeemedPage}
          />
        </div>
      </div>
      <div className="tw-py-2">
        <div>
          <LogAccordion logs={props.logs} setPage={props.setLogsPage} />
        </div>
      </div>
      <div className="tw-py-2">
        <div>
          <TopUpAccordion history={props.topups} setPage={props.setTopUpPage} />
        </div>
      </div>
    </div>
  );
}

function RedeemedSubscriptionsAccordion(
  props: Readonly<{
    history: Page<RedeemedSubscription>;
    setPage: (page: number) => void;
  }>
) {
  return (
    <details className="tw-group" open>
      <summary className={HISTORY_DISCLOSURE_SUMMARY_CLASS}>
        <b>Redeemed Subscriptions</b>
        <span aria-hidden="true" className={HISTORY_DISCLOSURE_CARET_CLASS} />
      </summary>
      <div className={HISTORY_DISCLOSURE_BODY_CLASS}>
        <div className="tw-flex tw-flex-col tw-gap-2">
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
          <div className="tw-mt-3 tw-text-center">
            <Pagination
              page={props.history.page}
              pageSize={10}
              totalResults={props.history.count}
              setPage={props.setPage}
            />
          </div>
        )}
      </div>
    </details>
  );
}

function LogAccordion(
  props: Readonly<{
    logs: Page<SubscriptionLog>;
    setPage: (page: number) => void;
  }>
) {
  return (
    <details className="tw-group" open>
      <summary className={HISTORY_DISCLOSURE_SUMMARY_CLASS}>
        <b>Log History</b>
        <span aria-hidden="true" className={HISTORY_DISCLOSURE_CARET_CLASS} />
      </summary>
      <div className={HISTORY_DISCLOSURE_BODY_CLASS}>
        <div className="tw-flex tw-flex-col tw-gap-2">
          {props.logs.data.length > 0 ? (
            props.logs.data.map((log) => (
              <LogEntry key={getSubscriptionLogKey(log)} log={log} />
            ))
          ) : (
            <div className="font-color-silver">No logs found</div>
          )}
          {props.logs.count > 0 && props.logs.count / 10 > 1 && (
            <div className="tw-mt-3 tw-text-center">
              <Pagination
                page={props.logs.page}
                pageSize={10}
                totalResults={props.logs.count}
                setPage={props.setPage}
              />
            </div>
          )}
        </div>
      </div>
    </details>
  );
}

function TopUpAccordion(
  props: Readonly<{
    history: Page<SubscriptionTopUp>;
    setPage: (page: number) => void;
  }>
) {
  return (
    <details className="tw-group" open>
      <summary className={HISTORY_DISCLOSURE_SUMMARY_CLASS}>
        <b>Top Up History</b>
        <span aria-hidden="true" className={HISTORY_DISCLOSURE_CARET_CLASS} />
      </summary>
      <div className={HISTORY_DISCLOSURE_BODY_CLASS}>
        <div className="tw-flex tw-flex-col tw-gap-2">
          {props.history.data.length > 0 ? (
            props.history.data.map((topUp) => (
              <TopUpEntry key={topUp.hash} topUp={topUp} />
            ))
          ) : (
            <div className="font-color-silver">No Top Ups found</div>
          )}
        </div>
        {props.history.count > 0 && props.history.count / 10 > 1 && (
          <div className="tw-mt-3 tw-text-center">
            <Pagination
              page={props.history.page}
              pageSize={10}
              totalResults={props.history.count}
              setPage={props.setPage}
            />
          </div>
        )}
      </div>
    </details>
  );
}

function TopUpEntry(
  props: Readonly<{
    topUp: SubscriptionTopUp;
  }>
) {
  return (
    <div className={styles["subscriptionHistoryEntry"]}>
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="tw-flex tw-items-center tw-gap-1 tw-whitespace-nowrap">
            <b>+ {props.topUp.amount}</b>
            <div className="tw-flex tw-h-5 tw-w-5 tw-flex-shrink-0 tw-items-center tw-justify-center">
              <EthereumIcon />
            </div>
          </div>
          <span>from: {props.topUp.from_wallet}</span>
        </div>
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="font-color-silver tw-whitespace-nowrap">
            {getDateDisplay(new Date(props.topUp.transaction_date))}
          </div>
          <div className="tw-flex tw-h-5 tw-w-5 tw-flex-shrink-0 tw-items-center tw-justify-center">
            <a
              className="tw-flex tw-items-center"
              target="_blank"
              rel="noopener noreferrer"
              href={getTransactionLink(mainnet.id, props.topUp.hash)}
              aria-label="View transaction on Etherscan"
            >
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
    <div className={styles["subscriptionHistoryEntry"]}>
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
        <div className="tw-flex tw-flex-col tw-gap-1">
          <div>{props.log.log}</div>
          {props.log.additional_info && (
            <div className="font-smaller font-color-silver">
              {props.log.additional_info}
            </div>
          )}
        </div>
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="font-color-silver tw-whitespace-nowrap">
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
    <div className={styles["subscriptionHistoryEntry"]}>
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
        <div className="tw-flex tw-flex-col tw-gap-1">
          <div>
            Redeemed Subscription for {contractName} #{props.redeem.token_id} x
            {props.redeem.count}
          </div>
          <div className="font-smaller font-color-silver">
            Airdrop Address: {formatAddress(props.redeem.address)} - Balance
            after redemption: {props.redeem.balance_after} ETH
          </div>
        </div>
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="font-color-silver tw-whitespace-nowrap">
            {(props.redeem.transaction_date ?? props.redeem.created_at) &&
              getDateDisplay(
                new Date(
                  (props.redeem.transaction_date ??
                    props.redeem.created_at) as Date
                )
              )}
          </div>
          <div className="tw-flex tw-h-5 tw-w-5 tw-flex-shrink-0 tw-items-center tw-justify-center">
            <a
              className="tw-flex tw-items-center"
              target="_blank"
              rel="noopener noreferrer"
              href={getTransactionLink(mainnet.id, props.redeem.transaction)}
              aria-label="View transaction on Etherscan"
            >
              <EtherscanIcon />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
