"use client";

import styles from "../NextGen.module.css";

import { useAuth } from "@/components/auth/Auth";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import { NEXTGEN_CHAIN_ID } from "@/components/nextGen/nextgen_contracts";
import {
  formatNameForUrl,
  getBlurLink,
  getMagicEdenLink,
  getOpenseaLink,
} from "@/components/nextGen/nextgen_helpers";
import EthereumIcon from "@/components/user/utils/icons/EthereumIcon";
import UserCICAndLevel from "@/components/user/utils/UserCICAndLevel";
import YouOwnNftBadge from "@/components/you-own-nft-badge/YouOwnNftBadge";
import { ETHEREUM_ICON_TEXT } from "@/constants/constants";
import type { DBResponse } from "@/entities/IDBResponse";
import type { NextGenCollection, NextGenToken } from "@/entities/INextgen";
import {
  areEqualAddresses,
  formatAddress,
  getRoyaltyImage,
  isNullAddress,
  numberWithCommas,
  printMintDate,
} from "@/helpers/Helpers";
import useCapacitor from "@/hooks/useCapacitor";
import { useIdentity } from "@/hooks/useIdentity";
import { commonApiFetch } from "@/services/api/common-api";
import { faFire } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Tooltip } from "react-tooltip";
import { displayScore } from "./NextGenTokenProperties";

interface Props {
  collection: NextGenCollection;
  token: NextGenToken;
}

