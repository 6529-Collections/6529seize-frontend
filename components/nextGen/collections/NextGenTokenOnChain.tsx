"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useEnsName, useReadContract } from "wagmi";
import type { NextGenCollection } from "@/entities/INextgen";
import DotLoader from "@/components/dotLoader/DotLoader";
import { NEXTGEN_CHAIN_ID, NEXTGEN_CORE } from "../nextgen_contracts";

import { faExternalLinkSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { Tooltip } from "react-tooltip";
import { mainnet } from "viem/chains";
import { areEqualAddresses } from "@/helpers/Helpers";
import useCapacitor from "@/hooks/useCapacitor";
import { useIdentity } from "@/hooks/useIdentity";
import Address from "@/components/address/Address";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import { formatNameForUrl, getOpenseaLink } from "../nextgen_helpers";
import { NextGenBackToCollectionPageLink } from "./collectionParts/NextGenCollectionHeader";

interface Props {
  collection: NextGenCollection;
  token_id: number;
}

export default function NextGenTokenOnChain(props: Readonly<Props>) {
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();
  const account = useSeizeConnectContext();

  const [owner, setOwner] = useState<`0x${string}`>();
  const [ownerENS, setOwnerENS] = useState<string>();

  const [fetchingMetadata, setFetchingMetadata] = useState<boolean>(true);
  const [tokenNotFound, setTokenNotFound] = useState<boolean>(false);
  const [tokenMetadataUrl, setTokenMetadataUrl] = useState<string>("");
  const [tokenImage, setTokenImage] = useState<string>("");

  const normalisedTokenId = props.token_id - props.collection.id * 10000000000;
  const tokenName = `${props.collection.name} #${normalisedTokenId}`;

  const tokenUriRead = useReadContract({
    address: NEXTGEN_CORE[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "tokenURI",
    query: {
      refetchInterval: 10000,
    },
    args: [props.token_id],
  });

  useEffect(() => {
    if (tokenUriRead.isLoading) {
      return undefined;
    }

    const data = tokenUriRead.data;
    if (data) {
      const tokenUri = data as string;
      setTokenMetadataUrl(tokenUri);
      setTokenNotFound(false);
      setFetchingMetadata(true);

      const controller = new AbortController();
      const fetchMetadata = async () => {
        try {
          const response = await fetch(tokenUri, { signal: controller.signal });
          const metadata = (await response.json()) as { image?: unknown };
          if (typeof metadata.image !== "string" || !metadata.image) {
            setTokenNotFound(true);
            return;
          }
          setTokenImage(metadata.image);
        } catch {
          if (!controller.signal.aborted) {
            setTokenNotFound(true);
          }
        } finally {
          if (!controller.signal.aborted) {
            setFetchingMetadata(false);
          }
        }
      };

      void fetchMetadata();
      return () => controller.abort();
    }

    setTokenNotFound(true);
    setFetchingMetadata(false);
    return undefined;
  }, [tokenUriRead.data, tokenUriRead.isLoading]);

  const ownerRead = useReadContract({
    address: NEXTGEN_CORE[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "ownerOf",
    query: {
      refetchInterval: 10000,
    },
    args: [props.token_id],
  });

  useEffect(() => {
    const data = ownerRead.data as `0x${string}` | undefined;
    if (data) {
      setOwner(data);
    }
  }, [ownerRead.data]);

  const ownerENSRead = useEnsName({
    address: owner,
    chainId: mainnet.id,
  });

  useEffect(() => {
    const data = ownerENSRead.data;
    if (data) {
      setOwnerENS(data);
    }
  }, [ownerENSRead.data]);

  const { profile } = useIdentity({
    handleOrWallet: owner,
    initialProfile: null,
  });

  if (fetchingMetadata || tokenNotFound || !tokenImage) {
    return (
      <div className="tw-mx-auto tw-w-full tw-max-w-[1400px] tw-px-4 tw-pb-12 md:tw-px-6 lg:tw-px-8">
        <section className="tw-py-6 sm:tw-py-8">
          <NextGenBackToCollectionPageLink collection={props.collection} />
          <h1 className="tw-mb-0 tw-mt-2 tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-3xl">
            {tokenName}
          </h1>
        </section>
        <div
          aria-live="polite"
          className="tw-flex tw-min-h-48 tw-items-center tw-justify-center tw-text-center"
        >
          <div className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-300">
            {tokenNotFound ? (
              "Token not found"
            ) : (
              <>
                Fetching token <DotLoader />
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-mx-auto tw-w-full tw-max-w-[1400px] tw-px-4 tw-pb-12 md:tw-px-6 lg:tw-px-8">
      <section className="tw-py-6 sm:tw-py-8">
        <NextGenBackToCollectionPageLink collection={props.collection} />
        <h1 className="tw-mb-0 tw-mt-2 tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-3xl">
          {tokenName}
        </h1>
      </section>

      <section
        aria-label={`${tokenName} artwork`}
        className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/80"
      >
        <div className="tw-flex tw-min-h-72 tw-items-center tw-justify-center tw-bg-black tw-p-4 sm:tw-p-6">
          <Image
            unoptimized
            priority
            width={1600}
            height={1600}
            className="tw-h-auto tw-max-h-[80vh] tw-w-auto tw-max-w-full tw-object-contain"
            src={tokenImage}
            alt={tokenName}
          />
        </div>
      </section>

      <section className="tw-pt-6">
        <h2 className="tw-mb-5 tw-mt-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-2xl">
          About
        </h2>
        <div className="tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/80 tw-p-4 sm:tw-p-5">
          <dl className="tw-m-0 tw-grid tw-gap-5 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
            <div className="tw-min-w-0">
              <dt className="tw-text-sm tw-font-semibold tw-text-iron-400">
                Token ID
              </dt>
              <dd className="tw-m-0 tw-mt-1 tw-text-base tw-text-white">
                #{props.token_id}
              </dd>
            </div>
            <div className="tw-min-w-0">
              <dt className="tw-text-sm tw-font-semibold tw-text-iron-400">
                Collection
              </dt>
              <dd className="tw-m-0 tw-mt-1 tw-text-base">
                <Link
                  href={`/nextgen/collection/${formatNameForUrl(
                    props.collection.name
                  )}`}
                  className="tw-text-white"
                >
                  {props.collection.name}
                </Link>
              </dd>
            </div>
            <div className="tw-min-w-0">
              <dt className="tw-text-sm tw-font-semibold tw-text-iron-400">
                Artist
              </dt>
              <dd className="tw-m-0 tw-mt-1 tw-text-base">
                <Link
                  href={`/${props.collection.artist_address}`}
                  className="tw-text-white"
                >
                  {props.collection.artist}
                </Link>
              </dd>
            </div>
            <div className="tw-min-w-0">
              <dt className="tw-text-sm tw-font-semibold tw-text-iron-400">
                Owner
              </dt>
              <dd className="tw-m-0 tw-mt-1 tw-flex tw-min-w-0 tw-items-center tw-gap-1 tw-text-base tw-text-white">
                <Address
                  wallets={[owner as `0x${string}`]}
                  display={profile?.handle ?? ownerENS}
                />
                {areEqualAddresses(owner, account.address) && <span>(you)</span>}
              </dd>
            </div>
            <div className="tw-min-w-0">
              <dt className="tw-text-sm tw-font-semibold tw-text-iron-400">
                Metadata
              </dt>
              <dd className="tw-m-0 tw-mt-1 tw-flex tw-items-center tw-gap-2 tw-text-base tw-text-white">
                <span>
                  {props.collection.on_chain ? "On-chain" : "Off-chain"}
                </span>
                <Link
                  href={tokenMetadataUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${tokenName} metadata in a new tab`}
                  className="tw-inline-flex tw-rounded-md tw-text-iron-300 hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                >
                  <FontAwesomeIcon
                    className="tw-h-4 tw-w-4"
                    icon={faExternalLinkSquare}
                    aria-hidden="true"
                  />
                </Link>
              </dd>
            </div>
            {(!capacitor.isIos || country === "US") && (
              <div className="tw-min-w-0">
                <dt className="tw-text-sm tw-font-semibold tw-text-iron-400">
                  Marketplaces
                </dt>
                <dd className="tw-m-0 tw-mt-1">
                  <Link
                    href={getOpenseaLink(NEXTGEN_CHAIN_ID, props.token_id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`View ${tokenName} on OpenSea`}
                    data-tooltip-id={`opensea-${props.token_id}`}
                    className="tw-inline-flex tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-1.5 tw-transition hover:tw-bg-iron-800 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                  >
                    <Image
                      unoptimized
                      src="/opensea.png"
                      alt="OpenSea"
                      width={28}
                      height={28}
                      className="tw-rounded-md"
                    />
                  </Link>
                  <Tooltip
                    id={`opensea-${props.token_id}`}
                    content="OpenSea"
                    delayShow={250}
                    variant="light"
                  />
                </dd>
              </div>
            )}
          </dl>
          <div className="tw-mt-5 tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-5">
            <div className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-300">
              Token indexing is still in progress. Check back later for the
              complete token details. <DotLoader />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
