import Address from "@/components/address/Address";
import { NEVER_DATE } from "@/constants/constants";
import type { Delegation } from "@/entities/IDelegation";
import { areEqualAddresses } from "@/helpers/Helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  faArrowRight,
  faCheck,
  faPlusCircle,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Fragment } from "react";
import { ALL_USE_CASES, SUPPORTED_COLLECTIONS } from "../delegation-constants";

const TABLE_CLASS =
  "tw-w-full tw-min-w-[720px] tw-border-separate tw-border-spacing-y-1 tw-text-sm [&_tbody_tr]:tw-bg-iron-950";
const TABLE_HEADER_CELL_CLASS =
  "tw-px-4 tw-py-2 tw-text-left tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400";
const TABLE_CELL_CLASS =
  "tw-px-4 tw-py-3 tw-align-middle tw-text-iron-100 first:tw-rounded-l-lg last:tw-rounded-r-lg";
const TABLE_CENTER_CELL_CLASS = `${TABLE_CELL_CLASS} tw-text-center`;

export interface ConsolidationDisplay {
  from: string;
  from_display: string | undefined;
  to: string;
  to_display: string | undefined;
}

export interface ConsolidatedWallet {
  address: string;
  display: string | undefined;
}

function getUseCaseDisplay(useCase: number) {
  const resolved = ALL_USE_CASES.find((u) => u.use_case === useCase);
  return resolved ? `#${useCase} - ${resolved.display}` : `#${useCase}`;
}

function getCollectionDisplay(collection: string) {
  const resolved = SUPPORTED_COLLECTIONS.find((sc) =>
    areEqualAddresses(sc.contract, collection)
  );
  return resolved ? resolved.title : collection;
}

function getDelegationKey(scope: string, delegation: Delegation) {
  return [
    scope,
    delegation.block,
    delegation.from_address.toLowerCase(),
    delegation.to_address.toLowerCase(),
    delegation.collection.toLowerCase(),
    delegation.use_case,
    delegation.expiry,
    delegation.token_id,
    delegation.all_tokens,
  ].join("-");
}

function getConsolidationKey(
  scope: string,
  consolidation: ConsolidationDisplay
) {
  return [
    scope,
    consolidation.from.toLowerCase(),
    consolidation.to.toLowerCase(),
  ].join("-");
}

