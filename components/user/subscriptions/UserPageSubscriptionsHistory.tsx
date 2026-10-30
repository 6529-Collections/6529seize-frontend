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
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import type { ReactNode } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { mainnet } from "wagmi/chains";
import EthereumIcon from "../utils/icons/EthereumIcon";
import EtherscanIcon from "../utils/icons/EtherscanIcon";

const HISTORY_PAGE_SIZE = 10;
const HISTORY_ENTRY_CLASS =
  "tw-min-w-0 tw-rounded-xl tw-px-4 tw-py-3.5 tw-transition-colors tw-duration-300 desktop-hover:hover:tw-bg-iron-900/40";

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
  const locale = useBrowserLocale();
  const tabs = [
    {
      id: "redeemed",
      title: t(locale, "subscriptions.history.redeemed"),
      heading: t(locale, "subscriptions.history.redeemedTitle"),
      loading: props.redeemedLoading,
      empty: t(locale, "subscriptions.history.emptyRedeemed"),
      page: props.redeemed.page,
      count: props.redeemed.count,
      setPage: props.setRedeemedPage,
      rows: props.redeemed.data.map((redeem) => (
        <RedeemedEntry key={redeem.transaction} redeem={redeem} />
      )),
    },
    {
      id: "logs",
      title: t(locale, "subscriptions.history.logs"),
      heading: t(locale, "subscriptions.history.logsTitle"),
      loading: props.logsLoading,
      empty: t(locale, "subscriptions.history.emptyLogs"),
      page: props.logs.page,
      count: props.logs.count,
      setPage: props.setLogsPage,
      rows: props.logs.data.map((log, index) => (
        <LogEntry key={getSubscriptionLogKey(log, index)} log={log} />
      )),
    },
    {
      id: "topups",
      title: t(locale, "subscriptions.history.topups"),
      heading: t(locale, "subscriptions.history.topupsTitle"),
      loading: props.topUpsLoading,
      empty: t(locale, "subscriptions.history.emptyTopups"),
      page: props.topups.page,
      count: props.topups.count,
      setPage: props.setTopUpPage,
      rows: props.topups.data.map((topUp) => (
        <TopUpEntry key={topUp.hash} topUp={topUp} />
      )),
    },
  ];
  return (
    <TabGroup>
      <TabList
        aria-label={t(locale, "subscriptions.history.title")}
        className="tw-mb-3 tw-flex tw-gap-1 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-bg-iron-900 tw-p-1 md:tw-w-fit"
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            className="tw-min-h-11 tw-flex-1 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-400 data-[selected]:tw-bg-iron-700 data-[selected]:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            {tab.title}
          </Tab>
        ))}
      </TabList>
      <TabPanels>
        {tabs.map((tab) => (
          <TabPanel
            key={tab.id}
            aria-busy={tab.loading === true}
            className="focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            <h3 className="tw-mb-2 tw-mt-4 tw-text-sm tw-font-medium tw-text-iron-300">
              {tab.heading}
            </h3>
            {tab.loading ? (
              <HistoryLoadingState title={tab.heading} />
            ) : (
              <>
                {tab.rows.length ? (
                  <div className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/[0.06]">
                    {tab.rows}
                  </div>
                ) : (
                  <HistoryEmptyState>{tab.empty}</HistoryEmptyState>
                )}
                <HistoryPagination
                  page={tab.page}
                  count={tab.count}
                  setPage={tab.setPage}
                />
              </>
            )}
          </TabPanel>
        ))}
      </TabPanels>
    </TabGroup>
  );
}

function HistoryLoadingState({ title }: Readonly<{ title: string }>) {
  const locale = useBrowserLocale();
  return (
    <div className="tw-flex tw-min-h-[68px] tw-animate-pulse tw-items-center tw-rounded-xl tw-bg-iron-950/50 tw-p-6 tw-ring-1 tw-ring-white/[0.02]">
      <output className="tw-sr-only">
        {t(locale, "subscriptions.history.loading", { title })}
      </output>
      <div
        aria-hidden="true"
        className="tw-h-3 tw-w-2/5 tw-rounded-full tw-bg-iron-800"
      />
    </div>
  );
}

function HistoryEmptyState({ children }: { readonly children: ReactNode }) {
  return (
    <div className="tw-flex tw-min-h-[68px] tw-items-center tw-justify-center tw-rounded-xl tw-bg-iron-950/50 tw-p-6 tw-text-center tw-ring-1 tw-ring-white/[0.02]">
      <span className="tw-text-meta tw-font-normal tw-text-iron-500">
        {children}
      </span>
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
      <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
        <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-1 sm:tw-flex-row sm:tw-items-center sm:tw-gap-3">
          <span className="tw-flex tw-items-center tw-gap-1 tw-whitespace-nowrap tw-text-sm tw-text-iron-100">
            <b className="tw-font-semibold tw-tabular-nums">
              + {props.topUp.amount}
            </b>
            <span className="tw-flex tw-h-4 tw-w-2.5 tw-flex-shrink-0 tw-items-center tw-justify-center tw-text-iron-500">
              <EthereumIcon />
            </span>
          </span>
          <span className="tw-break-all tw-text-meta tw-font-normal tw-tabular-nums tw-text-iron-500">
            from: {props.topUp.from_wallet}
          </span>
        </div>
        <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-3">
          <span className="tw-whitespace-nowrap tw-text-meta tw-font-normal tw-tabular-nums tw-text-iron-500">
            {getDateDisplay(new Date(props.topUp.transaction_date))}
          </span>
          <a
            className="tw-inline-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-lg tw-text-iron-300 tw-transition-colors focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-100"
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
      <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
        <div className="tw-min-w-0 tw-space-y-1">
          <div className="tw-break-words tw-text-[15px] tw-font-normal tw-tabular-nums tw-text-iron-300">
            {props.log.log}
          </div>
          {props.log.additional_info && (
            <div className="tw-break-words tw-text-meta tw-font-normal tw-tabular-nums tw-text-iron-500 max-sm:tw-break-all">
              {props.log.additional_info}
            </div>
          )}
        </div>
        {props.log.created_at && (
          <span className="tw-flex-shrink-0 tw-whitespace-nowrap tw-text-meta tw-font-normal tw-tabular-nums tw-text-iron-500">
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
      <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
        <div className="tw-min-w-0 tw-space-y-1">
          <div className="tw-break-words tw-text-[15px] tw-font-normal tw-tabular-nums tw-text-iron-300">
            Redeemed Subscription for {contractName} #{props.redeem.token_id} x
            {props.redeem.count}
          </div>
          <div className="tw-break-words tw-text-meta tw-font-normal tw-tabular-nums tw-text-iron-500">
            Airdrop Address: {props.redeem.address} - Balance after redemption:{" "}
            {props.redeem.balance_after} ETH
          </div>
        </div>
        <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-3">
          {transactionDate && (
            <span className="tw-whitespace-nowrap tw-text-meta tw-font-normal tw-tabular-nums tw-text-iron-500">
              {getDateDisplay(new Date(transactionDate))}
            </span>
          )}
          <a
            className="tw-inline-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-lg tw-text-iron-300 tw-transition-colors focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-100"
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
