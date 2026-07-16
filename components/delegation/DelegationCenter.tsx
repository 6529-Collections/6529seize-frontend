"use client";

import Image from "next/image";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
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
  setSection(section: DelegationCenterSection): void;
}

function getCollectionSection(contract: string) {
  if (areEqualAddresses(contract, DELEGATION_ALL_ADDRESS)) {
    return DelegationCenterSection.ANY_COLLECTION;
  }
  if (areEqualAddresses(contract, MEMES_CONTRACT)) {
    return DelegationCenterSection.MEMES_COLLECTION;
  }
  if (areEqualAddresses(contract, MEMELAB_CONTRACT)) {
    return DelegationCenterSection.MEME_LAB_COLLECTION;
  }
  if (areEqualAddresses(contract, GRADIENT_CONTRACT)) {
    return DelegationCenterSection.GRADIENTS_COLLECTION;
  }
  return undefined;
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
      <section className="tw-w-full" aria-labelledby="manage-by-collection">
        <div className="tw-mb-5">
          <h2
            id="manage-by-collection"
            className="tw-mb-2 tw-text-xl tw-font-semibold tw-text-white"
          >
            Manage by Collection
          </h2>
          <p className="tw-mb-0 tw-text-base tw-leading-6 tw-text-iron-300">
            Manage existing records by collection scope, including locks that
            block incoming delegations.
          </p>
        </div>
        <div className="tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-2 xl:tw-grid-cols-4">
          {Object.values(SUPPORTED_COLLECTIONS).map((c) => (
            <button
              key={c.contract}
              type="button"
              className="tw-group tw-grid tw-min-h-20 tw-w-full tw-grid-cols-[56px_minmax(0,1fr)_56px] tw-items-center tw-gap-4 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-px-5 tw-py-3 tw-text-white tw-shadow-sm tw-transition-colors hover:tw-border-white/20 hover:tw-bg-iron-800 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
              onClick={() => {
                const newSection = getCollectionSection(c.contract);
                if (newSection !== undefined) {
                  setRedirect(newSection);
                }
              }}
            >
              <span className="tw-relative tw-h-14 tw-w-14 tw-shrink-0 tw-overflow-hidden tw-rounded-md tw-bg-iron-800">
                <Image
                  unoptimized
                  className="tw-object-cover"
                  loading="eager"
                  priority
                  fill
                  sizes="56px"
                  src={c.preview}
                  alt=""
                  aria-hidden="true"
                />
              </span>
              <span className="tw-whitespace-nowrap tw-text-center tw-text-base tw-font-semibold">
                {c.title}
              </span>
              <span aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>
    );
  }

  const actionCards = [
    {
      title: "Delegations",
      icon: "/delegation-icon.png",
      iconAlt: "",
      details: [
        "Let a hot wallet use NFT utility held by a vault wallet",
        "Useful for minting, allowlists, and airdrops",
      ],
      buttonLabel: "Delegation",
      section: DelegationCenterSection.REGISTER_DELEGATION,
    },
    {
      title: "Consolidations",
      icon: "/consolidation-icon.png",
      iconAlt: "",
      details: [
        "Link wallets you control for TDH and collection metrics",
        "Requires reciprocal records between the wallets",
      ],
      buttonLabel: "Consolidation",
      section: DelegationCenterSection.REGISTER_CONSOLIDATION,
    },
    {
      title: "Delegation Management",
      icon: "/manager-icon.png",
      iconAlt: "",
      details: [
        "Let one wallet maintain delegations for another wallet",
        "Keep vault wallets cold after setup",
      ],
      buttonLabel: "Delegation Manager",
      section: DelegationCenterSection.REGISTER_SUB_DELEGATION,
    },
  ] as const;

  return (
    <div className="tw-w-full">
      <header className="tw-mb-6">
        <h1 className="tw-mb-2 tw-text-3xl tw-font-bold tw-text-white">
          Delegation Center
        </h1>
        <p className="tw-mb-0 tw-max-w-4xl tw-text-base tw-leading-6 tw-text-iron-300">
          Register wallet relationships for NFT utility and 6529 collection
          metrics. These actions do not transfer NFTs.
        </p>
      </header>

      <div className="tw-space-y-3">
        {actionCards.map((card) => (
          <section
            key={card.title}
            className="tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900 tw-p-5 sm:tw-p-6"
          >
            <div className="tw-flex tw-flex-col tw-gap-5 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between">
              <div className="tw-min-w-0 tw-flex-1">
                <h2 className="tw-mb-8 tw-mt-0 tw-text-xl tw-font-semibold tw-text-white">
                  {card.title}
                </h2>
                <div className="tw-flex tw-items-center tw-gap-4">
                  <Image
                    unoptimized
                    loading="eager"
                    priority
                    src={card.icon}
                    alt={card.iconAlt}
                    aria-hidden="true"
                    width={56}
                    height={56}
                    className="tw-h-14 tw-w-14 tw-shrink-0 tw-object-contain"
                  />
                  <ul className="tw-my-0 tw-min-w-0 tw-pl-5 tw-text-base tw-leading-6 tw-text-iron-100">
                    {card.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="tw-w-full tw-shrink-0 lg:tw-w-72">
                <PrimaryButton
                  loading={false}
                  disabled={false}
                  onClicked={() => setRedirect(card.section)}
                  size="lg"
                  className="tw-min-h-12 tw-w-full"
                >
                  <FontAwesomeIcon
                    icon={faPlus}
                    className="tw-h-3.5 tw-w-3.5"
                  />
                  {card.buttonLabel}
                </PrimaryButton>
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="tw-mt-10">{printCollectionSelection()}</div>
    </div>
  );
}
