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
import { useSetTitle } from "@/contexts/TitleContext";
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
import styles from "../NextGen.module.scss";

interface Props {
  collection: NextGenCollection;
  collection_link?: boolean | undefined;
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
  const pathname = window?.location.pathname;
  const isArtPage =
    (pathname.endsWith("/art") ||
      pathname.endsWith("/trait-sets") ||
      pathname.endsWith("/distribution-plan")) ??
    false;
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
        className={styles["backIcon"]}
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
      <span className={styles["countdownContainer"]}>
        <DateCountdown title={`${title} in`} date={new Date(date * 1000)} />
        {!hideMintBtn && (
          <Link
            href={`/nextgen/collection/${formatNameForUrl(
              props.collection.name
            )}/mint`}
          >
            <button
              className={`tw-w-full tw-min-w-fit tw-whitespace-nowrap tw-pb-2 tw-pt-2 ${styles["exploreBtn"]}`}
            >
              {getButtonLabel()}
            </button>
          </Link>
        )}
        <DistributionLink collection={props.collection} />
      </span>
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
      return styles["phaseTimeTagActive"];
    } else if (alStatus === Status.UPCOMING && props.available > 0) {
      return styles["phaseTimeTagUpcoming"];
    } else {
      return styles["phaseTimeTagComplete"];
    }
  }

  function getPublicStatusClassName() {
    if (publicStatus === Status.LIVE && props.available > 0) {
      return styles["phaseTimeTagActive"];
    } else if (publicStatus === Status.UPCOMING && props.available > 0) {
      return styles["phaseTimeTagUpcoming"];
    } else {
      return styles["phaseTimeTagComplete"];
    }
  }

  return (
    <span className="tw-flex tw-items-center tw-gap-2 tw-pb-2 tw-pt-2">
      {alStatus !== Status.UNAVAILABLE && (
        <span
          className={`tw-flex tw-items-center tw-text-sm tw-font-bold ${
            styles["nextgenTag"]
          } ${getAllowlistClassName()}`}
        >
          ALLOWLIST {alStatus}
        </span>
      )}
      {publicStatus !== Status.UNAVAILABLE && (
        <span
          className={`tw-flex tw-items-center tw-text-sm tw-font-bold ${
            styles["nextgenTag"]
          } ${getPublicStatusClassName()}`}
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
    <div className="tw-mx-auto tw-w-full !tw-p-0 tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-flex-wrap tw-items-center tw-justify-between tw-px-3">
          {
            <NextGenPhases
              collection={props.collection}
              available={available}
            />
          }
          {props.show_links && (!capacitor.isIos || country === "US") && (
            <span className="tw-flex tw-items-center tw-justify-end tw-gap-2 tw-pb-2 tw-pt-2">
              <Link
                href={
                  props.collection.opensea_link ||
                  getOpenseaLink(NEXTGEN_CHAIN_ID)
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  unoptimized
                  className={styles["marketplace"]}
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
              >
                <Image
                  unoptimized
                  className={styles["marketplace"]}
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
              >
                <Image
                  unoptimized
                  className={styles["marketplace"]}
                  src="/magiceden.png"
                  alt="magiceden"
                  width={32}
                  height={32}
                />
              </Link>
            </span>
          )}
        </div>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-flex-col tw-items-start tw-gap-4 tw-px-3 tw-pt-4">
          <span className="tw-flex tw-flex-col tw-items-start">
            <h1 className="tw-mb-0 tw-text-white">{props.collection.name}</h1>
            {props.collection_link && (
              <NextGenBackToCollectionPageLink collection={props.collection} />
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
        {showMint() && (
          <div
            className="tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow-0 tw-basis-auto tw-flex-col tw-items-center tw-px-3 tw-pt-4 min-[576px]:tw-w-full min-[576px]:tw-shrink-0 min-[576px]:tw-grow-0 min-[576px]:tw-basis-auto md:tw-w-1/2 md:tw-shrink-0 md:tw-grow-0 md:tw-basis-auto"
            style={{ maxWidth: "100%" }}
          >
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
    const mintC = parseInt(collectionMintCount.data as any);
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

export function NextGenCollectionHead(
  props: Readonly<{ collection: NextGenCollection }>
) {
  useSetTitle(props.collection.name);

  return <></>;
}
