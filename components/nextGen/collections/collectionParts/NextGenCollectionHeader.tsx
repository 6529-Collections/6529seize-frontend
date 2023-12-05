import styles from "../NextGen.module.scss";
import { Container, Row, Col, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  AdditionalData,
  Info,
  PhaseTimes,
  Status,
} from "../../nextgen_entities";
import Image from "next/image";
import { goerli } from "wagmi/chains";
import { NEXTGEN_CHAIN_ID, NEXTGEN_CORE } from "../../nextgen_contracts";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DateCountdown from "../../../date-countdown/DateCountdown";

interface Props {
  collection: number;
  info: Info;
  phase_times: PhaseTimes;
  additional_data: AdditionalData;
  collection_link?: boolean;
  mint_page?: boolean;
}

interface CountdownProps {
  collection: number;
  phase_times: PhaseTimes;
  align: "vertical" | "horizontal";
}

interface PhaseProps {
  phase_times: PhaseTimes;
  available: number;
}

export function NextGenCountdown(props: Readonly<CountdownProps>) {
  const router = useRouter();
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
              MINT
            </Button>
          </a>
        )}
      </span>
    );
  }

  return (
    <>
      {props.phase_times.al_status == Status.UPCOMING &&
        printCountdown(
          "Allowlist Starting in",
          props.phase_times.allowlist_start_time
        )}
      {props.phase_times.al_status == Status.LIVE &&
        printCountdown(
          "Allowlist Ending in",
          props.phase_times.allowlist_end_time
        )}
      {props.phase_times.al_status != Status.LIVE &&
        props.phase_times.al_status != Status.UPCOMING &&
        props.phase_times.public_status == Status.UPCOMING &&
        printCountdown(
          "Public Phase Starting in",
          props.phase_times.public_start_time
        )}
      {props.phase_times.public_status == Status.LIVE &&
        printCountdown(
          "Public Phase Ending in",
          props.phase_times.public_end_time
        )}
    </>
  );
}

export function NextGenPhases(props: Readonly<PhaseProps>) {
  function getAllowlistClassName() {
    if (props.phase_times.al_status === Status.LIVE && props.available > 0) {
      return styles.phaseTimeTagActive;
    } else if (
      props.phase_times.al_status === Status.UPCOMING &&
      props.available > 0
    ) {
      return styles.phaseTimeTagUpcoming;
    } else {
      return styles.phaseTimeTagComplete;
    }
  }

  function getPublicStatusClassName() {
    if (
      props.phase_times.public_status === Status.LIVE &&
      props.available > 0
    ) {
      return styles.phaseTimeTagActive;
    } else if (
      props.phase_times.public_status === Status.UPCOMING &&
      props.available > 0
    ) {
      return styles.phaseTimeTagUpcoming;
    } else {
      return styles.phaseTimeTagComplete;
    }
  }

  return (
    <span className="pt-2 pb-2 d-flex align-items-center gap-2 align-items-center">
      <span
        className={`font-bolder font-smaller ${
          styles.nextgenTag
        } ${getAllowlistClassName()}`}>
        ALLOWLIST {props.phase_times.al_status.toUpperCase()}
      </span>
      <span
        className={`font-bolder font-smaller ${
          styles.nextgenTag
        } ${getPublicStatusClassName()}`}>
        PUBLIC PHASE {props.phase_times.public_status}
      </span>
    </span>
  );
}

export default function NextGenCollectionHeader(props: Readonly<Props>) {
  const [available, setAvailable] = useState<number>(0);

  function showMint() {
    if (!props.phase_times || !props.additional_data) {
      return false;
    }

    if (
      props.additional_data.circulation_supply ==
      props.additional_data.total_supply
    ) {
      return false;
    }

    const now = new Date().getTime();
    const allowlistStartsIn = props.phase_times.allowlist_start_time - now;
    if (allowlistStartsIn > 0 && allowlistStartsIn < 1000 * 60 * 60 * 24) {
      return true;
    }
    return (
      props.phase_times.al_status == Status.LIVE ||
      props.phase_times.public_status == Status.LIVE
    );
  }

  useEffect(() => {
    const a =
      props.additional_data.total_supply -
      props.additional_data.circulation_supply;
    setAvailable(a);
  }, [props.additional_data]);

  return (
    <Container className="no-padding">
      <Row>
        <Col className="d-flex justify-content-between align-items-center flex-wrap">
          {
            <NextGenPhases
              phase_times={props.phase_times}
              available={available}
            />
          }
          {!props.mint_page && (
            <span className="pt-2 pb-2 d-flex align-items-center justify-content-end gap-4">
              <FontAwesomeIcon
                className={`${styles.globeIcon} ${styles.marketplace}`}
                icon="globe"
                onClick={() => {
                  let url = props.info.website;
                  if (!url.startsWith("http")) {
                    url = `http://${url}`;
                  }
                  window.open(url, "_blank");
                }}></FontAwesomeIcon>
              <a
                href={`https://${
                  NEXTGEN_CHAIN_ID === goerli.id
                    ? `testnets.opensea`
                    : `opensea`
                }.io/assets/${
                  NEXTGEN_CHAIN_ID === goerli.id ? `goerli` : `ethereum`
                }/${NEXTGEN_CORE.contract}`}
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
              <a
                href={`https://${
                  NEXTGEN_CHAIN_ID === goerli.id ? `goerli.x2y2` : `x2y2`
                }.io/eth/${NEXTGEN_CORE.contract}`}
                target="_blank"
                rel="noreferrer">
                <Image
                  className={styles.marketplace}
                  src="/x2y2.png"
                  alt="x2y2"
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
              #{props.collection} - <b>{props.info.name.toUpperCase()}</b>
            </h1>
            {props.collection_link && (
              <a
                href={`/nextgen/collection/${props.collection}`}
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
            by <b>{props.info.artist}</b>
          </span>
          <span className="font-larger d-inline-flex align-items-center">
            <b>
              {props.additional_data.circulation_supply} /{" "}
              {props.additional_data.total_supply} minted
              {available > 0 && ` | ${available} remaining`}
            </b>
          </span>
        </Col>
        {!props.mint_page && (
          <Col className="d-flex align-items-center">
            {showMint() && (
              <NextGenCountdown
                collection={props.collection}
                phase_times={props.phase_times}
                align="vertical"
              />
            )}
          </Col>
        )}
      </Row>
    </Container>
  );
}