export default function NextgenTokenAbout(props: Readonly<Props>) {
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();
  const { connectedProfile } = useAuth();
  const [tdh, setTdh] = useState<number>(0);
  const { profile } = useIdentity({
    handleOrWallet: props.token.owner,
    initialProfile: null,
  });

  useEffect(() => {
    commonApiFetch<DBResponse>({
      endpoint: `nextgen/tdh?token_id=${props.token.id}`,
    }).then((result) => {
      if (result.data.length === 1) {
        setTdh(result.data[0].boosted_tdh);
      }
    });
  }, [props.token.owner, props.token.id]);

  const isOwner = useMemo(() => {
    return connectedProfile?.wallets?.some((w) =>
      areEqualAddresses(w.wallet, props.token.owner)
    );
  }, [props.token.owner, connectedProfile?.wallets]);

  return (
    <div className="tw-mx-auto tw-w-full !tw-p-0 tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3 tw-pb-4">
          <h3 className="tw-mb-0">About</h3>
        </div>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-gap-1 tw-px-3 tw-pb-4">
          <span className="tw-text-[#9a9a9a]">Collection Token ID:</span>
          <span>{props.token.normalised_id}</span>
        </div>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-gap-1 tw-px-3 tw-pb-4">
          <span className="tw-text-[#9a9a9a]">Contract Token ID:</span>
          <span>{props.token.id}</span>
        </div>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-gap-1 tw-px-3 tw-pb-4">
          <span className="tw-text-[#9a9a9a]">Minted:</span>
          <span>{printMintDate(props.token.mint_date)}</span>
        </div>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-gap-1 tw-px-3 tw-pb-4">
          <span className="tw-text-[#9a9a9a]">Mint Price:</span>
          <span>
            {props.token.mint_price ? (
              <span className="tw-flex tw-items-center">
                {props.token.mint_price}
                <div className="tw-flex tw-h-5 tw-w-5 tw-flex-shrink-0 tw-items-center tw-justify-center tw-text-iron-50">
                  <EthereumIcon />
                </div>
              </span>
            ) : (
              "Free"
            )}
          </span>
        </div>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-gap-2 tw-px-3 tw-pb-4">
          <span className="tw-text-[#9a9a9a]">Collector:</span>
          <span className="tw-flex tw-items-center tw-gap-1">
            {(props.token.burnt || isNullAddress(props.token.owner)) && (
              <>
                <FontAwesomeIcon
                  icon={faFire}
                  style={{ height: "22px", color: "#c51d34" }}
                  data-tooltip-id={`burnt-${props.token.id}`}
                />
                <Tooltip
                  id={`burnt-${props.token.id}`}
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
            {profile?.level ? (
              <Link
                href={`/${profile?.handle ?? props.token.owner}`}
                className="tw-flex tw-items-center tw-gap-2 tw-no-underline hover:tw-underline"
              >
                <UserCICAndLevel level={profile.level} />
                <span className="decoration-underline">
                  {profile?.handle ??
                    profile?.display ??
                    formatAddress(props.token.owner)}
                </span>
              </Link>
            ) : (
              <Link href={`/${profile?.handle ?? props.token.owner}`}>
                <span>
                  {profile?.handle ??
                    profile?.display ??
                    formatAddress(props.token.owner)}
                </span>
              </Link>
            )}
            {isOwner && <YouOwnNftBadge />}
          </span>
        </div>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-gap-2 tw-px-3 tw-pb-4">
          <span className="tw-text-[#9a9a9a]">Collector TDH:</span>
          <span className="tw-flex tw-items-center tw-gap-1">
            {numberWithCommas(Math.round((profile?.tdh ?? 0) * 100) / 100)}
          </span>
        </div>
      </div>
      {(!capacitor.isIos || country === "US") && (
        <div className="-tw-mx-3 tw-flex tw-flex-wrap">
          <div className="tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-flex-col tw-px-3 tw-pb-4">
            <span className="tw-text-[#9a9a9a]">Listed:</span>
            <span className="tw-flex tw-flex-col tw-items-start tw-gap-2 tw-pt-1">
              <span>
                <Link
                  href={getOpenseaLink(NEXTGEN_CHAIN_ID, props.token.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tw-flex tw-items-center tw-gap-2 tw-no-underline"
                  data-tooltip-id={`opensea-${props.token.id}`}
                >
                  <Image
                    unoptimized
                    className={styles["marketplace"]}
                    src="/opensea.png"
                    alt="opensea"
                    width={24}
                    height={24}
                  />
                  {props.token.opensea_price > 0 ? (
                    <span className="tw-flex tw-items-center tw-gap-2">
                      <span className="tw-flex tw-items-center">
                        <span>{props.token.opensea_price}</span>
                        <div className="tw-flex tw-h-5 tw-w-5 tw-flex-shrink-0 tw-items-center tw-justify-center tw-text-iron-50">
                          <EthereumIcon />
                        </div>
                      </span>
                      {props.token.opensea_royalty > 0 && (
                        <Image
                          unoptimized
                          width={0}
                          height={0}
                          style={{ height: "25px", width: "auto" }}
                          src={`/${getRoyaltyImage(
                            props.token.opensea_royalty / 100
                          )}`}
                          alt={"pepe"}
                          className="tw-cursor-pointer"
                        />
                      )}
                    </span>
                  ) : (
                    "No"
                  )}
                </Link>
                <Tooltip
                  id={`opensea-${props.token.id}`}
                  place="right"
                  style={{
                    backgroundColor: "#1F2937",
                    color: "white",
                    padding: "4px 8px",
                  }}
                >
                  <div className="tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
                    <div className="-tw-mx-3 tw-flex tw-flex-wrap">
                      <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
                        Opensea:{" "}
                        {props.token.opensea_price > 0
                          ? `${props.token.opensea_price} ${ETHEREUM_ICON_TEXT}`
                          : "Not Listed"}
                      </div>
                    </div>
                    {props.token.opensea_price > 0 && (
                      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
                        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
                          Royalties: {props.token.opensea_royalty}%
                        </div>
                      </div>
                    )}
                  </div>
                </Tooltip>
              </span>
              <span>
                <Link
                  href={getBlurLink(props.token.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tw-flex tw-items-center tw-gap-2 tw-no-underline"
                  data-tooltip-id={`blur-${props.token.id}`}
                >
                  <Image
                    unoptimized
                    className={styles["marketplace"]}
                    src="/blur.png"
                    alt="blur"
                    width={24}
                    height={24}
                  />
                  {props.token.blur_price > 0 ? (
                    <span className="tw-flex tw-items-center tw-gap-2">
                      <span className="tw-flex tw-items-center">
                        <span>{props.token.blur_price}</span>
                        <div className="tw-flex tw-h-5 tw-w-5 tw-flex-shrink-0 tw-items-center tw-justify-center tw-text-iron-50">
                          <EthereumIcon />
                        </div>
                      </span>
                    </span>
                  ) : (
                    "No"
                  )}
                </Link>
                <Tooltip
                  id={`blur-${props.token.id}`}
                  place="right"
                  style={{
                    backgroundColor: "#1F2937",
                    color: "white",
                    padding: "4px 8px",
                  }}
                >
                  <div className="tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
                    <div className="-tw-mx-3 tw-flex tw-flex-wrap">
                      <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
                        Blur:{" "}
                        {props.token.blur_price > 0
                          ? `${props.token.blur_price} ${ETHEREUM_ICON_TEXT}`
                          : "Not Listed"}
                      </div>
                    </div>
                  </div>
                </Tooltip>
              </span>
              <span>
                <Link
                  href={getMagicEdenLink(props.token.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tw-flex tw-items-center tw-gap-2 tw-no-underline"
                  data-tooltip-id={`magic-eden-${props.token.id}`}
                >
                  <Image
                    unoptimized
                    className={styles["marketplace"]}
                    src="/magiceden.png"
                    alt="magiceden"
                    width={24}
                    height={24}
                  />
                  {props.token.me_price > 0 ? (
                    <span className="tw-flex tw-items-center tw-gap-2">
                      <span className="tw-flex tw-items-center">
                        <span>{props.token.me_price}</span>
                        <div className="tw-flex tw-h-5 tw-w-5 tw-flex-shrink-0 tw-items-center tw-justify-center tw-text-iron-50">
                          <EthereumIcon />
                        </div>
                      </span>
                      {props.token.me_royalty > 0 && (
                        <Image
                          unoptimized
                          width={0}
                          height={0}
                          style={{ height: "25px", width: "auto" }}
                          src={`/${getRoyaltyImage(
                            props.token.me_royalty / 100
                          )}`}
                          alt={"pepe"}
                          className="tw-cursor-pointer"
                        />
                      )}
                    </span>
                  ) : (
                    "No"
                  )}
                </Link>
                <Tooltip
                  id={`magic-eden-${props.token.id}`}
                  place="right"
                  style={{
                    backgroundColor: "#1F2937",
                    color: "white",
                    padding: "4px 8px",
                  }}
                >
                  <div className="tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
                    <div className="-tw-mx-3 tw-flex tw-flex-wrap">
                      <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
                        Magic Eden:{" "}
                        {props.token.me_price > 0
                          ? `${props.token.me_price} ${ETHEREUM_ICON_TEXT}`
                          : "Not Listed"}
                      </div>
                    </div>
                    {props.token.me_price > 0 && (
                      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
                        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
                          Royalties: {props.token.me_royalty}%
                        </div>
                      </div>
                    )}
                  </div>
                </Tooltip>
              </span>
            </span>
          </div>
        </div>
      )}
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-gap-1 tw-px-3 tw-pb-4">
          <span className="tw-text-[#9a9a9a]">Collection:</span>
          <span>
            <Link
              href={`/nextgen/collection/${formatNameForUrl(
                props.collection.name
              )}`}
            >
              {props.collection.name}
            </Link>
          </span>
        </div>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-gap-1 tw-px-3 tw-pb-4">
          <span className="tw-text-[#9a9a9a]">Artist:</span>
          <span>
            <Link href={`/${props.collection.artist_address}`}>
              {props.collection.artist}
            </Link>
          </span>
        </div>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-gap-1 tw-px-3 tw-pb-4">
          <span className="tw-text-[#9a9a9a]">TDH Rate:</span>
          <span>
            {numberWithCommas(Math.round(props.token.hodl_rate * 100) / 100)}
          </span>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <span className="tw-text-[#9a9a9a]">TDH:</span>
          <span>{numberWithCommas(Math.round(tdh * 100) / 100)}</span>
        </div>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-gap-1 tw-px-3 tw-pb-4">
          <span className="tw-text-[#9a9a9a]">Image Licence:</span>
          <span>{props.collection.licence}</span>
        </div>
      </div>
    </div>
  );
}

export function TraitScore(
  props: Readonly<{
    score: number;
    rank: number;
    places?: number | undefined;
  }>
) {
  return (
    <span className="tw-flex tw-flex-col">
      <span className="tw-flex tw-gap-2">
        <span className="tw-flex tw-min-w-fit tw-items-center tw-whitespace-nowrap">
          <span className="tw-text-sm tw-text-[#9a9a9a]">Score</span>&nbsp;
          {displayScore(props.score)}
        </span>
        <span className="tw-text-[#9a9a9a]">|</span>
        <span className="tw-flex tw-min-w-fit tw-items-center tw-whitespace-nowrap">
          <span className="tw-text-sm tw-text-[#9a9a9a]">Rank</span>&nbsp;#
          {props.rank.toLocaleString()}
        </span>
      </span>
    </span>
  );
}