function formatExpiry(myDate: number) {
  const date = new Date(myDate * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateDisplay(myDate: number, locale: SupportedLocale) {
  if (myDate === NEVER_DATE) {
    return t(locale, "delegation.collection.walletChecker.never");
  }
  return formatExpiry(myDate);
}

function CheckedWalletAddress(
  props: Readonly<{
    checkedAddress: string;
    address: string;
    display: string | undefined;
  }>
) {
  const address = (
    <Address
      wallets={[props.address as `0x${string}`]}
      display={props.display}
    />
  );

  if (areEqualAddresses(props.checkedAddress, props.address)) {
    return address;
  }

  return <span className="[&_a]:tw-font-semibold">{address}</span>;
}

const FROM_ADDRESS_TOKEN = "__FROM_ADDRESS__";
const TO_ADDRESS_TOKEN = "__TO_ADDRESS__";
const ADDRESS_TOKEN_PATTERN = /(__FROM_ADDRESS__|__TO_ADDRESS__)/;

function ConsolidationActionMessage(
  props: Readonly<{
    locale: SupportedLocale;
    fetchedAddress: string;
    consolidation: ConsolidationDisplay;
  }>
) {
  const parts = t(
    props.locale,
    "delegation.collection.walletChecker.registerConsolidation",
    {
      from: FROM_ADDRESS_TOKEN,
      to: TO_ADDRESS_TOKEN,
    }
  ).split(ADDRESS_TOKEN_PATTERN);

  return parts.map((part, index) => {
    if (part === FROM_ADDRESS_TOKEN) {
      return (
        <CheckedWalletAddress
          key={part}
          checkedAddress={props.fetchedAddress}
          address={props.consolidation.to}
          display={props.consolidation.to_display}
        />
      );
    }
    if (part === TO_ADDRESS_TOKEN) {
      return (
        <CheckedWalletAddress
          key={part}
          checkedAddress={props.fetchedAddress}
          address={props.consolidation.from}
          display={props.consolidation.from_display}
        />
      );
    }
    return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
  });
}

function DelegationAddressCells(
  props: Readonly<{ checkedAddress: string; delegation: Delegation }>
) {
  return (
    <>
      <td className={TABLE_CELL_CLASS}>
        <CheckedWalletAddress
          checkedAddress={props.checkedAddress}
          address={props.delegation.from_address}
          display={props.delegation.from_display}
        />
      </td>
      <td className={TABLE_CELL_CLASS}>
        <CheckedWalletAddress
          checkedAddress={props.checkedAddress}
          address={props.delegation.to_address}
          display={props.delegation.to_display}
        />
      </td>
      <td className={TABLE_CELL_CLASS}>
        {getCollectionDisplay(props.delegation.collection)}
      </td>
    </>
  );
}

function DelegationsResults(
  props: Readonly<{
    fetchedAddress: string;
    delegations: Delegation[];
    subDelegations: Delegation[];
    activeDelegation: Delegation | undefined;
    locale: SupportedLocale;
  }>
) {
  const { locale } = props;

  return (
    <>
      <section className="tw-mt-6 tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900 tw-p-5 sm:tw-p-6">
        <div className="tw-w-full">
          <h2 className="tw-mb-4 tw-mt-0 tw-text-xl tw-font-semibold tw-text-white">
            {t(
              locale,
              "delegation.collection.walletChecker.delegations.title",
              {
                count: formatInteger(locale, props.delegations.length),
              }
            )}
          </h2>
          {props.delegations.length > 0 ? (
            <div className="tw-overflow-x-auto">
              <table className={TABLE_CLASS}>
                <thead>
                  <tr>
                    <th className={TABLE_HEADER_CELL_CLASS}>
                      {t(
                        locale,
                        "delegation.collection.walletChecker.columns.from"
                      )}
                    </th>
                    <th className={TABLE_HEADER_CELL_CLASS}>
                      {t(
                        locale,
                        "delegation.collection.walletChecker.columns.to"
                      )}
                    </th>
                    <th className={TABLE_HEADER_CELL_CLASS}>
                      {t(
                        locale,
                        "delegation.collection.walletChecker.columns.collection"
                      )}
                    </th>
                    <th className={TABLE_HEADER_CELL_CLASS}>
                      {t(
                        locale,
                        "delegation.collection.walletChecker.columns.useCase"
                      )}
                    </th>
                    <th className={`${TABLE_HEADER_CELL_CLASS} tw-text-center`}>
                      {t(
                        locale,
                        "delegation.collection.walletChecker.columns.tokens"
                      )}
                    </th>
                    <th className={`${TABLE_HEADER_CELL_CLASS} tw-text-center`}>
                      {t(
                        locale,
                        "delegation.collection.walletChecker.columns.expiry"
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {props.delegations.map((delegation) => (
                    <tr key={getDelegationKey("delegation", delegation)}>
                      <DelegationAddressCells
                        checkedAddress={props.fetchedAddress}
                        delegation={delegation}
                      />
                      <td className={TABLE_CELL_CLASS}>
                        {getUseCaseDisplay(delegation.use_case)}
                      </td>
                      <td className={TABLE_CENTER_CELL_CLASS}>
                        {delegation.all_tokens
                          ? t(locale, "delegation.collection.walletChecker.all")
                          : delegation.token_id}
                      </td>
                      <td className={TABLE_CENTER_CELL_CLASS}>
                        {getDateDisplay(delegation.expiry, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
              {t(
                locale,
                "delegation.collection.walletChecker.delegations.empty"
              )}
            </p>
          )}
          {props.activeDelegation && (
            <div className="tw-mt-5 tw-rounded-lg tw-border tw-border-solid tw-border-success/25 tw-bg-success/5 tw-p-4 sm:tw-p-5">
              <h3 className="tw-mb-3 tw-mt-0 tw-text-base tw-font-semibold tw-text-success">
                {t(
                  locale,
                  "delegation.collection.walletChecker.activeDelegation"
                )}
              </h3>
              <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4">
                <span>
                  {t(locale, "delegation.collection.walletChecker.labels.to")}{" "}
                  <Address
                    wallets={[
                      props.activeDelegation.to_address as `0x${string}`,
                    ]}
                    display={props.activeDelegation.to_display}
                  />
                </span>
                <span>
                  {t(
                    locale,
                    "delegation.collection.walletChecker.labels.collection"
                  )}{" "}
                  <b>
                    {getCollectionDisplay(props.activeDelegation.collection)}
                  </b>
                </span>
                <span>
                  {t(
                    locale,
                    "delegation.collection.walletChecker.labels.useCase"
                  )}{" "}
                  <b>{getUseCaseDisplay(props.activeDelegation.use_case)}</b>
                </span>
                {Boolean(props.activeDelegation.expiry) && (
                  <span>
                    {t(
                      locale,
                      "delegation.collection.walletChecker.labels.expiry"
                    )}{" "}
                    <b>
                      {props.activeDelegation.expiry === NEVER_DATE
                        ? t(locale, "delegation.collection.walletChecker.never")
                        : formatExpiry(props.activeDelegation.expiry)}
                    </b>
                  </span>
                )}
                <FontAwesomeIcon
                  icon={faCheck}
                  className="tw-h-4 tw-w-4 tw-rounded-full tw-bg-success tw-p-2 tw-text-iron-950"
                />
              </div>
            </div>
          )}
        </div>
      </section>
      <section className="tw-mt-4 tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900 tw-p-5 sm:tw-p-6">
        <div className="tw-w-full">
          <h2 className="tw-mb-4 tw-mt-0 tw-text-xl tw-font-semibold tw-text-white">
            {t(locale, "delegation.collection.walletChecker.managers.title", {
              count: formatInteger(locale, props.subDelegations.length),
            })}
          </h2>
          {props.subDelegations.length > 0 ? (
            <div className="tw-overflow-x-auto">
              <table className={TABLE_CLASS}>
                <thead>
                  <tr>
                    <th className={TABLE_HEADER_CELL_CLASS}>
                      {t(
                        locale,
                        "delegation.collection.walletChecker.columns.from"
                      )}
                    </th>
                    <th className={TABLE_HEADER_CELL_CLASS}>
                      {t(
                        locale,
                        "delegation.collection.walletChecker.columns.to"
                      )}
                    </th>
                    <th className={TABLE_HEADER_CELL_CLASS}>
                      {t(
                        locale,
                        "delegation.collection.walletChecker.columns.collection"
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {props.subDelegations.map((delegation) => (
                    <tr key={getDelegationKey("sub-delegation", delegation)}>
                      <DelegationAddressCells
                        checkedAddress={props.fetchedAddress}
                        delegation={delegation}
                      />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
              {t(locale, "delegation.collection.walletChecker.managers.empty")}
            </p>
          )}
        </div>
      </section>
    </>
  );
}

function ConsolidationsResults(
  props: Readonly<{
    fetchedAddress: string;
    consolidations: ConsolidationDisplay[];
    consolidatedWallets: ConsolidatedWallet[];
    consolidationActions: ConsolidationDisplay[];
    locale: SupportedLocale;
  }>
) {
  const { locale } = props;

  return (
    <section className="tw-mt-4 tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900 tw-p-5 sm:tw-p-6">
      <div className="tw-w-full">
        <h2 className="tw-mb-4 tw-mt-0 tw-text-xl tw-font-semibold tw-text-white">
          {t(
            locale,
            "delegation.collection.walletChecker.consolidations.title",
            {
              count: formatInteger(locale, props.consolidations.length),
            }
          )}
        </h2>
        {props.consolidations.length > 0 ? (
          <div className="tw-overflow-x-auto">
            <table className="tw-w-full tw-min-w-[520px] tw-border-separate tw-border-spacing-y-1 tw-text-sm">
              <tbody>
                {props.consolidations.map((consolidation) => (
                  <tr
                    key={getConsolidationKey("consolidation", consolidation)}
                    className="tw-bg-iron-950"
                  >
                    <td className="tw-flex tw-items-center tw-gap-4 tw-rounded-lg tw-px-4 tw-py-3">
                      <CheckedWalletAddress
                        checkedAddress={props.fetchedAddress}
                        address={consolidation.from}
                        display={consolidation.from_display}
                      />
                      <FontAwesomeIcon
                        icon={faArrowRight}
                        className="tw-h-4 tw-w-4 tw-shrink-0 tw-text-iron-500"
                        aria-hidden="true"
                      />
                      <CheckedWalletAddress
                        checkedAddress={props.fetchedAddress}
                        address={consolidation.to}
                        display={consolidation.to_display}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
            {t(
              locale,
              "delegation.collection.walletChecker.consolidations.empty"
            )}
          </p>
        )}
        {props.consolidations.length > 1 &&
          props.consolidatedWallets.length > 1 && (
            <div className="tw-mt-5 tw-rounded-lg tw-border tw-border-solid tw-border-success/25 tw-bg-success/5 tw-p-4 sm:tw-p-5">
              <h3 className="tw-mb-3 tw-mt-0 tw-text-base tw-font-semibold tw-text-success">
                {t(
                  locale,
                  "delegation.collection.walletChecker.activeConsolidation"
                )}
              </h3>
              <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
                {props.consolidatedWallets.map((wallet, index) => (
                  <Fragment
                    key={`consolidated-wallet-${wallet.address.toLowerCase()}`}
                  >
                    <CheckedWalletAddress
                      checkedAddress={props.fetchedAddress}
                      address={wallet.address}
                      display={wallet.display}
                    />
                    {props.consolidatedWallets.length - 1 > index && (
                      <FontAwesomeIcon
                        icon={faPlusCircle}
                        className="tw-h-4 tw-w-4 tw-text-iron-500"
                      />
                    )}
                  </Fragment>
                ))}
                <FontAwesomeIcon
                  icon={faCheck}
                  className="tw-ml-2 tw-h-4 tw-w-4 tw-rounded-full tw-bg-success tw-p-2 tw-text-iron-950"
                />
              </div>
            </div>
          )}
        {props.consolidationActions.length > 0 && (
          <>
            <div className="tw-mt-5 tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-error/20 tw-bg-error/5 tw-p-4 tw-font-semibold tw-text-error">
              <FontAwesomeIcon icon={faXmark} className="tw-h-5 tw-w-5" />
              {t(
                locale,
                "delegation.collection.walletChecker.incompleteConsolidation"
              )}
            </div>
            <div className="tw-pt-4 tw-text-sm tw-text-iron-200">
              <span className="tw-font-semibold">
                {t(
                  locale,
                  "delegation.collection.walletChecker.recommendedActions"
                )}
              </span>
              <ul className="tw-mb-0 tw-mt-2 tw-space-y-2 tw-pl-5">
                {props.consolidationActions.map((consolidation) => (
                  <li
                    key={getConsolidationKey(
                      "consolidation-action",
                      consolidation
                    )}
                    className="tw-flex tw-items-center tw-gap-2"
                  >
                    &bull;&nbsp;
                    <ConsolidationActionMessage
                      locale={locale}
                      fetchedAddress={props.fetchedAddress}
                      consolidation={consolidation}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default function WalletCheckerResults(
  props: Readonly<{
    fetchedAddress: string;
    delegationsLoaded: boolean;
    delegations: Delegation[];
    subDelegations: Delegation[];
    activeDelegation: Delegation | undefined;
    consolidationsLoaded: boolean;
    consolidations: ConsolidationDisplay[];
    consolidatedWallets: ConsolidatedWallet[];
    consolidationActions: ConsolidationDisplay[];
  }>
) {
  const locale = useBrowserLocale();

  return (
    <>
      {props.delegationsLoaded && (
        <DelegationsResults
          fetchedAddress={props.fetchedAddress}
          delegations={props.delegations}
          subDelegations={props.subDelegations}
          activeDelegation={props.activeDelegation}
          locale={locale}
        />
      )}
      {props.consolidationsLoaded && (
        <ConsolidationsResults
          fetchedAddress={props.fetchedAddress}
          consolidations={props.consolidations}
          consolidatedWallets={props.consolidatedWallets}
          consolidationActions={props.consolidationActions}
          locale={locale}
        />
      )}
    </>
  );
}
