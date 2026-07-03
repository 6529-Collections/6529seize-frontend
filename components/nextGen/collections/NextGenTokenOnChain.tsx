"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useEnsName, useReadContract } from "wagmi";
import type { NextGenCollection } from "@/entities/INextgen";
import DotLoader from "@/components/dotLoader/DotLoader";
import { NEXTGEN_CHAIN_ID, NEXTGEN_CORE } from "../nextgen_contracts";
import styles from "./NextGen.module.css";

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
    const data = tokenUriRead.data;
    if (data) {
      const tokenUri = data as string;
      setTokenMetadataUrl(tokenUri);
      fetch(tokenUri).then((meta) => {
        meta.json().then((metaJson) => {
          setTokenImage(metaJson.image);
        });
      });
    } else {
      setTokenNotFound(true);
    }
    setFetchingMetadata(false);
  }, [tokenUriRead.data]);

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
    const data = ownerRead.data as any;
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

  function printToken() {
    return (
      <>
        <div
          className={`tw-w-full tw-max-w-none ${styles["tokenContainer"]} tw-pt-6 tw-pb-6`}
        >
          <div className="-tw-mx-3 tw-flex tw-flex-wrap">
            <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
              <div className="tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
                <div className="-tw-mx-3 tw-flex tw-flex-wrap">
                  <div className="tw-flex tw-items-center tw-justify-between tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
                    <h2 className="tw-mb-0">{tokenName}</h2>
                  </div>
                </div>
                <div className="tw-pt-6 -tw-mx-3 tw-flex tw-flex-wrap">
                  <div className="tw-text-center tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
                    <Image
                      unoptimized
                      priority
                      loading={"eager"}
                      width="0"
                      height="0"
                      style={{
                        height: "auto",
                        width: "auto",
                        maxHeight: "90vh",
                        maxWidth: "100%",
                      }}
                      src={tokenImage}
                      alt={tokenName}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="tw-pt-4 tw-pb-4 tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
          <div className="-tw-mx-3 tw-flex tw-flex-wrap">
            <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
              <h4>About</h4>
            </div>
          </div>
          <div className="-tw-mx-3 tw-flex tw-flex-wrap">
            <div className="tw-flex tw-items-center tw-gap-12 tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
              <span className="tw-pt-1 tw-pb-1 tw-flex tw-flex-col">
                <span className="tw-text-[#9a9a9a]">Token ID</span>
                <span>#{props.token_id}</span>
              </span>
              <span className="tw-pt-1 tw-pb-1 tw-flex tw-flex-col">
                <span className="tw-text-[#9a9a9a]">Collection</span>
                <Link
                  href={`/nextgen/collection/${formatNameForUrl(
                    props.collection.name
                  )}`}
                >
                  {props.collection.name}
                </Link>
              </span>
              <span className="tw-pt-1 tw-pb-1 tw-flex tw-flex-col">
                <span className="tw-text-[#9a9a9a]">Artist</span>
                <Link href={`/${props.collection.artist_address}`}>
                  {props.collection.artist}
                </Link>
              </span>
              <span className="tw-pt-1 tw-pb-1 tw-flex tw-flex-col">
                <span className="tw-text-[#9a9a9a]">Owner</span>
                <span className="tw-flex">
                  <Address
                    wallets={[owner as `0x${string}`]}
                    display={profile?.handle ?? ownerENS}
                  />
                  {areEqualAddresses(owner, account.address) && (
                    <span>(you)</span>
                  )}
                </span>
              </span>
              <span className="tw-pt-1 tw-pb-1 tw-flex tw-flex-col">
                <span className="tw-text-[#9a9a9a]">Metadata</span>
                <span className="tw-flex tw-items-center tw-gap-1">
                  <span>
                    {props.collection.on_chain ? "On-Chain" : "Off-Chain"}{" "}
                    <Link
                      href={tokenMetadataUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FontAwesomeIcon
                        className={styles["copyIcon"]}
                        icon={faExternalLinkSquare}
                      ></FontAwesomeIcon>
                    </Link>
                  </span>
                </span>
              </span>
              {(!capacitor.isIos || country === "US") && (
                <span className="tw-pt-1 tw-pb-1 tw-flex tw-flex-col">
                  <span className="tw-text-[#9a9a9a]">Marketplaces</span>
                  <span className="tw-flex tw-gap-6">
                    <>
                      <Link
                        href={getOpenseaLink(NEXTGEN_CHAIN_ID, props.token_id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-tooltip-id={`opensea-${props.token_id}`}
                      >
                        <Image
                          unoptimized
                          className={styles["marketplace"]}
                          src="/opensea.png"
                          alt="opensea"
                          width={28}
                          height={28}
                        />
                      </Link>
                      <Tooltip
                        id={`opensea-${props.token_id}`}
                        content="Opensea"
                        delayShow={250}
                        style={{
                          backgroundColor: "#1F2937",
                          color: "white",
                          padding: "4px 8px",
                        }}
                      />
                    </>
                  </span>
                </span>
              )}
            </div>
          </div>
          <div className="tw-pt-4 -tw-mx-3 tw-flex tw-flex-wrap">
            <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
              <b>
                Token Indexing, check back later <DotLoader />
              </b>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (fetchingMetadata || tokenNotFound || !tokenImage) {
    return (
      <div className="tw-pt-12 tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
        <div className="-tw-mx-3 tw-flex tw-flex-wrap">
          <div className="tw-text-center tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
            <h4 className="tw-mb-0">
              {tokenNotFound ? (
                <>Token Not Found</>
              ) : (
                <>
                  Fetching Token <DotLoader />
                </>
              )}
            </h4>
          </div>
        </div>
      </div>
    );
  }

  return printToken();
}
