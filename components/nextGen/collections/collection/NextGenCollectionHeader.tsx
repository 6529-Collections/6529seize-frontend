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
import { getPhaseDateDisplay } from "../../nextgen_helpers";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

interface Props {
  collection: number;
  info: Info;
  phase_times: PhaseTimes;
  additional_data: AdditionalData;
  collection_link?: boolean;
}

export default function NextGenCollectionHeader(props: Props) {
  const router = useRouter();
  const [available, setAvailable] = useState<number>(0);

  const collectionPath = `/nextgen/collection/${props.collection}`;

  function showMint() {
    if (router.pathname.includes("mint")) {
      return false;
    }

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
          <span className="pt-2 pb-2 d-flex align-items-center gap-2 align-items-center">
            <span
              className={`${styles.phaseTimeTag} ${
                props.phase_times.al_status == Status.LIVE && available > 0
                  ? styles.phaseTimeTagActive
                  : props.phase_times.al_status == Status.UPCOMING &&
                    available > 0
                  ? styles.phaseTimeTagUpcoming
                  : styles.phaseTimeTagComplete
              }`}>
              ALLOWLIST {props.phase_times.al_status.toUpperCase()}
            </span>
            <span
              className={`${styles.phaseTimeTag} ${
                props.phase_times.public_status == Status.LIVE && available > 0
                  ? styles.phaseTimeTagActive
                  : props.phase_times.public_status == Status.UPCOMING &&
                    available > 0
                  ? styles.phaseTimeTagUpcoming
                  : styles.phaseTimeTagComplete
              }`}>
              PUBLIC PHASE {props.phase_times.public_status}
            </span>
          </span>
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
                NEXTGEN_CHAIN_ID === goerli.id ? `testnets.opensea` : `opensea`
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
        </Col>
      </Row>
      <Row className="pt-2">
        <Col className="d-flex justify-content-between flex-wrap">
          <span className="d-flex flex-column align-items-start gap-3">
            <span className="d-flex flex-column align-items-start">
              <h1 className="mb-0 font-color">
                #{props.collection} - <b>{props.info.name.toUpperCase()}</b>
              </h1>
              {props.collection_link && (
                <a
                  href={collectionPath}
                  className="decoration-none d-flex align-items-center gap-2">
                  <FontAwesomeIcon
                    icon="arrow-circle-left"
                    className={styles.backIcon}
                  />
                  Back to collection Page
                </a>
              )}
            </span>
            <span>
              by <b>{props.info.artist}</b>
            </span>
            <span className="d-inline-flex align-items-center">
              <b>
                {props.additional_data.circulation_supply} /{" "}
                {props.additional_data.total_supply} minted
                {available > 0 && ` | ${available} remaining`}
              </b>
            </span>
          </span>
          {showMint() && (
            <span className="d-flex align-items-start pt-2">
              <a href={`${collectionPath}/mint`}>
                <Button className="seize-btn btn-white font-larger font-bolder">
                  Mint Now!
                </Button>
              </a>
            </span>
          )}
        </Col>
      </Row>
    </Container>
  );
}
