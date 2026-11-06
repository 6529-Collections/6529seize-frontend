import Pagination from "@/components/pagination/Pagination";
import { getButtonClasses } from "@/components/utils/button/buttonStyles";
import BodyPortalTooltip from "@/components/utils/tooltip/BodyPortalTooltip";
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
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t, tRich } from "@/i18n/messages";
import { mainnet } from "wagmi/chains";
import EthereumIcon from "../utils/icons/EthereumIcon";
import EtherscanIcon from "../utils/icons/EtherscanIcon";

const HISTORY_PAGE_SIZE = 10;
const HISTORY_ENTRY_CLASS =
  "tw-min-w-0 tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.06] tw-px-4 tw-py-3 tw-transition-colors last:tw-border-b-0 desktop-hover:hover:tw-bg-white/[0.02] motion-reduce:tw-transition-none md:tw-px-5 md:tw-py-5";

function getSubscriptionLogKey(log: SubscriptionLog, index: number): string {
  return log.id === undefined
    ? `subscription-log-${index}`
    : `subscription-log-${String(log.id)}`;
}

export default function UserPageSubscriptionsHistory(
  props: Readonly<{
    selectedIndex: number;
    onSelectionChange: (index: number) => void;
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
  const historyTopRef = useRef<HTMLDivElement>(null);
  const activePanelRef = useRef<HTMLDivElement>(null);
  const pendingPageScroll = useRef<{ tabId: string; page: number } | null>(
    null
  );
  const tabs = [
    {
      id: "redeemed",
      label: t(locale, "subscriptions.history.redeemed"),
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
  const activeTabId = tabs[props.selectedIndex]?.id;
  const activePage = tabs[props.selectedIndex]?.page;
  const activeLoading = tabs[props.selectedIndex]?.loading;

  useEffect(() => {
    const pending = pendingPageScroll.current;
    if (!pending) return;
    if (pending.tabId !== activeTabId) {
      pendingPageScroll.current = null;
      return;
    }
    if (activeLoading || activePage !== pending.page) return;

    pendingPageScroll.current = null;
    // New rows must be committed before scrolling; the loading panel is shorter.
    const top =
      historyTopRef.current?.closest("section") ?? historyTopRef.current;
    activePanelRef.current?.focus({ preventScroll: true });
    top?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [activeTabId, activePage, activeLoading]);

  return (
    <TabGroup
      ref={historyTopRef}
      className="tw-scroll-mt-24"
      selectedIndex={props.selectedIndex}
      onChange={props.onSelectionChange}
    >
      <TabList
        aria-label={t(locale, "subscriptions.history.title")}
        className="tw-no-scrollbar -tw-mx-1 tw-mb-4 tw-flex tw-flex-nowrap tw-gap-2 tw-overflow-x-auto tw-overscroll-x-contain tw-p-1"
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            onFocus={(event) =>
              event.currentTarget.scrollIntoView({
                block: "nearest",
                inline: "nearest",
              })
            }
            className={({ selected }) =>
              getButtonClasses({
                variant: selected ? "filterSelected" : "filter",
                size: null,
                className: `tw-h-8 !tw-rounded-full tw-px-3 tw-text-sm motion-reduce:tw-transition-none ${selected ? "" : "!tw-border-iron-800 !tw-bg-transparent !tw-font-normal desktop-hover:hover:!tw-bg-white/[0.04]"}`,
              })
            }
          >
            {tab.label ?? tab.heading}
          </Tab>
        ))}
      </TabList>
      <TabPanels>
        {tabs.map((tab) => (
          <TabPanel
            key={tab.id}
            ref={tab.id === activeTabId ? activePanelRef : null}
            aria-busy={tab.loading === true}
            className="focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            <h3 className="tw-sr-only">{tab.heading}</h3>
            {tab.loading ? (
              <HistoryLoadingState title={tab.heading} />
            ) : (
              <>
                {tab.rows.length ? (
                  <div className="tw-flex tw-flex-col tw-overflow-hidden tw-rounded-xl tw-bg-iron-950">
                    {tab.rows}
                  </div>
                ) : (
                  <HistoryEmptyState>{tab.empty}</HistoryEmptyState>
                )}
                <HistoryPagination
                  page={tab.page}
                  count={tab.count}
                  setPage={(page) => {
                    pendingPageScroll.current =
                      page === tab.page ? null : { tabId: tab.id, page };
                    tab.setPage(page);
                  }}
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
    <div className="tw-mt-4 tw-flex tw-justify-center max-md:[&_button]:tw-min-h-10 max-md:[&_button]:tw-min-w-10 max-md:[&_input]:tw-h-10 max-md:[&_input]:tw-w-10">
      <Pagination
        page={page}
        pageSize={HISTORY_PAGE_SIZE}
        totalResults={count}
        setPage={setPage}
        variant="compact"
      />
    </div>
  );
}

function TopUpEntry(
  props: Readonly<{
    topUp: SubscriptionTopUp;
  }>
) {
  const locale = useBrowserLocale();
  return (
    <div className={HISTORY_ENTRY_CLASS}>
      <div className="tw-grid tw-min-w-0 tw-grid-cols-[minmax(0,1fr)_auto] tw-items-center tw-gap-x-3 tw-gap-y-1 md:tw-grid-cols-[minmax(0,1fr)_auto_auto] md:tw-gap-x-4">
        <span className="tw-col-start-1 tw-row-start-1 tw-flex tw-items-center tw-gap-1.5 tw-whitespace-nowrap tw-text-sm tw-text-emerald-300 md:tw-text-[15px]">
          <b className="tw-font-semibold tw-tabular-nums">
            + {props.topUp.amount}
          </b>
          <span className="tw-flex tw-h-4 tw-w-2.5 tw-shrink-0 tw-items-center tw-justify-center tw-text-iron-500">
            <EthereumIcon />
          </span>
        </span>
        <p className="tw-col-start-1 tw-row-start-2 tw-m-0 tw-min-w-0 tw-text-[12.5px] tw-font-normal tw-tabular-nums tw-leading-5 tw-text-iron-400 [overflow-wrap:anywhere] md:tw-text-sm">
          {tRich(locale, "subscriptions.history.fromWallet", {
            address: (
              <span key="sender" className="tw-font-medium tw-text-iron-200">
                {props.topUp.from_wallet}
              </span>
            ),
          })}
        </p>
        <span className="tw-col-start-2 tw-row-start-2 tw-whitespace-nowrap tw-text-xs tw-font-normal tw-tabular-nums tw-text-iron-500 md:tw-row-span-2 md:tw-row-start-1 md:tw-text-sm">
          {getDateDisplay(new Date(props.topUp.transaction_date))}
        </span>
        <div className="tw-col-start-2 tw-row-start-1 tw-justify-self-end md:tw-col-start-3 md:tw-row-span-2">
          <HistoryTransactionLink transaction={props.topUp.hash} />
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
      <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-2.5 md:tw-flex-row md:tw-items-center md:tw-justify-between md:tw-gap-4">
        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-flex tw-min-w-0 tw-items-start tw-gap-2.5">
            <span
              aria-hidden="true"
              className="tw-mt-2 tw-size-1.5 tw-shrink-0 tw-rounded-full tw-bg-iron-500"
            />
            <p className="tw-m-0 tw-min-w-0 tw-text-sm tw-font-semibold tw-tabular-nums tw-leading-6 tw-text-iron-100 [overflow-wrap:anywhere] md:tw-text-[15px]">
              {props.log.log}
            </p>
          </div>
          {props.log.additional_info && (
            <div className="tw-mt-1.5 tw-text-pretty tw-pl-4 tw-text-[12.5px] tw-font-normal tw-tabular-nums tw-leading-5 tw-text-iron-400 [overflow-wrap:anywhere] md:tw-text-sm">
              <LogDetailsText text={props.log.additional_info} />
            </div>
          )}
        </div>
        {props.log.created_at && (
          <span className="tw-whitespace-nowrap tw-pl-4 tw-text-xs tw-font-normal tw-tabular-nums tw-text-iron-500 md:tw-shrink-0 md:tw-pl-0 md:tw-text-sm">
            {getDateDisplay(new Date(props.log.created_at))}
          </span>
        )}
      </div>
    </div>
  );
}

function LogDetailsText({ text }: Readonly<{ text: string }>) {
  // Preserve every original separator and value while applying text emphasis.
  return text.split(/( - )/u).flatMap<ReactNode>((part, position) => {
    const separator = part.indexOf(": ");
    if (separator < 0) {
      return part;
    }
    const valueStart = separator + 2;
    return [
      part.slice(0, valueStart),
      <span
        key={`${position}:${part}`}
        className="tw-font-medium tw-text-iron-200"
      >
        {part.slice(valueStart)}
      </span>,
    ];
  });
}

function RedeemedEntry(
  props: Readonly<{
    redeem: RedeemedSubscription;
  }>
) {
  const locale = useBrowserLocale();
  const contractName = areEqualAddresses(props.redeem.contract, MEMES_CONTRACT)
    ? t(locale, "subscriptions.history.meme")
    : t(locale, "subscriptions.history.contract", {
        address: formatAddress(props.redeem.contract),
      });
  const transactionDate =
    props.redeem.transaction_date ?? props.redeem.created_at;

  return (
    <div className={HISTORY_ENTRY_CLASS}>
      <div className="tw-grid tw-min-w-0 tw-grid-cols-[minmax(0,1fr)_auto] tw-items-center tw-gap-x-3 tw-gap-y-1 md:tw-grid-cols-[minmax(0,1fr)_auto_auto] md:tw-gap-x-4">
        <p className="tw-col-start-1 tw-row-start-1 tw-m-0 tw-min-w-0 tw-text-pretty tw-break-words tw-text-sm tw-font-semibold tw-tabular-nums tw-leading-6 tw-text-iron-100 md:tw-text-[15px]">
          {tRich(locale, "subscriptions.history.redeemedEntryTitle", {
            contract: contractName,
            token: formatInteger(locale, props.redeem.token_id),
            count: (
              <span
                key="quantity"
                className="tw-ml-1 tw-inline-flex tw-whitespace-nowrap tw-rounded-md tw-bg-primary-300/[0.08] tw-px-2 tw-py-0.5 tw-align-middle tw-text-xs tw-font-medium tw-leading-5 tw-text-primary-300 tw-ring-1 tw-ring-inset tw-ring-primary-300/20"
              >
                {t(locale, "subscriptions.history.quantity", {
                  count: formatInteger(locale, props.redeem.count),
                })}
              </span>
            ),
          })}
        </p>
        <div className="tw-contents md:tw-col-start-1 md:tw-row-start-2 md:tw-flex md:tw-min-w-0 md:tw-flex-wrap md:tw-items-baseline md:tw-gap-x-2">
          <p className="tw-col-start-1 tw-row-start-2 tw-m-0 tw-min-w-0 tw-text-[12.5px] tw-font-normal tw-tabular-nums tw-leading-5 tw-text-iron-400 md:tw-text-sm">
            {tRich(locale, "subscriptions.history.redeemedAddress", {
              address: (
                <span key="address" className="tw-font-medium tw-text-iron-200">
                  {formatAddress(props.redeem.address)}
                </span>
              ),
            })}
          </p>
          <span
            aria-hidden="true"
            className="tw-hidden tw-text-iron-600 md:tw-inline"
          >
            {" "}
            -{" "}
          </span>
          <p className="tw-col-span-full tw-row-start-3 tw-m-0 tw-min-w-0 tw-text-pretty tw-text-[12.5px] tw-font-normal tw-tabular-nums tw-leading-5 tw-text-iron-400 md:tw-text-sm">
            {tRich(locale, "subscriptions.history.redeemedBalance", {
              balance: (
                <span
                  key="balance"
                  className="tw-whitespace-nowrap tw-font-medium tw-text-iron-100"
                >
                  {props.redeem.balance_after} ETH
                </span>
              ),
            })}
          </p>
        </div>
        {transactionDate && (
          <span className="tw-col-start-2 tw-row-start-2 tw-whitespace-nowrap tw-text-xs tw-font-normal tw-tabular-nums tw-text-iron-500 md:tw-row-span-2 md:tw-row-start-1 md:tw-text-sm">
            {getDateDisplay(new Date(transactionDate))}
          </span>
        )}
        <div className="tw-col-start-2 tw-row-start-1 tw-justify-self-end md:tw-col-start-3 md:tw-row-span-2">
          <HistoryTransactionLink transaction={props.redeem.transaction} />
        </div>
      </div>
    </div>
  );
}

function HistoryTransactionLink({
  transaction,
}: Readonly<{ transaction: string }>) {
  const locale = useBrowserLocale();
  const tooltipId = useId();
  const label = t(locale, "subscriptions.history.viewTransaction");
  return (
    <>
      <a
        className="tw-group tw-inline-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        target="_blank"
        rel="noopener noreferrer"
        href={getTransactionLink(mainnet.id, transaction)}
        aria-label={label}
        aria-describedby={tooltipId}
        data-tooltip-id={tooltipId}
      >
        <span
          aria-hidden="true"
          className="tw-inline-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-900 tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-white/[0.08] tw-transition-colors desktop-hover:group-hover:tw-bg-iron-800 desktop-hover:group-hover:tw-text-iron-100 motion-reduce:tw-transition-none"
        >
          <span className="tw-size-4">
            <EtherscanIcon />
          </span>
        </span>
      </a>
      <BodyPortalTooltip
        id={tooltipId}
        place="top"
        offset={8}
        delayShow={250}
        opacity={1}
        openEvents={{ mouseover: true, focus: true }}
        style={TOOLTIP_STYLES}
      >
        {label}
      </BodyPortalTooltip>
    </>
  );
}
