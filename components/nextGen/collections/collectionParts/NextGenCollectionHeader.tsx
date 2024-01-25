import styles from "../NextGen.module.scss";
import { Container, Row, Col, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  AllowlistType,
  CollectionWithMerkle,
  Status,
} from "../../nextgen_entities";
import Image from "next/image";
import { NEXTGEN_CHAIN_ID, NEXTGEN_CORE } from "../../nextgen_contracts";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DateCountdown from "../../../date-countdown/DateCountdown";
import { fetchUrl } from "../../../../services/6529api";
import DotLoader from "../../../dotLoader/DotLoader";
import { NextGenCollection } from "../../../../entities/INextgen";
import {
  getOpenseaLink,
  getStatusFromDates,
  useCollectionMintCount,
} from "../../nextgen_helpers";
import { sepolia, goerli } from "viem/chains";
import "add-to-calendar-button";

interface Props {
  collection: NextGenCollection;
  collection_link?: boolean;
}

interface CountdownProps {
  collection: NextGenCollection;
  align: "vertical" | "horizontal";
}

interface PhaseProps {
  collection: NextGenCollection;
  available: number;
}

export function NextGenCountdown(props: Readonly<CountdownProps>) {
  const router = useRouter();
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
    const url = `${process.env.API_ENDPOINT}/api/nextgen/merkle_roots/${props.collection.merkle_root}`;
    fetchUrl(url).then((response: CollectionWithMerkle) => {
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

  function printCountdown(
    title: string,
    date: number,
    phase: "Allowlist" | "Public",
    start: number,
    end: number
  ) {
    const name = `${phase} Minting - NextGen Collection #${props.collection.id} - ${props.collection.name}`;
    const calEvent = {
      name: name,
      start_seconds: start,
      end_seconds: end,
      description: `${name}\n\n${process.env.BASE_ENDPOINT}/nextgen/collection/${props.collection.id}`,
    };

    return (
      <span className={styles.countdownContainer}>
        <DateCountdown
          title={`${title} in`}
          date={new Date(date * 1000)}
          align={props.align}
          calendar_event={calEvent}
        />
        {!router.pathname.includes("mint") && (
          <a href={`/nextgen/collection/${props.collection.id}/mint`}>
            <Button className="seize-btn btn-block pt-2 pb-2 btn-white font-larger font-bolder">
              {getButtonLabel()}
            </Button>
          </a>
        )}
      </span>
    );
  }

  return (
    <>
      {alStatus == Status.UPCOMING &&
        printCountdown(
          "Allowlist Starting",
          props.collection.allowlist_start,
          "Allowlist",
          props.collection.allowlist_start,
          props.collection.allowlist_end
        )}
      {alStatus == Status.LIVE &&
        printCountdown(
          "Allowlist Ending",
          props.collection.allowlist_end,
          "Allowlist",
          props.collection.allowlist_start,
          props.collection.allowlist_end
        )}
      {alStatus != Status.LIVE &&
        alStatus != Status.UPCOMING &&
        publicStatus == Status.UPCOMING &&
        printCountdown(
          "Public Phase Starting",
          props.collection.public_start,
          "Public",
          props.collection.allowlist_start,
          props.collection.allowlist_end
        )}
      {publicStatus == Status.LIVE &&
        printCountdown(
          "Public Phase Ending",
          props.collection.public_end,
          "Public",
          props.collection.allowlist_start,
          props.collection.allowlist_end
        )}
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
      return styles.phaseTimeTagActive;
    } else if (alStatus === Status.UPCOMING && props.available > 0) {
      return styles.phaseTimeTagUpcoming;
    } else {
      return styles.phaseTimeTagComplete;
    }
  }

  function getPublicStatusClassName() {
    if (publicStatus === Status.LIVE && props.available > 0) {
      return styles.phaseTimeTagActive;
    } else if (publicStatus === Status.UPCOMING && props.available > 0) {
      return styles.phaseTimeTagUpcoming;
    } else {
      return styles.phaseTimeTagComplete;
    }
  }

  return (
    <span className="pt-2 pb-2 d-flex align-items-center gap-2 align-items-center">
      {/* {alStatus !== Status.UNAVAILABLE && ( */}
      <span
        className={`font-bolder font-smaller ${
          styles.nextgenTag
        } ${getAllowlistClassName()}`}>
        ALLOWLIST {alStatus}
      </span>
      {/* )} */}
      {/* {publicStatus !== Status.UNAVAILABLE && ( */}
      <span
        className={`font-bolder font-smaller ${
          styles.nextgenTag
        } ${getPublicStatusClassName()}`}>
        PUBLIC PHASE {publicStatus}
      </span>
      {/* )} */}
    </span>
  );
}

export default function NextGenCollectionHeader(props: Readonly<Props>) {
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
          <span className="pt-2 pb-2 d-flex align-items-center justify-content-end gap-4">
            <FontAwesomeIcon
              className={`${styles.globeIcon} ${styles.marketplace}`}
              icon="globe"
              onClick={() => {
                let url = props.collection.website;
                if (!url.startsWith("http")) {
                  url = `http://${url}`;
                }
                window.open(url, "_blank");
              }}></FontAwesomeIcon>
            <a
              href={getOpenseaLink(NEXTGEN_CHAIN_ID)}
              target="_blank"
              rel="noreferrer">
              <Image
                className={styles.marketplace}
                src="/opensea.png"
                alt="opensea"
                width={32}
                height={32}
              />
            </a>
          </span>
        </Col>
      </Row>
      <Row>
        <Col className={`d-flex flex-column align-items-start pt-3 gap-3`}>
          <span className="d-flex flex-column align-items-start">
            <h1 className="mb-0 font-color">
              #{props.collection.id} -{" "}
              <b>{props.collection.name.toUpperCase()}</b>
            </h1>
            {props.collection_link && (
              <a
                href={`/nextgen/collection/${props.collection.id}`}
                className="decoration-none d-flex align-items-center gap-2 pb-2">
                <FontAwesomeIcon
                  icon="arrow-circle-left"
                  className={styles.backIcon}
                />
                Back to collection Page
              </a>
            )}
          </span>
          <span className="font-larger">
            by{" "}
            <b>
              <a href={`/${props.collection.artist_address}`}>
                {props.collection.artist}
              </a>
            </b>
          </span>
          <span className="pt-2 font-larger d-inline-flex align-items-center">
            <NextGenMintCounts
              collection={props.collection}
              setAvailable={setAvailable}
            />
          </span>
        </Col>
        <Col className="pt-3 d-flex align-items-center" sm={12} md={6}>
          {showMint() && (
            <NextGenCountdown collection={props.collection} align="vertical" />
          )}
        </Col>
      </Row>
    </Container>
  );
}

export function NextGenMintCounts(
  props: Readonly<{
    collection: NextGenCollection;
    setAvailable?(available: number): void;
    shouldRefetchMintCounts?: boolean;
    setShouldRefetchMintCounts?(shouldRefetchMintCounts: boolean): void;
  }>
) {
  const [available, setAvailable] = useState<number>(0);

  const collectionMintCount = useCollectionMintCount(props.collection.id);
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
    if (collectionMintCount.data) {
      const mintC = parseInt(collectionMintCount.data as any);
      setMintCount(mintC);
      const avail = props.collection.total_supply - mintC;
      setAvailable(avail);
      if (props.setAvailable) {
        props.setAvailable(avail);
      }
    }
  }, [collectionMintCount.data]);

  return (
    <b>
      {mintCount} / {props.collection.total_supply} minted
      {available > 0 && ` | ${available} remaining`}
      {isLoading && (
        <>
          &nbsp;
          <DotLoader />
        </>
      )}
    </b>
  );
}
