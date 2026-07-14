import Address from "@/components/address/Address";
import { NEVER_DATE } from "@/constants/constants";
import type { Delegation } from "@/entities/IDelegation";
import { areEqualAddresses } from "@/helpers/Helpers";
import {
  faCheck,
  faPlusCircle,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Fragment } from "react";
import { ALL_USE_CASES, SUPPORTED_COLLECTIONS } from "../delegation-constants";
import styles from "./WalletChecker.module.css";

const TABLE_CLASS =
  "tw-w-full tw-min-w-[720px] tw-border-separate tw-border-spacing-y-1";
const TABLE_HEADER_CELL_CLASS =
  "tw-px-2 tw-py-1 tw-text-left tw-font-bold tw-text-iron-200";
const TABLE_CELL_CLASS = "tw-px-2 tw-py-1 tw-align-middle";
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

function formatExpiry(myDate: number) {
  const date = new Date(myDate * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateDisplay(myDate: number) {
  if (myDate === NEVER_DATE) {
    return `Never`;
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

  return <span className={styles["supportingAddress"]}>{address}</span>;
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
  }>
) {
  return (
    <>
      <section className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-4">
        <div className="tw-w-full tw-px-3">
          <h5 className="tw-pb-2 tw-pt-2">
            Delegations ({props.delegations.length})
          </h5>
          {props.delegations.length > 0 ? (
            <div className="tw-overflow-x-auto">
              <table className={TABLE_CLASS}>
                <thead>
                  <tr>
                    <th className={TABLE_HEADER_CELL_CLASS}>From</th>
                    <th className={TABLE_HEADER_CELL_CLASS}>To</th>
                    <th className={TABLE_HEADER_CELL_CLASS}>Collection</th>
                    <th className={TABLE_HEADER_CELL_CLASS}>Use Case</th>
                    <th className={`${TABLE_HEADER_CELL_CLASS} tw-text-center`}>
                      Tokens
                    </th>
                    <th className={`${TABLE_HEADER_CELL_CLASS} tw-text-center`}>
                      Expiry
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {props.delegations.map((delegation, index) => (
                    <tr key={`delegations-${index}`}>
                      <DelegationAddressCells
                        checkedAddress={props.fetchedAddress}
                        delegation={delegation}
                      />
                      <td className={TABLE_CELL_CLASS}>
                        {getUseCaseDisplay(delegation.use_case)}
                      </td>
                      <td className={TABLE_CENTER_CELL_CLASS}>
                        {delegation.all_tokens ? `All` : delegation.token_id}
                      </td>
                      <td className={TABLE_CENTER_CELL_CLASS}>
                        {getDateDisplay(delegation.expiry)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            `No delegations found`
          )}
        </div>
      </section>
      {props.activeDelegation && (
        <div className="tw-pt-2">
          <h5 className="tw-pb-2 tw-pt-2">
            Active Minting Delegation for The Memes
          </h5>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4">
            <span>
              To:{" "}
              <Address
                wallets={[props.activeDelegation.to_address as `0x${string}`]}
                display={props.activeDelegation.to_display}
              />
            </span>
            <span>
              Collection:{" "}
              <b>{getCollectionDisplay(props.activeDelegation.collection)}</b>
            </span>
            <span>
              Use Case:{" "}
              <b>{getUseCaseDisplay(props.activeDelegation.use_case)}</b>
            </span>
            {props.activeDelegation.expiry && (
              <span>
                &nbsp;&nbsp;Expiry:{" "}
                <b>
                  {props.activeDelegation.expiry == NEVER_DATE
                    ? `Never`
                    : formatExpiry(props.activeDelegation.expiry)}
                </b>
              </span>
            )}
            <FontAwesomeIcon
              icon={faCheck}
              className={styles["activeDelegationIcon"]}
            />
          </div>
        </div>
      )}
      <section className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-4">
        <div className="tw-w-full tw-px-3">
          <h5 className="tw-pb-2 tw-pt-2">
            Delegation Managers ({props.subDelegations.length})
          </h5>
          {props.subDelegations.length > 0 ? (
            <div className="tw-overflow-x-auto">
              <table className={TABLE_CLASS}>
                <thead>
                  <tr>
                    <th className={TABLE_HEADER_CELL_CLASS}>From</th>
                    <th className={TABLE_HEADER_CELL_CLASS}>To</th>
                    <th className={TABLE_HEADER_CELL_CLASS}>Collection</th>
                  </tr>
                </thead>
                <tbody>
                  {props.subDelegations.map((delegation, index) => (
                    <tr key={`sub-delegations-${index}`}>
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
            `No delegation managers found`
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
  }>
) {
  return (
    <section className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-4">
      <div className="tw-w-full tw-px-3">
        <h5 className="tw-pb-2 tw-pt-2">
          Consolidations ({props.consolidations.length})
        </h5>
        {props.consolidations.length > 0 ? (
          <div className="tw-overflow-x-auto">
            <table className="tw-w-full tw-min-w-[520px] tw-border-separate tw-border-spacing-y-1">
              <tbody>
                {props.consolidations.map((consolidation, index) => (
                  <tr key={`consolidations-${index}`}>
                    <td className="tw-flex tw-items-center tw-px-2 tw-py-1">
                      <CheckedWalletAddress
                        checkedAddress={props.fetchedAddress}
                        address={consolidation.from}
                        display={consolidation.from_display}
                      />
                      <span className="tw-inline-flex tw-items-center tw-justify-center">
                        <span className={styles["arrowBody"]}></span>
                        <span className={styles["arrowHead"]}></span>
                      </span>
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
          `No consolidations found`
        )}
        {props.consolidations.length > 1 &&
          props.consolidatedWallets.length > 1 && (
            <div className="tw-pt-2">
              <h5 className="tw-pb-2 tw-pt-2">Active Consolidation</h5>
              <div className="tw-flex tw-flex-wrap tw-items-center">
                {props.consolidatedWallets.map((wallet, index) => (
                  <Fragment key={`consolidated-wallets-${index}`}>
                    <CheckedWalletAddress
                      checkedAddress={props.fetchedAddress}
                      address={wallet.address}
                      display={wallet.display}
                    />
                    {props.consolidatedWallets.length - 1 > index && (
                      <FontAwesomeIcon
                        icon={faPlusCircle}
                        className={styles["consolidationPlusIcon"]}
                      />
                    )}
                  </Fragment>
                ))}
                <FontAwesomeIcon
                  icon={faCheck}
                  className={styles["consolidationActiveIcon"]}
                />
              </div>
            </div>
          )}
        {props.consolidationActions.length > 0 && (
          <>
            <div className="tw-flex tw-items-center tw-pb-2 tw-pt-2">
              <FontAwesomeIcon
                icon={faXmark}
                className={styles["consolidationRecommendationIcon"]}
              />
              Incomplete Consolidation
            </div>
            <div className="tw-pb-2 tw-pt-2">
              Recommended Actions:
              <ul className={`${styles["recommendationsList"]} tw-pt-2`}>
                {props.consolidationActions.map((consolidation, index) => (
                  <li
                    key={`consolidated-wallets-${index}`}
                    className="tw-flex tw-items-center tw-gap-2"
                  >
                    &bull;&nbsp;Register Consolidation from{" "}
                    <CheckedWalletAddress
                      checkedAddress={props.fetchedAddress}
                      address={consolidation.to}
                      display={consolidation.to_display}
                    />{" "}
                    to{" "}
                    <CheckedWalletAddress
                      checkedAddress={props.fetchedAddress}
                      address={consolidation.from}
                      display={consolidation.from_display}
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
  return (
    <>
      {props.delegationsLoaded && (
        <DelegationsResults
          fetchedAddress={props.fetchedAddress}
          delegations={props.delegations}
          subDelegations={props.subDelegations}
          activeDelegation={props.activeDelegation}
        />
      )}
      {props.consolidationsLoaded && (
        <ConsolidationsResults
          fetchedAddress={props.fetchedAddress}
          consolidations={props.consolidations}
          consolidatedWallets={props.consolidatedWallets}
          consolidationActions={props.consolidationActions}
        />
      )}
    </>
  );
}
