"use client";

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
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Tooltip } from "react-tooltip";
import { displayScore } from "./NextGenTokenProperties";

interface Props {
  collection: NextGenCollection;
  token: NextGenToken;
}

function DetailRow(
  props: Readonly<{
    label: string;
    children: ReactNode;
    stacked?: boolean | undefined;
  }>
) {
  return (
    <div
      className={`tw-grid tw-gap-1 tw-py-3 ${
        props.stacked
          ? ""
          : "sm:tw-grid-cols-[minmax(9rem,0.38fr)_minmax(0,0.62fr)] sm:tw-gap-4"
      }`}
    >
      <dt className="tw-text-sm tw-font-medium tw-text-iron-400">
        {props.label}:
      </dt>
      <dd className="tw-m-0 tw-min-w-0 tw-text-base tw-text-white">
        {props.children}
      </dd>
    </div>
  );
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

  const marketplaceLinkClassName =
    "tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-black/20 tw-px-3 tw-py-2.5 tw-text-white tw-no-underline tw-transition hover:tw-bg-white/5 hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";

  return (
    <section>
      <h3 className="tw-mb-3 tw-mt-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-white">
        Details
      </h3>
      <dl className="tw-m-0 tw-divide-y tw-divide-white/10">
        <DetailRow label="Collection Token ID">
          {props.token.normalised_id}
        </DetailRow>
        <DetailRow label="Contract Token ID">{props.token.id}</DetailRow>
        <DetailRow label="Minted">
          {printMintDate(props.token.mint_date)}
        </DetailRow>
        <DetailRow label="Mint Price">
          {props.token.mint_price ? (
            <span className="tw-flex tw-items-center">
              {props.token.mint_price}
              <span className="tw-flex tw-h-5 tw-w-5 tw-flex-none tw-items-center tw-justify-center tw-text-iron-50">
                <EthereumIcon />
              </span>
            </span>
          ) : (
            "Free"
          )}
        </DetailRow>
        <DetailRow label="Collector">
          <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
            {(props.token.burnt || isNullAddress(props.token.owner)) && (
              <>
                <FontAwesomeIcon
                  icon={faFire}
                  className="tw-h-[22px] tw-w-[22px] tw-text-error"
                  data-tooltip-id={`burnt-${props.token.id}`}
                />
                <Tooltip
                  id={`burnt-${props.token.id}`}
                  className="!tw-bg-iron-900 !tw-px-2 !tw-py-1 !tw-text-white"
                >
                  Burnt
                </Tooltip>
              </>
            )}
            {profile?.level ? (
              <Link
                href={`/${profile.handle ?? props.token.owner}`}
                className="tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-no-underline hover:tw-underline"
              >
                <UserCICAndLevel level={profile.level} />
                <span className="tw-break-all">
                  {profile.handle ??
                    profile.display ??
                    formatAddress(props.token.owner)}
                </span>
              </Link>
            ) : (
              <Link
                href={`/${profile?.handle ?? props.token.owner}`}
                className="tw-break-all"
              >
                {profile?.handle ??
                  profile?.display ??
                  formatAddress(props.token.owner)}
              </Link>
            )}
            {isOwner && <YouOwnNftBadge />}
          </span>
        </DetailRow>
        <DetailRow label="Collector TDH">
          {numberWithCommas(Math.round((profile?.tdh ?? 0) * 100) / 100)}
        </DetailRow>

        {(!capacitor.isIos || country === "US") && (
          <DetailRow label="Listed" stacked>
            <div className="tw-mt-2 tw-grid tw-grid-cols-1 tw-gap-2 sm:tw-grid-cols-3">
              <Link
                href={getOpenseaLink(NEXTGEN_CHAIN_ID, props.token.id)}
                target="_blank"
                rel="noopener noreferrer"
                className={marketplaceLinkClassName}
                data-tooltip-id={`opensea-${props.token.id}`}
              >
                <Image
                  unoptimized
                  className="tw-rounded-md"
                  src="/opensea.png"
                  alt="OpenSea"
                  width={24}
                  height={24}
                />
                {props.token.opensea_price > 0 ? (
                  <span className="tw-flex tw-items-center tw-gap-2">
                    <span className="tw-flex tw-items-center">
                      {props.token.opensea_price}
                      <span className="tw-flex tw-h-5 tw-w-5 tw-flex-none tw-items-center tw-justify-center tw-text-iron-50">
                        <EthereumIcon />
                      </span>
                    </span>
                    {props.token.opensea_royalty > 0 && (
                      <Image
                        unoptimized
                        width={30}
                        height={25}
                        src={`/${getRoyaltyImage(
                          props.token.opensea_royalty / 100
                        )}`}
                        alt={`${props.token.opensea_royalty}% royalty`}
                        className="tw-h-6 tw-w-auto"
                      />
                    )}
                  </span>
                ) : (
                  "Not listed"
                )}
              </Link>
              <Tooltip
                id={`opensea-${props.token.id}`}
                place="right"
                className="!tw-bg-iron-900 !tw-px-2 !tw-py-1 !tw-text-white"
              >
                OpenSea:{" "}
                {props.token.opensea_price > 0
                  ? `${props.token.opensea_price} ${ETHEREUM_ICON_TEXT}`
                  : "Not Listed"}
                {props.token.opensea_price > 0 && (
                  <div>Royalties: {props.token.opensea_royalty}%</div>
                )}
              </Tooltip>

              <Link
                href={getBlurLink(props.token.id)}
                target="_blank"
                rel="noopener noreferrer"
                className={marketplaceLinkClassName}
                data-tooltip-id={`blur-${props.token.id}`}
              >
                <Image
                  unoptimized
                  className="tw-rounded-md"
                  src="/blur.png"
                  alt="Blur"
                  width={24}
                  height={24}
                />
                {props.token.blur_price > 0 ? (
                  <span className="tw-flex tw-items-center">
                    {props.token.blur_price}
                    <span className="tw-flex tw-h-5 tw-w-5 tw-flex-none tw-items-center tw-justify-center tw-text-iron-50">
                      <EthereumIcon />
                    </span>
                  </span>
                ) : (
                  "Not listed"
                )}
              </Link>
              <Tooltip
                id={`blur-${props.token.id}`}
                place="right"
                className="!tw-bg-iron-900 !tw-px-2 !tw-py-1 !tw-text-white"
              >
                Blur:{" "}
                {props.token.blur_price > 0
                  ? `${props.token.blur_price} ${ETHEREUM_ICON_TEXT}`
                  : "Not Listed"}
              </Tooltip>

              <Link
                href={getMagicEdenLink(props.token.id)}
                target="_blank"
                rel="noopener noreferrer"
                className={marketplaceLinkClassName}
                data-tooltip-id={`magic-eden-${props.token.id}`}
              >
                <Image
                  unoptimized
                  className="tw-rounded-md"
                  src="/magiceden.png"
                  alt="Magic Eden"
                  width={24}
                  height={24}
                />
                {props.token.me_price > 0 ? (
                  <span className="tw-flex tw-items-center tw-gap-2">
                    <span className="tw-flex tw-items-center">
                      {props.token.me_price}
                      <span className="tw-flex tw-h-5 tw-w-5 tw-flex-none tw-items-center tw-justify-center tw-text-iron-50">
                        <EthereumIcon />
                      </span>
                    </span>
                    {props.token.me_royalty > 0 && (
                      <Image
                        unoptimized
                        width={30}
                        height={25}
                        src={`/${getRoyaltyImage(props.token.me_royalty / 100)}`}
                        alt={`${props.token.me_royalty}% royalty`}
                        className="tw-h-6 tw-w-auto"
                      />
                    )}
                  </span>
                ) : (
                  "Not listed"
                )}
              </Link>
              <Tooltip
                id={`magic-eden-${props.token.id}`}
                place="right"
                className="!tw-bg-iron-900 !tw-px-2 !tw-py-1 !tw-text-white"
              >
                Magic Eden:{" "}
                {props.token.me_price > 0
                  ? `${props.token.me_price} ${ETHEREUM_ICON_TEXT}`
                  : "Not Listed"}
                {props.token.me_price > 0 && (
                  <div>Royalties: {props.token.me_royalty}%</div>
                )}
              </Tooltip>
            </div>
          </DetailRow>
        )}

        <DetailRow label="Collection">
          <Link
            href={`/nextgen/collection/${formatNameForUrl(
              props.collection.name
            )}`}
          >
            {props.collection.name}
          </Link>
        </DetailRow>
        <DetailRow label="Artist">
          <Link href={`/${props.collection.artist_address}`}>
            {props.collection.artist}
          </Link>
        </DetailRow>
        <DetailRow label="TDH">
          <span className="tw-flex tw-flex-wrap tw-gap-x-5 tw-gap-y-1">
            <span>
              <span className="tw-text-iron-400">Rate:</span>{" "}
              {numberWithCommas(Math.round(props.token.hodl_rate * 100) / 100)}
            </span>
            <span>
              <span className="tw-text-iron-400">Total:</span>{" "}
              {numberWithCommas(Math.round(tdh * 100) / 100)}
            </span>
          </span>
        </DetailRow>
        <DetailRow label="Image Licence">{props.collection.licence}</DetailRow>
      </dl>
    </section>
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
          <span className="tw-text-sm tw-text-iron-400">Score</span>&nbsp;
          {displayScore(props.score)}
        </span>
        <span className="tw-text-iron-400">|</span>
        <span className="tw-flex tw-min-w-fit tw-items-center tw-whitespace-nowrap">
          <span className="tw-text-sm tw-text-iron-400">Rank</span>&nbsp;#
          {props.rank.toLocaleString()}
        </span>
      </span>
    </span>
  );
}
