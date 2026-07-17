"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useEffect, useMemo, type Dispatch, type SetStateAction } from "react";

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

interface DisclosureState {
  delegationKeys: string[];
  setDelegationKeys: Dispatch<SetStateAction<string[]>>;
  delegationKeysChanged: boolean;
  setDelegationKeysChanged: Dispatch<SetStateAction<boolean>>;
  subDelegationKeys: string[];
  setSubDelegationKeys: Dispatch<SetStateAction<string[]>>;
  subDelegationKeysChanged: boolean;
  setSubDelegationKeysChanged: Dispatch<SetStateAction<boolean>>;
  consolidationKeys: string[];
  setConsolidationKeys: Dispatch<SetStateAction<string[]>>;
  consolidationKeysChanged: boolean;
  setConsolidationKeysChanged: Dispatch<SetStateAction<boolean>>;
}

function groupDelegationsByType(delegations: ContractDelegation[]) {
  return {
    delegations: delegations.filter(
      (delegation) =>
        delegation.useCase.use_case != SUB_DELEGATION_USE_CASE.use_case &&
        delegation.useCase.use_case != CONSOLIDATION_USE_CASE.use_case
    ),
    subDelegations: delegations.filter(
      (delegation) =>
        delegation.useCase.use_case === SUB_DELEGATION_USE_CASE.use_case
    ),
    consolidations: delegations.filter(
      (delegation) =>
        delegation.useCase.use_case === CONSOLIDATION_USE_CASE.use_case
    ),
  };
}

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
    getSwitchToMessage: () => string;
    showDelegationToast: (toast: DelegationToastState) => void;
    onEditDelegation: (params: {
      wallet: string;
      use_case: number;
      display: string;
    }) => void;
    subDelegationOriginalDelegator: string | undefined;
    onSetOriginalDelegator: (wallet: string | undefined) => void;
    onShowSubForm: (form: SubDelegationForm) => void;
    disclosureState: DisclosureState;
  }>
) {
  const locale = useBrowserLocale();
  const { collection, reads, revocation } = props;
  const { chainsMatch, getSwitchToMessage, showDelegationToast } = props;
  const { onEditDelegation, onSetOriginalDelegator, onShowSubForm } = props;
  const { subDelegationOriginalDelegator } = props;
  const { outgoingDelegations, incomingDelegations } = reads;
  const {
    delegationKeys,
    setDelegationKeys,
    delegationKeysChanged,
    setDelegationKeysChanged,
    subDelegationKeys,
    setSubDelegationKeys,
    subDelegationKeysChanged,
    setSubDelegationKeysChanged,
    consolidationKeys,
    setConsolidationKeys,
    consolidationKeysChanged,
    setConsolidationKeysChanged,
  } = props.disclosureState;

  const {
    delegations: outDelegations,
    subDelegations: outSubDelegations,
    consolidations: outConsolidations,
  } = useMemo(
    () => groupDelegationsByType(outgoingDelegations),
    [outgoingDelegations]
  );
  const {
    delegations: inDelegations,
    subDelegations: inSubDelegations,
    consolidations: inConsolidations,
  } = useMemo(
    () => groupDelegationsByType(incomingDelegations),
    [incomingDelegations]
  );

  useEffect(() => {
    if (!delegationKeysChanged) {
      setDelegationKeys(getActiveKeys(outDelegations, inDelegations));
    }
    if (!subDelegationKeysChanged) {
      setSubDelegationKeys(getActiveKeys(outSubDelegations, inSubDelegations));
    }
    if (!consolidationKeysChanged) {
      setConsolidationKeys(getActiveKeys(outConsolidations, inConsolidations));
    }
  }, [
    consolidationKeysChanged,
    delegationKeysChanged,
    inConsolidations,
    inDelegations,
    inSubDelegations,
    outConsolidations,
    outDelegations,
    outSubDelegations,
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
        delegationsError={reads.outgoingDelegationsError}
        onRetry={() => {
          reads.retryOutgoingDelegations();
        }}
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
        delegationsError={reads.incomingDelegationsError}
        onRetry={() => {
          reads.retryIncomingDelegations();
        }}
        activeConsolidations={reads.incomingActiveConsolidations}
        isSubdelegation={isSubdelegation}
        subDelegationOriginalDelegator={subDelegationOriginalDelegator}
        onSetOriginalDelegator={onSetOriginalDelegator}
        onShowSubForm={onShowSubForm}
      />
    );
  }

  function printDelegations() {
    return (
      <section className="tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900 tw-p-4 sm:tw-p-6">
        <h2 className="tw-mb-2 tw-mt-0 tw-text-xl tw-font-semibold tw-text-white">
          {t(locale, "delegation.collection.sections.delegations.title")}
        </h2>
        <p className="tw-mb-5 tw-text-base tw-leading-6 tw-text-iron-300">
          {t(locale, "delegation.collection.sections.delegations.description")}
        </p>
        <div className="tw-space-y-3">
          <DelegationDisclosurePanel
            title={t(
              locale,
              "delegation.collection.sections.delegations.outgoing"
            )}
            isOpen={delegationKeys.includes("0")}
            onToggle={() =>
              toggleDisclosureKey(
                "0",
                setDelegationKeys,
                setDelegationKeysChanged
              )
            }
          >
            {printOutgoingDelegations(
              t(locale, "delegation.collection.scopeLabel.delegations"),
              outDelegations
            )}
          </DelegationDisclosurePanel>
          <DelegationDisclosurePanel
            title={t(
              locale,
              "delegation.collection.sections.delegations.incoming"
            )}
            isOpen={delegationKeys.includes("1")}
            onToggle={() =>
              toggleDisclosureKey(
                "1",
                setDelegationKeys,
                setDelegationKeysChanged
              )
            }
          >
            {printIncomingDelegations(
              t(locale, "delegation.collection.scopeLabel.delegations"),
              inDelegations
            )}
          </DelegationDisclosurePanel>
        </div>
      </section>
    );
  }

  function printSubDelegations() {
    return (
      <section className="tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900 tw-p-4 sm:tw-p-6">
        <h2 className="tw-mb-2 tw-mt-0 tw-text-xl tw-font-semibold tw-text-white">
          {t(locale, "delegation.collection.sections.managers.title")}
        </h2>
        <p className="tw-mb-5 tw-text-base tw-leading-6 tw-text-iron-300">
          {t(locale, "delegation.collection.sections.managers.description")}
        </p>
        <div className="tw-space-y-3">
          <DelegationDisclosurePanel
            title={t(
              locale,
              "delegation.collection.sections.managers.outgoing"
            )}
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
              t(locale, "delegation.collection.scopeLabel.managers"),
              outSubDelegations
            )}
          </DelegationDisclosurePanel>
          <DelegationDisclosurePanel
            title={t(
              locale,
              "delegation.collection.sections.managers.incoming"
            )}
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
              t(locale, "delegation.collection.scopeLabel.managers"),
              inSubDelegations,
              true
            )}
          </DelegationDisclosurePanel>
        </div>
      </section>
    );
  }

  function printConsolidations() {
    return (
      <section className="tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900 tw-p-4 sm:tw-p-6">
        <h2 className="tw-mb-2 tw-mt-0 tw-text-xl tw-font-semibold tw-text-white">
          {t(locale, "delegation.collection.sections.consolidations.title")}
        </h2>
        <p className="tw-mb-5 tw-text-base tw-leading-6 tw-text-iron-300">
          {t(
            locale,
            "delegation.collection.sections.consolidations.description"
          )}
        </p>
        <div className="tw-space-y-3">
          <DelegationDisclosurePanel
            title={t(
              locale,
              "delegation.collection.sections.consolidations.outgoing"
            )}
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
              t(locale, "delegation.collection.scopeLabel.consolidations"),
              outConsolidations
            )}
          </DelegationDisclosurePanel>
          <DelegationDisclosurePanel
            title={t(
              locale,
              "delegation.collection.sections.consolidations.incoming"
            )}
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
              t(locale, "delegation.collection.scopeLabel.consolidations"),
              inConsolidations
            )}
          </DelegationDisclosurePanel>
        </div>
      </section>
    );
  }

  return (
    <div className="tw-space-y-6">
      {printDelegations()}
      {printConsolidations()}
      {printSubDelegations()}
    </div>
  );
}
