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
        <div className="tw-mb-[21px]">
          <h2
            id="manage-by-collection"
            className="tw-mb-[8px] tw-text-lg tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-100 sm:tw-text-xl"
          >
            Manage by Collection
          </h2>
          <p className="tw-mb-0 tw-text-base tw-font-light tw-leading-7 tw-text-iron-400">
            Manage existing records by collection scope, including locks that
            block incoming delegations.
          </p>
        </div>
        <div className="tw-grid tw-grid-cols-1 tw-gap-[13px] sm:tw-grid-cols-2 xl:tw-grid-cols-4">
          {Object.values(SUPPORTED_COLLECTIONS).map((c) => (
            <button
              key={c.contract}
              type="button"
              className="tw-group tw-flex tw-min-h-[81px] tw-w-full tw-items-center tw-gap-[13px] tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.04] tw-bg-iron-950 tw-p-[13px] tw-text-left tw-text-iron-100 tw-shadow-[0_16px_40px_-32px_rgba(0,0,0,0.95)] tw-transition-[transform,background-color,border-color,box-shadow] tw-duration-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:-tw-translate-y-0.5 desktop-hover:hover:tw-border-white/[0.08] desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-shadow-[0_20px_44px_-30px_rgba(0,0,0,1)] motion-reduce:tw-transform-none motion-reduce:tw-transition-none"
              onClick={() => {
                const newSection = getCollectionSection(c.contract);
                if (newSection !== undefined) {
                  setRedirect(newSection);
                }
              }}
            >
              <span className="tw-relative tw-size-[55px] tw-shrink-0 tw-overflow-hidden tw-rounded-lg tw-bg-iron-800">
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
              <span className="tw-min-w-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-100 group-hover:tw-text-iron-50">
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
      <header className="tw-mb-[34px]">
        <h1 className="tw-mb-[13px] tw-text-[22px] tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-[26px]">
          Delegation Center
        </h1>
        <p className="tw-mb-0 tw-max-w-4xl tw-text-base tw-font-light tw-leading-7 tw-text-iron-400">
          Register wallet relationships for NFT utility and 6529 collection
          metrics. These actions do not transfer NFTs.
        </p>
      </header>

      <div className="tw-space-y-[13px]">
        {actionCards.map((card) => (
          <section
            key={card.title}
            className="tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-border-solid tw-border-white/[0.04] tw-bg-iron-950 tw-p-[21px] tw-shadow-[0_20px_60px_-38px_rgba(0,0,0,0.95)] before:tw-pointer-events-none before:tw-absolute before:tw-inset-x-[34px] before:tw-top-0 before:tw-h-px before:tw-bg-gradient-to-r before:tw-from-transparent before:tw-via-white/[0.08] before:tw-to-transparent sm:tw-p-[34px]"
          >
            <div className="tw-flex tw-flex-col tw-gap-[21px] sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
              <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-start tw-gap-[21px]">
                <Image
                  unoptimized
                  loading="eager"
                  priority
                  src={card.icon}
                  alt={card.iconAlt}
                  aria-hidden="true"
                  width={34}
                  height={34}
                  className="tw-mt-[5px] tw-size-[34px] tw-shrink-0 tw-object-contain tw-opacity-80"
                />
                <div className="tw-min-w-0">
                  <h2 className="tw-mb-[8px] tw-mt-0 tw-text-lg tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-100 sm:tw-text-xl">
                    {card.title}
                  </h2>
                  <ul className="tw-my-0 tw-min-w-0 tw-list-none tw-pl-0 tw-text-base tw-font-normal tw-leading-7 tw-text-iron-300">
                    {card.details.map((detail) => (
                      <li
                        key={detail}
                        className="tw-relative tw-mb-[5px] tw-pl-[13px] before:tw-absolute before:tw-left-0 before:tw-text-iron-500 before:tw-content-['•'] last:tw-mb-0"
                      >
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="tw-w-full tw-shrink-0 sm:tw-w-auto">
                <PrimaryButton
                  loading={false}
                  disabled={false}
                  onClicked={() => setRedirect(card.section)}
                  size="lg"
                  className="tw-min-h-11 tw-w-full sm:tw-min-w-48"
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

      <div className="tw-mt-[55px]">{printCollectionSelection()}</div>
    </div>
  );
}
