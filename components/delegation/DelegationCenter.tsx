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
import {
  faLink,
  faPlus,
  faUserGear,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useEffectEvent, useState } from "react";
import { SUPPORTED_COLLECTIONS } from "./delegation-constants";
import {
  DELEGATION_CARD_CLASS_NAME,
  DELEGATION_PAGE_DESCRIPTION_CLASS_NAME,
  DELEGATION_PAGE_TITLE_CLASS_NAME,
} from "./delegation-ui";

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
        <div className="tw-mb-6">
          <h2
            id="manage-by-collection"
            className="tw-m-0 tw-text-lg tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-100 sm:tw-text-xl"
          >
            Manage by Collection
          </h2>
          <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-font-normal tw-leading-6 tw-text-iron-400">
            Manage existing records by collection scope, including locks that
            block incoming delegations.
          </p>
        </div>
        <div className="tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2 xl:tw-grid-cols-4">
          {Object.values(SUPPORTED_COLLECTIONS).map((c) => (
            <button
              key={c.contract}
              type="button"
              className={`tw-group tw-flex tw-min-h-20 tw-w-full tw-flex-col tw-items-center tw-justify-center tw-gap-4 tw-overflow-hidden ${DELEGATION_CARD_CLASS_NAME} tw-p-4 tw-text-iron-100 tw-transition-colors hover:tw-border-white/10 hover:tw-bg-iron-900 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 sm:tw-flex-row sm:tw-justify-start`}
              onClick={() => {
                const newSection = getCollectionSection(c.contract);
                if (newSection !== undefined) {
                  setRedirect(newSection);
                }
              }}
            >
              <span className="tw-relative tw-h-12 tw-w-12 tw-shrink-0 tw-overflow-hidden tw-rounded-lg tw-bg-iron-800">
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
              <span className="tw-min-w-0 tw-text-center tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-100 sm:tw-text-left">
                {c.title}
              </span>
            </button>
          ))}
        </div>
      </section>
    );
  }

  const actionCards = [
    {
      title: "Delegations",
      icon: faWallet,
      details: [
        "Let a hot wallet use NFT utility held by a vault wallet",
        "Useful for minting, allowlists, and airdrops",
      ],
      buttonLabel: "Delegation",
      section: DelegationCenterSection.REGISTER_DELEGATION,
    },
    {
      title: "Consolidations",
      icon: faLink,
      details: [
        "Link wallets you control for TDH and collection metrics",
        "Requires reciprocal records between the wallets",
      ],
      buttonLabel: "Consolidation",
      section: DelegationCenterSection.REGISTER_CONSOLIDATION,
    },
    {
      title: "Delegation Management",
      icon: faUserGear,
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
      <header className="tw-mb-12">
        <h1 className={DELEGATION_PAGE_TITLE_CLASS_NAME}>Delegation Center</h1>
        <p className={DELEGATION_PAGE_DESCRIPTION_CLASS_NAME}>
          Register wallet relationships for NFT utility and 6529 collection
          metrics. These actions do not transfer NFTs.
        </p>
      </header>

      <div className="tw-space-y-3">
        {actionCards.map((card) => (
          <article
            key={card.title}
            className={`${DELEGATION_CARD_CLASS_NAME} tw-p-5 tw-transition-colors hover:tw-border-white/[0.08] hover:tw-bg-iron-900 sm:tw-p-6`}
          >
            <h2 className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-100">
              {card.title}
            </h2>
            <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-5 md:tw-flex-row md:tw-items-center md:tw-justify-between">
              <div className="tw-flex tw-min-w-0 tw-items-start tw-gap-4 md:tw-items-center md:tw-gap-6 lg:tw-gap-10">
                <div className="tw-flex tw-h-8 tw-w-8 tw-shrink-0 tw-items-center tw-justify-start tw-text-iron-400 md:tw-w-12 md:tw-justify-center">
                  <FontAwesomeIcon
                    icon={card.icon}
                    className="tw-size-7"
                    aria-hidden="true"
                  />
                </div>
                <ul className="tw-m-0 tw-min-w-0 tw-space-y-1 tw-pl-5 tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-400 marker:tw-text-iron-600">
                  {card.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </div>
              <div className="tw-w-full tw-shrink-0 md:tw-w-56">
                <PrimaryButton
                  loading={false}
                  disabled={false}
                  onClicked={() => setRedirect(card.section)}
                  className="tw-min-h-11 tw-w-full"
                >
                  <FontAwesomeIcon
                    icon={faPlus}
                    className="tw-h-3.5 tw-w-3.5"
                  />
                  {card.buttonLabel}
                </PrimaryButton>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="tw-mt-16">{printCollectionSelection()}</div>
    </div>
  );
}
