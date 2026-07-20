"use client";

import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import DateCountdown from "@/components/date-countdown/DateCountdown";
import DotLoader from "@/components/dotLoader/DotLoader";
import { NEXTGEN_CHAIN_ID } from "@/components/nextGen/nextgen_contracts";
import type { CollectionWithMerkle } from "@/components/nextGen/nextgen_entities";
import { AllowlistType, Status } from "@/components/nextGen/nextgen_entities";
import {
  formatNameForUrl,
  getBlurCollectionLink,
  getMagicEdenCollectionLink,
  getOpenseaLink,
  getStatusFromDates,
  useCollectionMintCount,
} from "@/components/nextGen/nextgen_helpers";
import { publicEnv } from "@/config/env";
import type { NextGenCollection } from "@/entities/INextgen";
import { numberWithCommas } from "@/helpers/Helpers";
import useCapacitor from "@/hooks/useCapacitor";
import { fetchUrl } from "@/services/6529api";
import { faArrowCircleLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DistributionLink } from "../NextGen";

const ACTION_LINK_CLASSES =
  "tw-inline-flex tw-min-h-11 tw-w-full tw-min-w-fit tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-lg tw-bg-white tw-px-5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-950 tw-no-underline tw-transition tw-duration-200 hover:tw-bg-iron-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";

const PHASE_TAG_BASE_CLASSES =
  "tw-inline-flex tw-min-h-7 tw-items-center tw-rounded-full tw-border tw-border-solid tw-bg-black/40 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-tracking-wide";

interface Props {
  collection: NextGenCollection;
  collection_link?: boolean | undefined;
  compact?: boolean | undefined;
  contained?: boolean | undefined;
  show_links?: boolean | undefined;
}

interface CountdownProps {
  collection: NextGenCollection;
}

interface PhaseProps {
  collection: NextGenCollection;
  available: number;
}

export function NextGenBackToCollectionPageLink(
  props: Readonly<{ collection: NextGenCollection }>
) {
  const pathname = usePathname() || "";
  const isArtPage =
    pathname.endsWith("/art") ||
    pathname.endsWith("/trait-sets") ||
    pathname.endsWith("/distribution-plan") ||
    pathname.endsWith("/mint");
  const content = isArtPage
    ? "Back to collection page"
    : "Back to collection art";

  const link = `/nextgen/collection/${formatNameForUrl(props.collection.name)}${
    isArtPage ? "" : "/art"
  }`;

  return (
    <Link
      href={link}
      className="tw-flex tw-items-center tw-gap-2 tw-pb-2 tw-pt-2 tw-no-underline"
    >
      <FontAwesomeIcon
        icon={faArrowCircleLeft}
        className="tw-h-[18px] tw-w-[18px]"
        aria-hidden="true"
      />
      {content}
    </Link>
  );
}

export function NextGenCountdown(props: Readonly<CountdownProps>) {
  const pathname = usePathname() || "";
  const alStatus = getStatusFromDates(
    props.collection.allowlist_start,
    props.collection.allowlist_end
  );
  const publicStatus = getStatusFromDates(
    props.collection.public_start,
    props.collection.public_end
  );

  const [collection, setCollection] = useState<CollectionWithMerkle>();
  const [collectionLoaded, setCollectionLoaded] = useState(false);

  useEffect(() => {
    const url = `${publicEnv.API_ENDPOINT}/api/nextgen/merkle_roots/${props.collection.merkle_root}`;
    fetchUrl<CollectionWithMerkle>(url).then(
      (response: CollectionWithMerkle) => {
        if (response) {
          setCollection(response);
        }
        setCollectionLoaded(true);
      }
    );
  }, [props.collection]);

  function getButtonLabel() {
    if (collectionLoaded) {
      if (collection && collection.al_type === AllowlistType.EXTERNAL_BURN) {
        return "BURN TO MINT";
      }
      return "MINT";
    }
    return <DotLoader />;
  }

  function printCountdown(title: string, date: number) {
    const pathParts = pathname.split("/");
    const hideMintBtn = pathParts[pathParts.length - 1] === "mint";

    return (
      <div className="tw-flex tw-w-full tw-flex-col tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/90 tw-px-5 tw-py-4 tw-text-white tw-shadow-lg">
        <DateCountdown title={`${title} in`} date={new Date(date * 1000)} />
        {!hideMintBtn && (
          <Link
            href={`/nextgen/collection/${formatNameForUrl(
              props.collection.name
            )}/mint`}
            className={ACTION_LINK_CLASSES}
            aria-label={collectionLoaded ? undefined : "Loading mint details"}
          >
            {getButtonLabel()}
          </Link>
        )}
        <DistributionLink collection={props.collection} />
      </div>
    );
  }

  return (
    <>
      {alStatus == Status.UPCOMING &&
        printCountdown("Allowlist Starting", props.collection.allowlist_start)}
      {alStatus == Status.LIVE &&
        printCountdown("Allowlist Ending", props.collection.allowlist_end)}
      {alStatus != Status.LIVE &&
        alStatus != Status.UPCOMING &&
        publicStatus == Status.UPCOMING &&
        printCountdown("Public Phase Starting", props.collection.public_start)}
      {publicStatus == Status.LIVE &&
        printCountdown("Public Phase Ending", props.collection.public_end)}
    </>
  );
}

