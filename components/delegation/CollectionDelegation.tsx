"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useChainId, useEnsName } from "wagmi";

import { DELEGATION_CONTRACT } from "@/constants/constants";
import { DelegationCenterSection } from "@/types/enums";
import { faCircleArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import { CollectionDelegationLocks } from "./collection-delegation/CollectionDelegationLocks";
import { CollectionDelegationSections } from "./collection-delegation/CollectionDelegationSections";
import { getCollectionScopeDescription } from "./collection-delegation/collection-delegation-helpers";
import type { SubDelegationForm } from "./collection-delegation/IncomingDelegationsTable";
import { useCollectionDelegationReads } from "./collection-delegation/useCollectionDelegationReads";
import { useCollectionLocks } from "./collection-delegation/useCollectionLocks";
import { useDelegationRevocation } from "./collection-delegation/useDelegationRevocation";
import type { DelegationCollection } from "./delegation-constants";
import { DelegationToast, useDelegationToast } from "./DelegationToast";
import NewAssignPrimaryAddress from "./NewAssignPrimaryAddress";
import NewConsolidationComponent from "./NewConsolidation";
import NewDelegationComponent from "./NewDelegation";
import NewSubDelegationComponent from "./NewSubDelegation";
import RevokeDelegationWithSubComponent from "./RevokeDelegationWithSub";
import UpdateDelegationComponent from "./UpdateDelegation";

interface Props {
  setSection(section: DelegationCenterSection): void;
  collection: DelegationCollection;
}

export default function CollectionDelegationComponent(props: Readonly<Props>) {
  const accountResolution = useSeizeConnectContext();
  const previousAccountAddressRef = useRef<string | undefined>(undefined);
  const networkResolution = useChainId();
  const ensResolution = useEnsName({
    address: accountResolution.address as `0x${string}`,
    chainId: 1,
  });

  const [showUpdateDelegation, setShowUpdateDelegation] = useState(false);

  const [updateDelegationParams, setUpdateDelegationParams] = useState<
    { wallet: string; use_case: number; display: string } | undefined
  >();

  const [subDelegationOriginalDelegator, setSubDelegationOriginalDelegator] =
    useState<string | undefined>(undefined);
  const [showCreateNewDelegationWithSub, setShowCreateNewDelegationWithSub] =
    useState(false);
  const [
    showCreateNewSubDelegationWithSub,
    setShowCreateNewSubDelegationWithSub,
  ] = useState(false);
  const [
    showCreateNewConsolidationWithSub,
    setShowCreateNewConsolidationWithSub,
  ] = useState(false);
  const [showAssignPrimaryAddressWithSub, setShowAssignPrimaryAddressWithSub] =
    useState(false);
  const [showRevokeDelegationWithSub, setShowRevokeDelegationWithSub] =
    useState(false);

  function chainsMatch() {
    return networkResolution === DELEGATION_CONTRACT.chain_id;
  }

  function getSwitchToMessage() {
    return `Switch to ${
      DELEGATION_CONTRACT.chain_id === 1
        ? "Ethereum Mainnet"
        : "Sepolia Network"
    }`;
  }

  const delegationReads = useCollectionDelegationReads({
    address: accountResolution.address,
    isConnected: accountResolution.isConnected,
    collection: props.collection,
  });

  const {
    toast,
    showToast,
    showDelegationToast,
    clearDelegationToast,
    setToastVisibility,
  } = useDelegationToast();

  const revocation = useDelegationRevocation({ showDelegationToast });

  const [delegationKeys, setDelegationKeys] = useState<string[]>([]);
  const [delegationKeysChanged, setDelegationKeysChanged] = useState(false);
  const [subDelegationKeys, setSubDelegationKeys] = useState<string[]>([]);
  const [subDelegationKeysChanged, setSubDelegationKeysChanged] =
    useState(false);
  const [consolidationKeys, setConsolidationKeys] = useState<string[]>([]);
  const [consolidationKeysChanged, setConsolidationKeysChanged] =
    useState(false);

  const locks = useCollectionLocks({
    address: accountResolution.address,
    isConnected: accountResolution.isConnected,
    collection: props.collection,
    showDelegationToast,
  });

  function resetDelegationWriteResults() {
    locks.resetLockWrites();
    revocation.resetRevocationWrites();
  }

  function setCollectionToastVisibility(show: boolean) {
    setToastVisibility(show);
    if (!show) {
      resetDelegationWriteResults();
    }
  }

  const reset = useEffectEvent((options?: { clearToast?: boolean }) => {
    delegationReads.resetDelegationReads();

    revocation.resetRevocationParams();
    if (options?.clearToast) {
      clearDelegationToast();
    }
    locks.resetLockSelection();
    resetDelegationWriteResults();
  });

  useEffect(() => {
    const previousAddress = previousAccountAddressRef.current;
    const currentAddress = accountResolution.address;

    previousAccountAddressRef.current = currentAddress;

    reset({
      clearToast: Boolean(
        previousAddress && previousAddress !== currentAddress
      ),
    });
  }, [accountResolution.address]);

  function handleEditDelegation(params: {
    wallet: string;
    use_case: number;
    display: string;
  }) {
    setUpdateDelegationParams(params);
    setShowUpdateDelegation(true);
    window.scrollTo(0, 0);
  }

  function handleShowSubForm(form: SubDelegationForm) {
    if (form === "delegation") {
      setShowCreateNewDelegationWithSub(true);
    } else if (form === "subDelegation") {
      setShowCreateNewSubDelegationWithSub(true);
    } else if (form === "consolidation") {
      setShowCreateNewConsolidationWithSub(true);
    } else if (form === "primaryAddress") {
      setShowAssignPrimaryAddressWithSub(true);
    } else {
      setShowRevokeDelegationWithSub(true);
    }
    window.scrollTo(0, 0);
  }

  return (
    <div className="tw-w-full">
      <div className="tw-w-full">
        <button
          type="button"
          className="tw-group tw-mb-4 tw-inline-flex tw-items-center tw-gap-2 tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0 tw-text-sm tw-font-semibold tw-text-iron-300 tw-transition-colors hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          onClick={() => props.setSection(DelegationCenterSection.CENTER)}
        >
          <FontAwesomeIcon
            icon={faCircleArrowLeft}
            className="tw-h-5 tw-w-5 tw-flex-none"
          />
          <span>Back to Delegation Center</span>
        </button>
        <header className="tw-mb-6">
          <div className="tw-flex tw-items-center tw-gap-4">
            <span className="tw-relative tw-h-14 tw-w-14 tw-flex-none tw-overflow-hidden tw-rounded-lg tw-bg-iron-800">
              <Image
                unoptimized
                className="tw-object-cover"
                loading="eager"
                priority
                fill
                sizes="56px"
                src={props.collection.preview}
                alt=""
                aria-hidden="true"
              />
            </span>
            <h1 className="tw-m-0 tw-text-3xl tw-font-bold tw-text-white">
              {props.collection.title}
            </h1>
          </div>
          <p className="tw-mb-0 tw-mt-3 tw-text-base tw-leading-6 tw-text-iron-300">
            {getCollectionScopeDescription(props.collection)}
          </p>
        </header>
        {!showUpdateDelegation &&
          !showCreateNewDelegationWithSub &&
          !showCreateNewSubDelegationWithSub &&
          !showCreateNewConsolidationWithSub &&
          !showAssignPrimaryAddressWithSub &&
          !showRevokeDelegationWithSub && (
            <>
              {!accountResolution.isConnected ? (
                <section
                  className="tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900 tw-p-5 sm:tw-p-6"
                  aria-labelledby="collection-connect-heading"
                >
                  <h2
                    id="collection-connect-heading"
                    className="tw-mb-2 tw-mt-0 tw-text-xl tw-font-semibold tw-text-white"
                  >
                    Connect Wallet to Manage {props.collection.title}
                  </h2>
                  <p className="tw-mb-4 tw-text-base tw-leading-6 tw-text-iron-300">
                    Connect the wallet whose outgoing and incoming records you
                    want to review.
                  </p>
                  <button
                    type="button"
                    className="tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white tw-bg-white tw-px-5 tw-py-2.5 tw-text-base tw-font-semibold tw-text-black tw-transition-colors hover:tw-bg-iron-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                    onClick={() => {
                      accountResolution.seizeConnect();
                    }}
                  >
                    Connect Wallet
                  </button>
                </section>
              ) : (
                <>
                  <CollectionDelegationSections
                    collection={props.collection}
                    reads={delegationReads}
                    revocation={revocation}
                    chainsMatch={chainsMatch}
                    getSwitchToMessage={getSwitchToMessage}
                    showDelegationToast={showDelegationToast}
                    onEditDelegation={handleEditDelegation}
                    subDelegationOriginalDelegator={
                      subDelegationOriginalDelegator
                    }
                    onSetOriginalDelegator={setSubDelegationOriginalDelegator}
                    onShowSubForm={handleShowSubForm}
                    disclosureState={{
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
                    }}
                  />
                  <CollectionDelegationLocks
                    collection={props.collection}
                    locks={locks}
                    chainsMatch={chainsMatch}
                    getSwitchToMessage={getSwitchToMessage}
                    showDelegationToast={showDelegationToast}
                  />
                </>
              )}
            </>
          )}
        {showUpdateDelegation &&
          updateDelegationParams &&
          accountResolution.address && (
            <UpdateDelegationComponent
              collection={props.collection}
              address={accountResolution.address}
              delegation={updateDelegationParams}
              ens={ensResolution.data}
              showAddMore={true}
              showCancel={true}
              onHide={() => {
                setShowUpdateDelegation(false);
              }}
              onSetToast={showDelegationToast}
            />
          )}
        {showCreateNewDelegationWithSub && subDelegationOriginalDelegator && (
          <NewDelegationComponent
            subdelegation={{
              originalDelegator: subDelegationOriginalDelegator,
              collection: props.collection,
            }}
            address={accountResolution.address as string}
            ens={ensResolution.data}
            onHide={() => {
              setShowCreateNewDelegationWithSub(false);
              setSubDelegationOriginalDelegator(undefined);
            }}
            onSetToast={showDelegationToast}
          />
        )}
        {showCreateNewSubDelegationWithSub &&
          subDelegationOriginalDelegator && (
            <NewSubDelegationComponent
              subdelegation={{
                originalDelegator: subDelegationOriginalDelegator,
                collection: props.collection,
              }}
              address={accountResolution.address as string}
              ens={ensResolution.data}
              onHide={() => {
                setShowCreateNewSubDelegationWithSub(false);
                setSubDelegationOriginalDelegator(undefined);
              }}
              onSetToast={showDelegationToast}
            />
          )}
        {showCreateNewConsolidationWithSub &&
          subDelegationOriginalDelegator && (
            <NewConsolidationComponent
              subdelegation={{
                originalDelegator: subDelegationOriginalDelegator,
                collection: props.collection,
              }}
              address={accountResolution.address as string}
              ens={ensResolution.data}
              onHide={() => {
                setShowCreateNewConsolidationWithSub(false);
                setSubDelegationOriginalDelegator(undefined);
              }}
              onSetToast={showDelegationToast}
            />
          )}

        {showAssignPrimaryAddressWithSub && subDelegationOriginalDelegator && (
          <NewAssignPrimaryAddress
            subdelegation={{
              originalDelegator: subDelegationOriginalDelegator,
              collection: props.collection,
            }}
            address={accountResolution.address as string}
            ens={ensResolution.data}
            onHide={() => {
              setShowAssignPrimaryAddressWithSub(false);
              setSubDelegationOriginalDelegator(undefined);
            }}
            onSetToast={showDelegationToast}
          />
        )}

        {showRevokeDelegationWithSub &&
          subDelegationOriginalDelegator &&
          accountResolution.address && (
            <RevokeDelegationWithSubComponent
              originalDelegator={subDelegationOriginalDelegator}
              collection={props.collection}
              address={accountResolution.address}
              ens={ensResolution.data}
              showAddMore={true}
              onHide={() => {
                setShowRevokeDelegationWithSub(false);
                setSubDelegationOriginalDelegator(undefined);
              }}
              onSetToast={showDelegationToast}
            />
          )}
      </div>
      {toast && (
        <DelegationToast
          toast={toast}
          showToast={showToast}
          setShowToast={setCollectionToastVisibility}
        />
      )}
    </div>
  );
}
