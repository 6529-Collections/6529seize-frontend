"use client";

import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import DateCountdown from "@/components/date-countdown/DateCountdown";
import DotLoader from "@/components/dotLoader/DotLoader";
import { NEXTGEN_CHAIN_ID } from "@/components/nextGen/nextgen_contracts";
import type {
  CollectionWithMerkle} from "@/components/nextGen/nextgen_entities";
import {
  AllowlistType,
  Status,
} from "@/components/nextGen/nextgen_entities";
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
import { Col, Container, Row } from "react-bootstrap";
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
      className="pt-2 decoration-none d-flex align-items-center gap-2 pb-2">
      <FontAwesomeIcon icon={faArrowCircleLeft} className={styles["backIcon"]} />
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
    fetchUrl<CollectionWithMerkle>(url).then((response: CollectionWithMerkle) => {
      if (response) {
        setCollection(response);
      }
      setCollectionLoaded(true);
    });
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
            )}/mint`}>
            <button
              className={`pt-2 pb-2 btn-block no-wrap ${styles["exploreBtn"]}`}>
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
    <span className="pt-2 pb-2 d-flex align-items-center gap-2 align-items-center">
      {alStatus !== Status.UNAVAILABLE && (
        <span
          className={`d-flex align-items-center font-bolder font-smaller ${
            styles["nextgenTag"]
          } ${getAllowlistClassName()}`}>
          ALLOWLIST {alStatus}
        </span>
      )}
      {publicStatus !== Status.UNAVAILABLE && (
        <span
          className={`d-flex align-items-center font-bolder font-smaller ${
            styles["nextgenTag"]
          } ${getPublicStatusClassName()}`}>
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
    <Container className="no-padding">
      <Row>
        <Col className="d-flex justify-content-between align-items-center flex-wrap">
          {
            <NextGenPhases
              collection={props.collection}
              available={available}
            />
          }
          {props.show_links && (!capacitor.isIos || country === "US") && (
            <span className="pt-2 pb-2 d-flex align-items-center justify-content-end gap-2">
              <Link
                href={
                  props.collection.opensea_link ||
                  getOpenseaLink(NEXTGEN_CHAIN_ID)
                }
                target="_blank"
                rel="noopener noreferrer">
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
                rel="noopener noreferrer">
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
                rel="noopener noreferrer">
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
        </Col>
      </Row>
      <Row>
        <Col className={`d-flex flex-column align-items-start pt-3 gap-3`}>
          <span className="d-flex flex-column align-items-start">
            <h1 className="mb-0 font-color">{props.collection.name}</h1>
            {props.collection_link && (
              <NextGenBackToCollectionPageLink collection={props.collection} />
            )}
          </span>
          <span className="font-larger">
            by{" "}
            <b>
              <Link href={`/${props.collection.artist_address}`}>
                {props.collection.artist}
              </Link>
            </b>
          </span>
          <span className="pt-2 font-larger d-inline-flex align-items-center">
            <NextGenMintCounts
              collection={props.collection}
              setAvailable={setAvailable}
            />
          </span>
        </Col>
        {showMint() && (
          <Col
            className="pt-3 d-flex flex-column align-items-center"
            sm={12}
            md={6}>
            <NextGenCountdown collection={props.collection} />
          </Col>
        )}
      </Row>
    </Container>
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