export function NextGenPhases(props: Readonly<PhaseProps>) {
  const alStatus = getStatusFromDates(
    props.collection.allowlist_start,
    props.collection.allowlist_end
  );
  const publicStatus = getStatusFromDates(
    props.collection.public_start,
    props.collection.public_end
  );

  function getAllowlistClassName() {
    if (alStatus === Status.LIVE && props.available > 0) {
      return "tw-border-success/70 tw-text-success";
    } else if (alStatus === Status.UPCOMING && props.available > 0) {
      return "tw-border-amber-400/70 tw-text-amber-300";
    } else {
      return "tw-border-iron-500 tw-text-iron-300";
    }
  }

  function getPublicStatusClassName() {
    if (publicStatus === Status.LIVE && props.available > 0) {
      return "tw-border-success/70 tw-text-success";
    } else if (publicStatus === Status.UPCOMING && props.available > 0) {
      return "tw-border-amber-400/70 tw-text-amber-300";
    } else {
      return "tw-border-iron-500 tw-text-iron-300";
    }
  }

  return (
    <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-pb-2 tw-pt-2">
      {alStatus !== Status.UNAVAILABLE && (
        <span
          className={`${PHASE_TAG_BASE_CLASSES} ${getAllowlistClassName()}`}
        >
          ALLOWLIST {alStatus}
        </span>
      )}
      {publicStatus !== Status.UNAVAILABLE && (
        <span
          className={`${PHASE_TAG_BASE_CLASSES} ${getPublicStatusClassName()}`}
        >
          PUBLIC PHASE {publicStatus}
        </span>
      )}
    </span>
  );
}

