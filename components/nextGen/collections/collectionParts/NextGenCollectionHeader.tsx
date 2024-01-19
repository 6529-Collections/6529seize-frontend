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
import { getStatusFromDates } from "../../nextgen_helpers";
import { sepolia, goerli } from "viem/chains";

interface Props {
  collection: NextGenCollection;
  collection_link?: boolean;
  mint_page?: boolean;
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

  function printCountdown(title: string, date: number) {
    return (
      <span className={styles.countdownContainer}>
        <DateCountdown
          title={title}
          date={new Date(date * 1000)}
          align={props.align}
        />
        {!router.pathname.includes("mint") && (
          <a href={`/nextgen/collection/${props.collection}/mint`}>
            <Button className="seize-btn btn-block pt-2 pb-2 btn-black font-larger font-bolder">
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
          "Allowlist Starting in",
          props.collection.allowlist_start
        )}
      {alStatus == Status.LIVE &&
        printCountdown("Allowlist Ending in", props.collection.allowlist_end)}
      {alStatus != Status.LIVE &&
        alStatus != Status.UPCOMING &&
        publicStatus == Status.UPCOMING &&
        printCountdown(
          "Public Phase Starting in",
          props.collection.public_start
        )}
      {publicStatus == Status.LIVE &&
        printCountdown("Public Phase Ending in", props.collection.public_end)}
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

    const now = new Date().getTime();
    const allowlistStartsIn = props.collection.allowlist_start - now;
    if (allowlistStartsIn > 0 && allowlistStartsIn < 1000 * 60 * 60 * 24) {
      return true;
    }
    return (
      (now >= props.collection.allowlist_start &&
        props.collection.allowlist_end > now) ||
      (now >= props.collection.public_start &&
        props.collection.public_end > now)
    );
  }

  useEffect(() => {
    const a = props.collection.total_supply - props.collection.mint_count;
    setAvailable(a);
  }, [props.collection]);

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
          {!props.mint_page && (
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
                href={`https://${
                  NEXTGEN_CHAIN_ID === sepolia.id ||
                  NEXTGEN_CHAIN_ID === goerli.id
                    ? `testnets.opensea`
                    : `opensea`
                }.io/assets/${
                  NEXTGEN_CHAIN_ID === sepolia.id
                    ? `sepolia`
                    : NEXTGEN_CHAIN_ID === goerli.id
                    ? `goerli`
                    : `ethereum`
                }/${NEXTGEN_CORE[NEXTGEN_CHAIN_ID]}`}
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
          )}
        </Col>
      </Row>
      <Row>
        <Col
          className={`d-flex flex-column align-items-start ${
            !props.mint_page ? "pt-3 gap-3" : ""
          }`}>
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
          <span className="font-larger d-inline-flex align-items-center">
            <b>
              {props.collection.mint_count} / {props.collection.total_supply}{" "}
              minted
              {available > 0 && ` | ${available} remaining`}
            </b>
          </span>
        </Col>
        {/* {!props.mint_page && (
          <Col className="d-flex align-items-center">
            {showMint() && (
              <NextGenCountdown
                collection={props.collection}
                align="vertical"
              />
            )}
          </Col>
        )} */}
      </Row>
    </Container>
  );
}
