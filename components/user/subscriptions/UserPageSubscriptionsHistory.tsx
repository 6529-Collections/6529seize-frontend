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
import { ArchiveBoxIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { mainnet } from "wagmi/chains";
import EthereumIcon from "../utils/icons/EthereumIcon";
import EtherscanIcon from "../utils/icons/EtherscanIcon";
import UserPageSubscriptionsSection from "./UserPageSubscriptionsSection";

const HISTORY_PAGE_SIZE = 10;
const HISTORY_ENTRY_CLASS =
  "tw-min-w-0 tw-rounded-lg tw-bg-iron-900/50 tw-p-4 tw-transition-colors desktop-hover:hover:tw-bg-iron-900/70";

function getSubscriptionLogKey(log: SubscriptionLog, index: number): string {
  return log.id === undefined
    ? `subscription-log-${index}`
    : `subscription-log-${String(log.id)}`;
}

export default function UserPageSubscriptionsHistory(
  props: Readonly<{
    topups: Page<SubscriptionTopUp>;
    redeemed: Page<RedeemedSubscription>;
    logs: Page<SubscriptionLog>;
    topUpsLoading?: boolean | undefined;
    redeemedLoading?: boolean | undefined;
    logsLoading?: boolean | undefined;
    setRedeemedPage: (page: number) => void;
    setTopUpPage: (page: number) => void;
    setLogsPage: (page: number) => void;
  }>
) {
  return (
    <UserPageSubscriptionsSection
      id="profile-subscriptions-history"
      title="Subscription History"
    >
      <div className="tw-divide-y tw-divide-solid tw-divide-white/[0.07] tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950 tw-px-4 tw-shadow-[0_14px_36px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.025)] sm:tw-px-5">
        <HistoryDisclosure
          title="Redeemed Subscriptions"
          loading={props.redeemedLoading === true}
          isEmpty={props.redeemed.data.length === 0}
          emptyMessage="No Redeemed Subscriptions found"
          pagination={
            <HistoryPagination
              count={props.redeemed.count}
              page={props.redeemed.page}
              setPage={props.setRedeemedPage}
            />
          }
        >
          {props.redeemed.data.map((redeem) => (
            <RedeemedEntry key={redeem.transaction} redeem={redeem} />
          ))}
        </HistoryDisclosure>

        <HistoryDisclosure
          title="Log History"
          loading={props.logsLoading === true}
          isEmpty={props.logs.data.length === 0}
          emptyMessage="No logs found"
          pagination={
            <HistoryPagination
              count={props.logs.count}
              page={props.logs.page}
              setPage={props.setLogsPage}
            />
          }
        >
          {props.logs.data.map((log, index) => (
            <LogEntry key={getSubscriptionLogKey(log, index)} log={log} />
          ))}
        </HistoryDisclosure>

        <HistoryDisclosure
          title="Top Up History"
          loading={props.topUpsLoading === true}
          isEmpty={props.topups.data.length === 0}
          emptyMessage="No Top Ups found"
          pagination={
            <HistoryPagination
              count={props.topups.count}
              page={props.topups.page}
              setPage={props.setTopUpPage}
            />
          }
        >
          {props.topups.data.map((topUp) => (
            <TopUpEntry key={topUp.hash} topUp={topUp} />
          ))}
        </HistoryDisclosure>
      </div>
    </UserPageSubscriptionsSection>
  );
}

function HistoryDisclosure({
  title,
  loading,
  isEmpty,
  emptyMessage,
  pagination,
  children,
}: Readonly<{
  title: string;
  loading: boolean;
  isEmpty: boolean;
  emptyMessage: string;
  pagination: ReactNode;
  children: ReactNode;
}>) {
  let content: ReactNode = <div className="tw-space-y-2">{children}</div>;
  if (loading) {
    content = <HistoryLoadingState title={title} />;
  } else if (isEmpty) {
    content = <HistoryEmptyState>{emptyMessage}</HistoryEmptyState>;
  }

  return (
    <details className="tw-group" aria-busy={loading} open>
      <summary className="tw-flex tw-min-h-14 tw-w-full tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-3 tw-py-3 tw-text-left tw-text-sm tw-font-semibold tw-text-iron-100 tw-transition-colors focus:tw-outline-none focus-visible:tw-rounded-md focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-white [&::-webkit-details-marker]:tw-hidden">
        {title}
        <ChevronDownIcon
          className="tw-size-4 tw-flex-shrink-0 tw-text-iron-400 tw-transition-transform tw-duration-200 group-open:tw-rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="tw-pb-4">
        {content}
        {!loading && pagination}
      </div>
    </details>
  );
}

function HistoryLoadingState({ title }: Readonly<{ title: string }>) {
  return (
    <div className="tw-flex tw-min-h-20 tw-animate-pulse tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/40 tw-p-4">
      <output className="tw-sr-only">Loading {title}</output>
      <div
        aria-hidden="true"
        className="tw-h-3 tw-w-2/5 tw-rounded-full tw-bg-iron-800"
      />
    </div>
  );
}

function HistoryEmptyState({ children }: { readonly children: ReactNode }) {
  return (
    <div className="tw-flex tw-min-h-20 tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-dashed tw-border-iron-800 tw-bg-iron-900/30 tw-p-4 tw-text-center">
      <ArchiveBoxIcon
        className="tw-size-5 tw-text-iron-500"
        aria-hidden="true"
      />
      <span className="tw-text-sm tw-text-iron-400">{children}</span>
    </div>
  );
}

function HistoryPagination({
  count,
  page,
  setPage,
}: Readonly<{
  count: number;
  page: number;
  setPage: (page: number) => void;
}>) {
  if (count <= HISTORY_PAGE_SIZE) {
    return null;
  }

  return (
    <div className="tw-mt-4 tw-text-center">
      <Pagination
        page={page}
        pageSize={HISTORY_PAGE_SIZE}
        totalResults={count}
        setPage={setPage}
      />
    </div>
  );
}

function TopUpEntry(
  props: Readonly<{
    topUp: SubscriptionTopUp;
  }>
) {
  return (
    <div className={HISTORY_ENTRY_CLASS}>
      <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
        <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-1 sm:tw-flex-row sm:tw-items-center sm:tw-gap-3">
          <span className="tw-flex tw-items-center tw-gap-1 tw-whitespace-nowrap">
            <b>+ {props.topUp.amount}</b>
            <span className="tw-flex tw-size-5 tw-flex-shrink-0 tw-items-center tw-justify-center">
              <EthereumIcon />
            </span>
          </span>
          <span className="tw-break-all tw-text-sm tw-text-iron-300">
            from: {props.topUp.from_wallet}
          </span>
        </div>
        <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-3">
          <span className="tw-text-sm tw-text-iron-400">
            {getDateDisplay(new Date(props.topUp.transaction_date))}
          </span>
          <a
            className="tw-inline-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-lg tw-text-iron-300 tw-transition-colors focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-100"
            target="_blank"
            rel="noopener noreferrer"
            href={getTransactionLink(mainnet.id, props.topUp.hash)}
            aria-label="View transaction on Etherscan"
          >
            <span className="tw-size-5">
              <EtherscanIcon />
            </span>
          </a>
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
    <div className={HISTORY_ENTRY_CLASS}>
      <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-start sm:tw-justify-between">
        <div className="tw-min-w-0 tw-space-y-1">
          <div className="tw-break-words tw-text-iron-200">{props.log.log}</div>
          {props.log.additional_info && (
            <div className="tw-break-words tw-text-sm tw-text-iron-400">
              {props.log.additional_info}
            </div>
          )}
        </div>
        {props.log.created_at && (
          <span className="tw-flex-shrink-0 tw-text-sm tw-text-iron-400">
            {getDateDisplay(new Date(props.log.created_at))}
          </span>
        )}
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
  const transactionDate =
    props.redeem.transaction_date ?? props.redeem.created_at;

  return (
    <div className={HISTORY_ENTRY_CLASS}>
      <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-start sm:tw-justify-between">
        <div className="tw-min-w-0 tw-space-y-1">
          <div className="tw-break-words tw-text-iron-200">
            Redeemed Subscription for {contractName} #{props.redeem.token_id} x
            {props.redeem.count}
          </div>
          <div className="tw-break-words tw-text-sm tw-text-iron-400">
            Airdrop Address: {formatAddress(props.redeem.address)} - Balance
            after redemption: {props.redeem.balance_after} ETH
          </div>
        </div>
        <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-3">
          {transactionDate && (
            <span className="tw-text-sm tw-text-iron-400">
              {getDateDisplay(new Date(transactionDate))}
            </span>
          )}
          <a
            className="tw-inline-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-lg tw-text-iron-300 tw-transition-colors focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-100"
            target="_blank"
            rel="noopener noreferrer"
            href={getTransactionLink(mainnet.id, props.redeem.transaction)}
            aria-label="View transaction on Etherscan"
          >
            <span className="tw-size-5">
              <EtherscanIcon />
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