export default function NextGenCollectionHeader(props: Readonly<Props>) {
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();
  const [available, setAvailable] = useState<number>(0);

  function showMint() {
    if (props.collection.mint_count == props.collection.total_supply) {
      return false;
    }

    const now = new Date().getTime() / 1000;
    const allowlistStartsIn = props.collection.allowlist_start - now;
    if (allowlistStartsIn > 0 && allowlistStartsIn < 1000 * 60 * 60 * 24) {
      return true;
    }
    const publicStartsIn = props.collection.public_start - now;
    if (publicStartsIn > 0 && publicStartsIn < 1000 * 60 * 60 * 24) {
      return true;
    }
    return (
      (now >= props.collection.allowlist_start &&
        props.collection.allowlist_end > now) ||
      (now >= props.collection.public_start &&
        props.collection.public_end > now)
    );
  }

  return (
    <div
      className={
        props.contained === false
          ? "tw-w-full"
          : "tw-mx-auto tw-w-full tw-max-w-[1400px] tw-px-4 md:tw-px-6 lg:tw-px-8"
      }
    >
      <div
        className={
          props.compact
            ? "tw-flex tw-flex-col tw-items-start tw-gap-2 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between"
            : "tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3"
        }
      >
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1">
          <NextGenPhases collection={props.collection} available={available} />
          {props.compact && (
            <span className="tw-whitespace-nowrap tw-text-sm tw-text-iron-300">
              <NextGenMintCounts
                collection={props.collection}
                setAvailable={setAvailable}
              />
            </span>
          )}
        </div>
        {props.show_links && (!capacitor.isIos || country === "US") && (
          <div className="tw-flex tw-items-center tw-justify-end tw-gap-2 tw-py-2">
            <Link
              href={
                props.collection.opensea_link ||
                getOpenseaLink(NEXTGEN_CHAIN_ID)
              }
              target="_blank"
              rel="noopener noreferrer"
              className="tw-rounded-md focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              <Image
                unoptimized
                className="tw-rounded-md tw-transition-opacity hover:tw-opacity-75"
                src="/opensea.png"
                alt="opensea"
                width={32}
                height={32}
              />
            </Link>
            <Link
              href={getBlurCollectionLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="tw-rounded-md focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              <Image
                unoptimized
                className="tw-rounded-md tw-transition-opacity hover:tw-opacity-75"
                src="/blur.png"
                alt="blur"
                width={32}
                height={32}
              />
            </Link>
            <Link
              href={getMagicEdenCollectionLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="tw-rounded-md focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              <Image
                unoptimized
                className="tw-rounded-md tw-transition-opacity hover:tw-opacity-75"
                src="/magiceden.png"
                alt="magiceden"
                width={32}
                height={32}
              />
            </Link>
          </div>
        )}
      </div>

      <div
        className={`tw-grid ${props.compact ? "tw-gap-4" : "tw-gap-6 tw-pt-4"} ${
          showMint() ? "md:tw-grid-cols-2" : ""
        }`}
      >
        {props.compact ? (
          <div className="tw-min-w-0">
            <h1 className="tw-m-0 tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-3xl">
              {props.collection.name}{" "}
              <span className="tw-text-base tw-font-normal tw-text-iron-200 sm:tw-text-lg">
                by{" "}
                <Link
                  href={`/${props.collection.artist_address}`}
                  className="tw-font-semibold tw-text-white"
                >
                  {props.collection.artist}
                </Link>
              </span>
            </h1>
          </div>
        ) : (
          <div className="tw-flex tw-min-w-0 tw-flex-col tw-items-start tw-gap-4">
            <span className="tw-flex tw-flex-col tw-items-start">
              <h1 className="tw-mb-0 tw-text-white">{props.collection.name}</h1>
              {props.collection_link && (
                <NextGenBackToCollectionPageLink
                  collection={props.collection}
                />
              )}
            </span>
            <span className="tw-text-lg">
              by{" "}
              <b>
                <Link href={`/${props.collection.artist_address}`}>
                  {props.collection.artist}
                </Link>
              </b>
            </span>
            <span className="tw-inline-flex tw-items-center tw-pt-2 tw-text-lg">
              <NextGenMintCounts
                collection={props.collection}
                setAvailable={setAvailable}
              />
            </span>
          </div>
        )}
        {showMint() && (
          <div className="tw-flex tw-w-full tw-max-w-full tw-flex-col tw-items-center">
            <NextGenCountdown collection={props.collection} />
          </div>
        )}
      </div>
    </div>
  );
}

export function NextGenMintCounts(
  props: Readonly<{
    collection: NextGenCollection;
    setAvailable?(available: number): void;
    shouldRefetchMintCounts?: boolean | undefined;
    setShouldRefetchMintCounts?(shouldRefetchMintCounts: boolean): void;
  }>
) {
  const [enableRefresh, setEnableRefresh] = useState<boolean>(true);
  const [available, setAvailable] = useState<number>(0);

  const collectionMintCount = useCollectionMintCount(
    props.collection.id,
    enableRefresh
  );
  const [mintCount, setMintCount] = useState<number>(0);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (props.shouldRefetchMintCounts) {
      collectionMintCount.refetch().then(() => {
        if (props.setShouldRefetchMintCounts) {
          props.setShouldRefetchMintCounts(false);
        }
      });
    }
  }, [props.shouldRefetchMintCounts]);

  useEffect(() => {
    setIsLoading(collectionMintCount.isFetching);
  }, [collectionMintCount.isFetching]);

  useEffect(() => {
    const mintC = parseInt(String(collectionMintCount.data));
    setMintCount(mintC);
    const avail = props.collection.total_supply - mintC;
    setAvailable(avail);
    setEnableRefresh(avail > 0);
    if (props.setAvailable) {
      props.setAvailable(avail);
    }
  }, [collectionMintCount.data]);

  return (
    <span>
      {mintCount > 0 ? numberWithCommas(mintCount) : mintCount} /{" "}
      {numberWithCommas(props.collection.total_supply)} minted
      {available > 0 && ` | ${numberWithCommas(available)} remaining`}
      {isLoading && (
        <>
          &nbsp;
          <DotLoader />
        </>
      )}
    </span>
  );
}
