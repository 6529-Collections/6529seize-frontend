"use client";

import { useEffect, useState, type ReactNode } from "react";

import styles from "../Delegation.module.css";
import type { ContractDelegation } from "../CollectionDelegation.utils";
import type { DelegationCollection } from "../delegation-constants";
import {
  CONSOLIDATION_USE_CASE,
  SUB_DELEGATION_USE_CASE,
} from "../delegation-constants";
import type { DelegationToastState } from "../DelegationToast";
import {
  DelegationDisclosurePanel,
  getActiveKeys,
  toggleDisclosureKey,
} from "./DelegationDisclosurePanel";
import {
  IncomingDelegationsTable,
  type SubDelegationForm,
} from "./IncomingDelegationsTable";
import { OutgoingDelegationsTable } from "./OutgoingDelegationsTable";
import type { CollectionDelegationReads } from "./useCollectionDelegationReads";
import type { DelegationRevocation } from "./useDelegationRevocation";

/**
 * The three record sections of the collection-delegation screen
 * (Delegations, Consolidations, Delegation Managers), each with its
 * outgoing/incoming disclosure panels.
 */
export function CollectionDelegationSections(
  props: Readonly<{
    collection: DelegationCollection;
    reads: CollectionDelegationReads;
    revocation: DelegationRevocation;
    chainsMatch: () => boolean;
    getSwitchToMessage: () => ReactNode;
    showDelegationToast: (toast: DelegationToastState) => void;
    onEditDelegation: (params: {
      wallet: string;
      use_case: number;
      display: string;
    }) => void;
    subDelegationOriginalDelegator: string | undefined;
    onSetOriginalDelegator: (wallet: string | undefined) => void;
    onShowSubForm: (form: SubDelegationForm) => void;
  }>
) {
  const { collection, reads, revocation } = props;
  const { chainsMatch, getSwitchToMessage, showDelegationToast } = props;
  const { onEditDelegation, onSetOriginalDelegator, onShowSubForm } = props;
  const { subDelegationOriginalDelegator } = props;
  const { outgoingDelegations, incomingDelegations } = reads;

  const [delegationKeys, setDelegationKeys] = useState<string[]>([]);
  const [delegationKeysChanged, setDelegationKeysChanged] = useState(false);
  const [subDelegationKeys, setSubDelegationKeys] = useState<string[]>([]);
  const [subDelegationKeysChanged, setSubDelegationKeysChanged] =
    useState(false);
  const [consolidationKeys, setConsolidationKeys] = useState<string[]>([]);
  const [consolidationKeysChanged, setConsolidationKeysChanged] =
    useState(false);

  useEffect(() => {
    const outDelegations = [...outgoingDelegations].filter(
      (d) =>
        d.useCase.use_case != SUB_DELEGATION_USE_CASE.use_case &&
        d.useCase.use_case != CONSOLIDATION_USE_CASE.use_case
    );
    const inDelegations = [...incomingDelegations].filter(
      (d) =>
        d.useCase.use_case != SUB_DELEGATION_USE_CASE.use_case &&
        d.useCase.use_case != CONSOLIDATION_USE_CASE.use_case
    );

    if (!delegationKeysChanged) {
      setDelegationKeys(getActiveKeys(outDelegations, inDelegations));
    }
    if (!subDelegationKeysChanged) {
      setSubDelegationKeys(
        getActiveKeys(
          [...outgoingDelegations].filter(
            (d) => d.useCase.use_case === SUB_DELEGATION_USE_CASE.use_case
          ),
          [...incomingDelegations].filter(
            (d) => d.useCase.use_case === SUB_DELEGATION_USE_CASE.use_case
          )
        )
      );
    }
    if (!consolidationKeysChanged) {
      setConsolidationKeys(
        getActiveKeys(
          [...outgoingDelegations].filter(
            (d) => d.useCase.use_case === CONSOLIDATION_USE_CASE.use_case
          ),
          [...incomingDelegations].filter(
            (d) => d.useCase.use_case === CONSOLIDATION_USE_CASE.use_case
          )
        )
      );
    }
  }, [
    incomingDelegations,
    outgoingDelegations,
    consolidationKeysChanged,
    delegationKeysChanged,
    subDelegationKeysChanged,
  ]);

  function printOutgoingDelegations(
    scope: string,
    myDelegations: ContractDelegation[]
  ) {
    return (
      <OutgoingDelegationsTable
        scope={scope}
        myDelegations={myDelegations}
        collection={collection}
        delegationsLoaded={reads.outgoingDelegationsLoaded}
        activeConsolidations={reads.outgoingActiveConsolidations}
        revocation={revocation}
        chainsMatch={chainsMatch}
        getSwitchToMessage={getSwitchToMessage}
        showDelegationToast={showDelegationToast}
        onEditDelegation={onEditDelegation}
      />
    );
  }

  function printIncomingDelegations(
    scope: string,
    myDelegations: ContractDelegation[],
    isSubdelegation?: boolean
  ) {
    return (
      <IncomingDelegationsTable
        scope={scope}
        myDelegations={myDelegations}
        collection={collection}
        delegationsLoaded={reads.incomingDelegationsLoaded}
        activeConsolidations={reads.incomingActiveConsolidations}
        isSubdelegation={isSubdelegation}
        subDelegationOriginalDelegator={subDelegationOriginalDelegator}
        onSetOriginalDelegator={onSetOriginalDelegator}
        onShowSubForm={onShowSubForm}
      />
    );
  }

  function printDelegations() {
    const outDelegations = [...outgoingDelegations].filter(
      (d) =>
        d.useCase.use_case != SUB_DELEGATION_USE_CASE.use_case &&
        d.useCase.use_case != CONSOLIDATION_USE_CASE.use_case
    );
    const inDelegations = [...incomingDelegations].filter(
      (d) =>
        d.useCase.use_case != SUB_DELEGATION_USE_CASE.use_case &&
        d.useCase.use_case != CONSOLIDATION_USE_CASE.use_case
    );
    return (
      <>
        <h5 className="tw-pb-1 tw-pt-3">Delegations</h5>
        <p className={styles["collectionSectionIntro"]}>
          Delegations let another wallet use NFT utility for this collection
          scope without moving the NFT.
        </p>
        <div className="tw-space-y-3">
          <DelegationDisclosurePanel
            title="Outgoing Delegations"
            isOpen={delegationKeys.includes("0")}
            onToggle={() =>
              toggleDisclosureKey(
                "0",
                setDelegationKeys,
                setDelegationKeysChanged
              )
            }
          >
            {printOutgoingDelegations("delegations", outDelegations)}
          </DelegationDisclosurePanel>
          <DelegationDisclosurePanel
            title="Incoming Delegations"
            isOpen={delegationKeys.includes("1")}
            onToggle={() =>
              toggleDisclosureKey(
                "1",
                setDelegationKeys,
                setDelegationKeysChanged
              )
            }
          >
            {printIncomingDelegations("delegations", inDelegations)}
          </DelegationDisclosurePanel>
        </div>
      </>
    );
  }

  function printSubDelegations() {
    return (
      <>
        <h5 className="tw-pb-1 tw-pt-4">Delegation Managers</h5>
        <p className={styles["collectionSectionIntro"]}>
          Manager rights let another wallet maintain delegations or
          consolidations for this collection scope.
        </p>
        <div className="tw-space-y-3">
          <DelegationDisclosurePanel
            title="Outgoing Manager Rights"
            isOpen={subDelegationKeys.includes("0")}
            onToggle={() =>
              toggleDisclosureKey(
                "0",
                setSubDelegationKeys,
                setSubDelegationKeysChanged
              )
            }
          >
            {printOutgoingDelegations(
              "Delegation Managers",
              [...outgoingDelegations].filter(
                (d) => d.useCase.use_case === SUB_DELEGATION_USE_CASE.use_case
              )
            )}
          </DelegationDisclosurePanel>
          <DelegationDisclosurePanel
            title="Incoming Manager Rights"
            isOpen={subDelegationKeys.includes("1")}
            onToggle={() =>
              toggleDisclosureKey(
                "1",
                setSubDelegationKeys,
                setSubDelegationKeysChanged
              )
            }
          >
            {printIncomingDelegations(
              "Delegation Managers",
              [...incomingDelegations].filter(
                (d) => d.useCase.use_case === SUB_DELEGATION_USE_CASE.use_case
              ),
              true
            )}
          </DelegationDisclosurePanel>
        </div>
      </>
    );
  }

  function printConsolidations() {
    return (
      <>
        <h5 className="tw-pb-1 tw-pt-4">Consolidations</h5>
        <p className={styles["collectionSectionIntro"]}>
          Consolidations link wallets you control so 6529 can treat them
          together for collection metrics.
        </p>
        <div className="tw-space-y-3">
          <DelegationDisclosurePanel
            title="Outgoing Consolidations"
            isOpen={consolidationKeys.includes("0")}
            onToggle={() =>
              toggleDisclosureKey(
                "0",
                setConsolidationKeys,
                setConsolidationKeysChanged
              )
            }
          >
            {printOutgoingDelegations(
              "consolidations",
              [...outgoingDelegations].filter(
                (d) => d.useCase.use_case === CONSOLIDATION_USE_CASE.use_case
              )
            )}
          </DelegationDisclosurePanel>
          <DelegationDisclosurePanel
            title="Incoming Consolidations"
            isOpen={consolidationKeys.includes("1")}
            onToggle={() =>
              toggleDisclosureKey(
                "1",
                setConsolidationKeys,
                setConsolidationKeysChanged
              )
            }
          >
            {printIncomingDelegations(
              "consolidations",
              [...incomingDelegations].filter(
                (d) => d.useCase.use_case === CONSOLIDATION_USE_CASE.use_case
              )
            )}
          </DelegationDisclosurePanel>
        </div>
      </>
    );
  }

  return (
    <>
      {printDelegations()}
      {printConsolidations()}
      {printSubDelegations()}
    </>
  );
}
