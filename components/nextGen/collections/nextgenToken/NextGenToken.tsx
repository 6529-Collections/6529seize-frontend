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
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ContractType, NextgenCollectionView } from "@/types/enums";
import {
  faChevronCircleLeft,
  faChevronCircleRight,
  faFire,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { Tooltip } from "react-tooltip";
import { printViewButton } from "../collectionParts/NextGenCollection";
import { NextGenBackToCollectionPageLink } from "../collectionParts/NextGenCollectionHeader";
import styles from "../NextGen.module.css";
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
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { address: connectedAddress } = useSeizeConnectContext();

  const isConnectedAddressOwner = useMemo(() => {
    return areEqualAddresses(connectedAddress, props.token.owner);
  }, [props.token.owner, connectedAddress]);

  const isMdUp = useMediaQuery("(min-width: 768px)");

  const transferSingle = useMemo(() => {
    if (!isConnectedAddressOwner) {
      return null;
    }

    return (
      <div className="tw-mb-6">
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
      <div className="tw-pt-6 tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
        <div className="-tw-mx-3 tw-flex tw-flex-wrap">
          <div className="tw-flex tw-gap-6 tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
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
        </div>
        <div className="tw-pt-6 tw-pb-6 -tw-mx-3 tw-flex tw-flex-wrap">
          {props.view === NextgenCollectionView.ABOUT && (
            <>
              <div
                className="tw-relative tw-w-full tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3"
                style={{ maxWidth: "100%" }}
              >
                {isMdUp ? null : transferSingle}
              </div>
              <div
                className="tw-relative tw-w-full tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3 min-[576px]:tw-w-full min-[576px]:tw-shrink-0 min-[576px]:tw-grow-0 min-[576px]:tw-basis-auto md:tw-w-1/2 md:tw-shrink-0 md:tw-grow-0 md:tw-basis-auto"
                style={{ maxWidth: "100%" }}
              >
                <NextGenTokenAbout
                  collection={props.collection}
                  token={props.token}
                />
              </div>
              <div
                className="tw-relative tw-w-full tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3 min-[576px]:tw-w-full min-[576px]:tw-shrink-0 min-[576px]:tw-grow-0 min-[576px]:tw-basis-auto md:tw-w-1/2 md:tw-shrink-0 md:tw-grow-0 md:tw-basis-auto"
                style={{ maxWidth: "100%" }}
              >
                {isMdUp ? transferSingle : null}
                <NextgenTokenTraits
                  collection={props.collection}
                  token={props.token}
                  traits={props.traits.filter(
                    (trait) => trait.trait !== "Collection Name"
                  )}
                  tokenCount={props.tokenCount}
                />
              </div>
            </>
          )}
          {props.view === NextgenCollectionView.PROVENANCE && (
            <div className="tw-pt-6 tw-pb-6 tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
              <NextGenTokenProvenance
                token_id={props.token.id}
                collection={props.collection}
              />
            </div>
          )}
          {props.view === NextgenCollectionView.DISPLAY_CENTER && (
            <div className="tw-pt-6 tw-pb-6 tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
              <NextGenTokenRenderCenter token={props.token} />
            </div>
          )}
          {props.view === NextgenCollectionView.RARITY && (
            <div className="tw-pt-6 tw-pb-6 tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
              <NextgenTokenRarity
                collection={props.collection}
                token={props.token}
                traits={props.traits}
                tokenCount={props.tokenCount}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  function printPreviousToken() {
    const hasPreviousToken = props.token.normalised_id > 0;
    const prev = (
      <FontAwesomeIcon
        icon={faChevronCircleLeft}
        data-tooltip-id={
          hasPreviousToken ? `prev-token-${props.token.id}` : undefined
        }
        onClick={() => {
          if (!hasPreviousToken) {
            return;
          }
          const newPathname = pathname.replace(
            /\/(\d+)(\/?)$/,
            `/${props.token.id - 1}$2`
          );
          const query = searchParams.toString();
          router.push(query ? `${newPathname}?${query}` : newPathname, {
            scroll: false,
          });
        }}
        style={{
          height: "35px",
          color: hasPreviousToken ? "#fff" : "#9a9a9a",
          cursor: hasPreviousToken ? "pointer" : "default",
        }}
      />
    );
    return (
      <>
        {prev}
        {hasPreviousToken && (
          <Tooltip
            id={`prev-token-${props.token.id}`}
            delayShow={250}
            variant="light"
            style={{
              padding: "4px 8px",
            }}
          >
            Previous Token
          </Tooltip>
        )}
      </>
    );
  }

  function printNextToken() {
    const hasNextToken = props.tokenCount - 1 > props.token.normalised_id;
    const next = (
      <FontAwesomeIcon
        icon={faChevronCircleRight}
        data-tooltip-id={
          hasNextToken ? `next-token-${props.token.id}` : undefined
        }
        onClick={() => {
          if (!hasNextToken) {
            return;
          }
          const newPathname = pathname.replace(
            /\/(\d+)(\/?)$/,
            `/${props.token.id + 1}$2`
          );
          const query = searchParams.toString();
          router.push(query ? `${newPathname}?${query}` : newPathname, {
            scroll: false,
          });
        }}
        style={{
          height: "35px",
          color: hasNextToken ? "#fff" : "#9a9a9a",
          cursor: hasNextToken ? "pointer" : "default",
        }}
      />
    );
    return (
      <>
        {next}
        {hasNextToken && (
          <Tooltip
            id={`next-token-${props.token.id}`}
            delayShow={250}
            variant="light"
            style={{
              padding: "4px 8px",
            }}
          >
            Next Token
          </Tooltip>
        )}
      </>
    );
  }

  function printToken() {
    return (
      <>
        <div
          className={`tw-w-full tw-max-w-none ${styles["tokenContainer"]} tw-pt-6 tw-pb-6`}
        >
          <div className="-tw-mx-3 tw-flex tw-flex-wrap">
            <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
              <div className="tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
                <div className="tw-pb-2 -tw-mx-3 tw-flex tw-flex-wrap">
                  <div className="tw-flex tw-items-center tw-justify-between tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
                    <span className="tw-flex tw-flex-col">
                      <span className="tw-flex tw-gap-4">
                        <h1 className="tw-mb-0 tw-text-white">{props.token.name}</h1>
                        {(props.token.burnt ||
                          isNullAddress(props.token.owner)) && (
                          <>
                            <FontAwesomeIcon
                              icon={faFire}
                              data-tooltip-id={`burnt-token-${props.token.id}`}
                              style={{ height: "35px", color: "#c51d34" }}
                            />
                            <Tooltip
                              id={`burnt-token-${props.token.id}`}
                              style={{
                                backgroundColor: "#1F2937",
                                color: "white",
                                padding: "4px 8px",
                              }}
                            >
                              Burnt
                            </Tooltip>
                          </>
                        )}
                      </span>
                      <NextGenBackToCollectionPageLink
                        collection={props.collection}
                      />
                    </span>
                    <span className="tw-flex tw-gap-2">
                      {printPreviousToken()}
                      {printNextToken()}
                    </span>
                  </div>
                </div>
              </div>
              <NextGenTokenArt
                token={props.token}
                collection={props.collection}
              />
            </div>
          </div>
        </div>
        {printDetails()}
      </>
    );
  }

  return <>{printToken()}</>;
}
