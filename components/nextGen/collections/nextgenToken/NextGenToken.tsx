"use client";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import TransferSingle from "@/components/nft-transfer/TransferSingle";
import { NEXTGEN_CONTRACT } from "@/constants/constants";
import type {
  NextGenCollection,
  NextGenToken,
  NextGenTrait,
} from "@/entities/INextgen";
import { CollectedCollectionType } from "@/entities/IProfile";
import { areEqualAddresses, isNullAddress } from "@/helpers/Helpers";
import { ContractType, NextgenCollectionView } from "@/types/enums";
import {
  faChevronLeft,
  faChevronRight,
  faFire,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { Tooltip } from "react-tooltip";
import { printViewButton } from "../collectionParts/NextGenCollection";
import { NextGenBackToCollectionPageLink } from "../collectionParts/NextGenCollectionHeader";
import NextGenTokenAbout from "./NextGenTokenAbout";
import NextGenTokenArt from "./NextGenTokenArt";
import NextgenTokenRarity, {
  NextgenTokenTraits,
} from "./NextGenTokenProperties";
import NextGenTokenProvenance from "./NextGenTokenProvenance";
import NextGenTokenRenderCenter from "./NextGenTokenRenderCenter";

interface Props {
  collection: NextGenCollection;
  token: NextGenToken;
  traits: NextGenTrait[];
  tokenCount: number;
  view: NextgenCollectionView;
  setView: (view: NextgenCollectionView) => void;
}

export default function NextGenTokenPage(props: Readonly<Props>) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { address: connectedAddress } = useSeizeConnectContext();

  const isConnectedAddressOwner = useMemo(() => {
    return areEqualAddresses(connectedAddress, props.token.owner);
  }, [props.token.owner, connectedAddress]);

  const transferSingle = useMemo(() => {
    if (!isConnectedAddressOwner) {
      return null;
    }

    return (
      <div>
        <TransferSingle
          collectionType={CollectedCollectionType.NEXTGEN}
          contractType={ContractType.ERC721}
          contract={NEXTGEN_CONTRACT}
          tokenId={props.token.id}
          max={1}
          title={props.token.name ?? `6529 NextGen #${props.token.id}`}
          thumbUrl={props.token.thumbnail_url}
        />
      </div>
    );
  }, [
    props.token.id,
    props.token.name,
    props.token.thumbnail_url,
    isConnectedAddressOwner,
  ]);

  function printDetails() {
    return (
      <>
        <nav
          aria-label={`${props.token.name} sections`}
          className="tw-mt-6 tw-overflow-x-auto tw-border-0 tw-border-b tw-border-solid tw-border-white/15"
        >
          <div className="-tw-mb-px tw-inline-flex tw-min-w-max tw-gap-6 sm:tw-gap-8">
            {printViewButton(
              props.view,
              NextgenCollectionView.ABOUT,
              props.setView
            )}
            {printViewButton(
              props.view,
              NextgenCollectionView.PROVENANCE,
              props.setView
            )}
            {printViewButton(
              props.view,
              NextgenCollectionView.DISPLAY_CENTER,
              props.setView
            )}
            {printViewButton(
              props.view,
              NextgenCollectionView.RARITY,
              props.setView
            )}
          </div>
        </nav>

        <section className="tw-pb-6 tw-pt-6">
          {props.view === NextgenCollectionView.ABOUT && (
            <section>
              <h2 className="tw-mb-5 tw-mt-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-2xl">
                About
              </h2>
              <div className="tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/80 tw-p-4 sm:tw-p-5">
                <div className="tw-grid tw-gap-5 lg:tw-grid-cols-2">
                  <NextGenTokenAbout
                    collection={props.collection}
                    token={props.token}
                  />
                  <div className="tw-grid tw-gap-5 tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-5 lg:tw-border-0 lg:tw-border-l lg:tw-border-solid lg:tw-border-white/10 lg:tw-pl-5 lg:tw-pt-0">
                    {transferSingle}
                    <NextgenTokenTraits
                      collection={props.collection}
                      token={props.token}
                      traits={props.traits.filter(
                        (trait) => trait.trait !== "Collection Name"
                      )}
                      tokenCount={props.tokenCount}
                    />
                  </div>
                </div>
              </div>
            </section>
          )}
          {props.view === NextgenCollectionView.PROVENANCE && (
            <div>
              <NextGenTokenProvenance
                token_id={props.token.id}
                collection={props.collection}
              />
            </div>
          )}
          {props.view === NextgenCollectionView.DISPLAY_CENTER && (
            <div>
              <NextGenTokenRenderCenter token={props.token} />
            </div>
          )}
          {props.view === NextgenCollectionView.RARITY && (
            <div>
              <NextgenTokenRarity
                collection={props.collection}
                token={props.token}
                traits={props.traits}
                tokenCount={props.tokenCount}
              />
            </div>
          )}
        </section>
      </>
    );
  }

  function printPreviousToken() {
    const hasPreviousToken = props.token.normalised_id > 0;
    return (
      <>
        <button
          type="button"
          aria-label="Previous token"
          disabled={!hasPreviousToken}
          {...(hasPreviousToken && {
            "data-tooltip-id": `prev-token-${props.token.id}`,
          })}
          onClick={() => {
            if (!hasPreviousToken) {
              return;
            }
            navigateToToken(props.token.id - 1);
          }}
          className="tw-inline-flex tw-h-10 tw-w-10 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-text-iron-200 tw-transition hover:tw-bg-iron-800 hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-40"
        >
          <FontAwesomeIcon
            icon={faChevronLeft}
            className="tw-h-4 tw-w-4"
            aria-hidden="true"
          />
        </button>
        {hasPreviousToken && (
          <Tooltip
            id={`prev-token-${props.token.id}`}
            delayShow={250}
            variant="light"
            className="!tw-px-2 !tw-py-1"
          >
            Previous Token
          </Tooltip>
        )}
      </>
    );
  }

  function printNextToken() {
    const hasNextToken = props.tokenCount - 1 > props.token.normalised_id;
    return (
      <>
        <button
          type="button"
          aria-label="Next token"
          disabled={!hasNextToken}
          {...(hasNextToken && {
            "data-tooltip-id": `next-token-${props.token.id}`,
          })}
          onClick={() => {
            if (!hasNextToken) {
              return;
            }
            navigateToToken(props.token.id + 1);
          }}
          className="tw-inline-flex tw-h-10 tw-w-10 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-text-iron-200 tw-transition hover:tw-bg-iron-800 hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-40"
        >
          <FontAwesomeIcon
            icon={faChevronRight}
            className="tw-h-4 tw-w-4"
            aria-hidden="true"
          />
        </button>
        {hasNextToken && (
          <Tooltip
            id={`next-token-${props.token.id}`}
            delayShow={250}
            variant="light"
            className="!tw-px-2 !tw-py-1"
          >
            Next Token
          </Tooltip>
        )}
      </>
    );
  }

  function navigateToToken(tokenId: number) {
    const viewPath =
      props.view === NextgenCollectionView.ABOUT
        ? ""
        : `/${props.view.toLowerCase().replaceAll(" ", "-")}`;
    const query = searchParams.toString();
    const pathname = `/nextgen/token/${tokenId}${viewPath}`;
    router.push(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  function printToken() {
    return (
      <div className="tw-mx-auto tw-w-full tw-max-w-[1400px] tw-px-4 tw-pb-12 md:tw-px-6 lg:tw-px-8">
        <section className="tw-py-6 sm:tw-py-8">
          <NextGenBackToCollectionPageLink collection={props.collection} />
          <div className="tw-mt-2 tw-flex tw-items-center tw-justify-between tw-gap-4">
            <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-3">
              <h1 className="tw-m-0 tw-truncate tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-3xl">
                {props.token.name}
              </h1>
              {(props.token.burnt || isNullAddress(props.token.owner)) && (
                <>
                  <FontAwesomeIcon
                    icon={faFire}
                    data-tooltip-id={`burnt-token-${props.token.id}`}
                    className="tw-h-6 tw-w-6 tw-flex-none tw-text-error"
                  />
                  <Tooltip
                    id={`burnt-token-${props.token.id}`}
                    className="!tw-bg-iron-900 !tw-px-2 !tw-py-1 !tw-text-white"
                  >
                    Burnt
                  </Tooltip>
                </>
              )}
            </div>
            <div
              className="tw-flex tw-flex-none tw-items-center tw-gap-2"
              aria-label="Browse collection tokens"
            >
              {printPreviousToken()}
              {printNextToken()}
            </div>
          </div>
        </section>

        <section aria-label={`${props.token.name} artwork`}>
          <NextGenTokenArt token={props.token} collection={props.collection} />
        </section>

        {printDetails()}
      </div>
    );
  }

  return <>{printToken()}</>;
}
