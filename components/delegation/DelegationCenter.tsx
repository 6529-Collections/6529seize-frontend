"use client";

import Image from "next/image";
import styles from "./Delegation.module.scss";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import {
  DELEGATION_ALL_ADDRESS,
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
} from "@/constants/constants";
import { areEqualAddresses } from "@/helpers/Helpers";
import { DelegationCenterSection } from "@/types/enums";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useEffectEvent, useState } from "react";
import { SUPPORTED_COLLECTIONS } from "./delegation-constants";

interface Props {
  setSection(section: DelegationCenterSection): any;
}

export default function DelegationCenterComponent(props: Readonly<Props>) {
  const [redirect, setRedirect] = useState<DelegationCenterSection>();
  const { isConnected, seizeConnect, seizeConnectOpen } =
    useSeizeConnectContext();
  const [openConnect, setOpenConnect] = useState(false);
  const { setSection } = props;

  const handleRedirect = useEffectEvent((target: DelegationCenterSection) => {
    if (!isConnected) {
      setOpenConnect(true);
      seizeConnect();
      return;
    }

    setSection(target);
  });

  const handleSeizeConnectClosed = useEffectEvent(() => {
    if (openConnect && redirect && isConnected) {
      setSection(redirect);
    }

    setRedirect(undefined);
  });

  useEffect(() => {
    if (!redirect) {
      return;
    }

    handleRedirect(redirect);
  }, [redirect]);

  useEffect(() => {
    if (!seizeConnectOpen) {
      handleSeizeConnectClosed();
    }
  }, [seizeConnectOpen]);

  function printCollectionSelection() {
    return (
      <div className="tw-w-full tw-p-0">
        <div className="tw-flex tw-flex-wrap -tw-mx-3 tw-pt-4 tw-pb-2">
          <div className="tw-w-full tw-px-3">
            <h4>Manage by Collection</h4>
          </div>
        </div>
        <div className="tw-flex tw-flex-wrap -tw-mx-3">
          {Object.values(SUPPORTED_COLLECTIONS).map((c) => (
            <div
              key={c.contract}
              className="tw-flex tw-w-full tw-flex-wrap tw-gap-3 tw-px-3 tw-py-2 sm:tw-w-1/2 md:tw-w-1/4"
            >
              <button
                key={c.contract}
                className={styles["collectionSelectionButton"]}
                onClick={() => {
                  const newSection = areEqualAddresses(
                    c.contract,
                    DELEGATION_ALL_ADDRESS
                  )
                    ? DelegationCenterSection.ANY_COLLECTION
                    : areEqualAddresses(c.contract, MEMES_CONTRACT)
                      ? DelegationCenterSection.MEMES_COLLECTION
                      : areEqualAddresses(c.contract, MEMELAB_CONTRACT)
                        ? DelegationCenterSection.MEME_LAB_COLLECTION
                        : areEqualAddresses(c.contract, GRADIENT_CONTRACT)
                          ? DelegationCenterSection.GRADIENTS_COLLECTION
                          : null;
                  if (newSection) {
                    setRedirect(newSection);
                  }
                }}
              >
                <span className="tw-flex tw-items-center tw-gap-3">
                  <Image
                    unoptimized
                    className={styles["collectionSelectionImage"]}
                    loading="eager"
                    priority
                    width={0}
                    height={0}
                    src={c.preview}
                    alt=""
                    aria-hidden="true"
                  />
                  <span>{c.title}</span>
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="tw-mx-auto tw-w-full tw-px-3 sm:tw-max-w-[540px] md:tw-max-w-[720px] lg:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
      <div className="tw-flex tw-flex-wrap -tw-mx-3 tw-pb-2">
        <div className="tw-w-full tw-px-3">
          <h1>Delegation Center</h1>
          <p className={styles["delegationCenterIntro"]}>
            Register wallet relationships for NFT utility and 6529 collection
            metrics. These actions do not transfer NFTs.
          </p>
        </div>
      </div>
      <div className="tw-flex tw-flex-wrap -tw-mx-3">
        <div className="tw-w-full tw-px-3">
          <div
            className={`${styles["delegationCenterSection"]} tw-py-4`}
          >
            <div className="tw-flex tw-flex-wrap -tw-mx-3">
              <div
                className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-2 tw-px-3 tw-py-2 md:tw-w-3/4"
              >
                <span className="tw-flex tw-flex-col">
                  <h3 className="tw-pb-4">Delegations</h3>
                  <span className="tw-flex tw-items-center tw-gap-3">
                    <Image
                      unoptimized
                      loading="eager"
                      priority
                      src="/delegation-icon.png"
                      alt="delegation"
                      width={50}
                      height={50}
                    />
                    <ul className="tw-mb-0">
                      <li>
                        Let a hot wallet use NFT utility held by a vault wallet
                      </li>
                      <li>Useful for minting, allowlists, and airdrops</li>
                    </ul>
                  </span>
                </span>
              </div>
              <div
                className="tw-flex tw-w-full tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-px-3 tw-py-2 md:tw-w-1/4"
              >
                <button
                  className={`${styles["addNewDelegationBtn"]}`}
                  onClick={() =>
                    setRedirect(DelegationCenterSection.REGISTER_DELEGATION)
                  }
                >
                  <FontAwesomeIcon
                    icon={faPlus}
                    className={styles["buttonIcon"]}
                  />
                  Register Delegation
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="tw-flex tw-flex-wrap -tw-mx-3 tw-pt-2">
        <div className="tw-w-full tw-px-3">
          <div
            className={`${styles["delegationCenterSection"]} tw-py-4`}
          >
            <div className="tw-flex tw-flex-wrap -tw-mx-3">
              <div
                className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-2 tw-px-3 tw-py-2 md:tw-w-3/4"
              >
                <span className="tw-flex tw-flex-col">
                  <h3 className="tw-pb-4">Consolidations</h3>
                  <span className="tw-flex tw-items-center tw-gap-3">
                    <Image
                      unoptimized
                      loading="eager"
                      priority
                      src="/consolidation-icon.png"
                      alt="consolidation"
                      width={50}
                      height={50}
                    />
                    <ul className="tw-mb-0">
                      <li>
                        Link wallets you control for TDH and collection metrics
                      </li>
                      <li>Requires reciprocal records between the wallets</li>
                    </ul>
                  </span>
                </span>
              </div>
              <div
                className="tw-flex tw-w-full tw-items-center tw-justify-center tw-px-3 tw-py-2 md:tw-w-1/4"
              >
                <button
                  className={`${styles["addNewDelegationBtn"]}`}
                  onClick={() =>
                    setRedirect(DelegationCenterSection.REGISTER_CONSOLIDATION)
                  }
                >
                  <FontAwesomeIcon
                    icon={faPlus}
                    className={styles["buttonIcon"]}
                  />
                  Register Consolidation
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="tw-flex tw-flex-wrap -tw-mx-3 tw-pt-2">
        <div className="tw-w-full tw-px-3">
          <div
            className={`${styles["delegationCenterSection"]} tw-py-4`}
          >
            <div className="tw-flex tw-flex-wrap -tw-mx-3">
              <div
                className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-2 tw-px-3 tw-py-2 md:tw-w-3/4"
              >
                <span className="tw-flex tw-flex-col">
                  <h3 className="tw-pb-4">Delegation Management</h3>
                  <span className="tw-flex tw-items-center tw-gap-3">
                    <Image
                      unoptimized
                      loading="eager"
                      priority
                      src="/manager-icon.png"
                      alt="delegation-manager"
                      width={50}
                      height={50}
                    />
                    <ul className="tw-mb-0">
                      <li>
                        Let one wallet maintain delegations for another wallet
                      </li>
                      <li>Keep vault wallets cold after setup</li>
                    </ul>
                  </span>
                </span>
              </div>
              <div
                className="tw-flex tw-w-full tw-items-center tw-justify-center tw-px-3 tw-py-2 md:tw-w-1/4"
              >
                <button
                  className={`${styles["addNewDelegationBtn"]}`}
                  onClick={() =>
                    setRedirect(DelegationCenterSection.REGISTER_SUB_DELEGATION)
                  }
                >
                  <FontAwesomeIcon
                    icon={faPlus}
                    className={styles["buttonIcon"]}
                  />
                  Register Delegation Manager
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="tw-flex tw-flex-wrap -tw-mx-3 tw-pt-4">
        <div className="tw-w-full tw-px-3">
          <p className={styles["delegationCenterIntro"]}>
            Manage existing records by collection scope, including locks that
            block incoming delegations.
          </p>
          {printCollectionSelection()}
        </div>
      </div>
    </div>
  );
}
