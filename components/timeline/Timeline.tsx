import { Col, Container, Row } from "react-bootstrap";
import { BaseNFT, NFTHistory } from "../../entities/INFT";
import styles from "./Timeline.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { numberWithCommasFromString } from "../../helpers/Helpers";
import TimelineMediaComponent, { MediaType } from "./TimelineMedia";

interface Props {
  nft: BaseNFT;
  steps: NFTHistory[];
}

export default function Timeline(props: Readonly<Props>) {
  const getDateDisplay = (date: Date) => {
    date = new Date(date);
    return `${date.getUTCFullYear()}/${(date.getUTCMonth() + 1)
      .toString()
      .padStart(2, "0")}/${date
      .getUTCDate()
      .toString()
      .padStart(2, "0")} - ${date
      .getUTCHours()
      .toString()
      .padStart(2, "0")}:${date.getUTCMinutes().toString().padStart(2, "0")}`;
  };

  const getType = () => {
    if (props.nft.metadata.animation_details?.format === "HTML") {
      return MediaType.HTML;
    } else if (
      props.nft.metadata.animation_details?.format === "MP4" ||
      props.nft.metadata.animation_details?.format === "MOV"
    ) {
      return MediaType.VIDEO;
    } else {
      return MediaType.IMAGE;
    }
  };

  const getKeyDisplay = (key: string) => {
    key = key.replaceAll("_", " ");
    key = key.replaceAll("::", " - ");
    key = key.replace(/\b\w/g, (match) => match.toUpperCase());
    return key;
  };

  const isImage = (key: string) => {
    return ["image"].includes(key);
  };

  const isAnimation = (key: string) => {
    return ["animation"].includes(key);
  };

  const isUrlKey = (key: string) => {
    return ["animation_url", "image_url"].includes(key);
  };

  function printAttribute(label: string, value: any, fullWidth?: boolean) {
    return (
      <Col sm={12} md={fullWidth ? 12 : 6}>
        <b>{label}:</b>{" "}
        <div
          dangerouslySetInnerHTML={{
            __html: numberWithCommasFromString(value).replaceAll("\n", "<br>"),
          }}></div>
      </Col>
    );
  }

  function printFromToFields(from: any, to: any) {
    if (from && to) {
      return (
        <>
          {printAttribute("From", from)}
          {printAttribute("To", to)}
        </>
      );
    }

    const label = from ? "Removed Value" : "Added Value";
    const nonUndefined = from || to;
    return printAttribute(label, nonUndefined, true);
  }

  function printLink(label: string, value: any) {
    return (
      <Col xs={12}>
        <b>{label}:</b>{" "}
        <a href={value} target="_blank" rel="noreferrer">
          {value}
        </a>
      </Col>
    );
  }

  function printFromToUrls(from: any, to: any) {
    if (from && to) {
      return (
        <>
          {printLink("From", from)}
          {printLink("To", to)}
        </>
      );
    }

    const label = from ? "Removed URL" : "Added URL";
    const nonUndefined = from || to;
    return printLink(label, nonUndefined);
  }

  function printImage(label: string, value: any) {
    return (
      <Col className="d-flex align-items-start flex-column gap-1">
        <b>{label}:</b>
        <TimelineMediaComponent type={MediaType.IMAGE} url={value} />
      </Col>
    );
  }

  function printFromToImages(from: any, to: any) {
    if (from && to) {
      return (
        <>
          {printImage("From", from)}
          {printImage("To", to)}
        </>
      );
    }

    const label = from ? "Removed Image" : "Added Image";
    const nonUndefined = from || to;
    return printImage(label, nonUndefined);
  }

  function printAnimation(label: string, value: any) {
    return (
      <Col className="d-flex align-items-start flex-column gap-1">
        <b>{label}:</b>
        <TimelineMediaComponent type={getType()} url={value} />
      </Col>
    );
  }

  function printFromToAnimation(from: any, to: any) {
    if (from && to) {
      return (
        <>
          {printAnimation("From", from)}
          {printAnimation("To", to)}
        </>
      );
    }

    const label = from ? "Removed Animation" : "Added Animation";
    const nonUndefined = from || to;
    return printAnimation(label, nonUndefined);
  }

  function printContent(change: { key: string; from: any; to: any }) {
    let content;
    if (isImage(change.key)) {
      content = printFromToImages(change.from, change.to);
    } else if (isAnimation(change.key)) {
      content = printFromToAnimation(change.from, change.to);
    } else if (isUrlKey(change.key)) {
      content = printFromToUrls(change.from, change.to);
    } else if (change.key.endsWith("(Added)")) {
      content = printAttribute("Value", change.to, true);
    } else if (change.key.endsWith("(Removed)")) {
      content = printAttribute("Value", change.from, true);
    } else {
      content = printFromToFields(change.from, change.to);
    }

    return content;
  }

  return (
    <div className={styles.timeline}>
      {props.steps.map((step, index) => {
        return (
          <div
            key={`timeline-${step.block}`}
            className={`${styles.timelineContainer} ${
              index % 2 === 0 ? styles.right : styles.left
            }`}>
            <div className={styles.content}>
              <h5 className="float-none m-0 mb-3">
                {`${getDateDisplay(step.transaction_date)} UTC`}
              </h5>
              <Container className="no-padding">
                <Row className="pb-1">
                  <Col className="d-flex justify-content-between align-items-center gap-4">
                    <b>{step.description.event}</b>
                    <span className="d-flex gap-4">
                      <a
                        href={step.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="d-flex align-items-center justify-content-center gap-2 decoration-none">
                        URI
                        <FontAwesomeIcon
                          icon="external-link-square"
                          className={styles.linkIcon}
                        />
                      </a>
                      <a
                        href={`https://etherscan.io/tx/${step.transaction_hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="d-flex align-items-center justify-content-center gap-2 decoration-none">
                        TXN
                        <FontAwesomeIcon
                          icon="external-link-square"
                          className={styles.linkIcon}
                        />
                      </a>
                    </span>
                  </Col>
                </Row>
                {step.description.changes.length > 0 && (
                  <ul className={styles.changesUl}>
                    {step.description.changes.map((change) => (
                      <li key={`timeline-table-${change.key}`}>
                        <Row className="pt-3 pb-1">
                          <Col>
                            <b>{getKeyDisplay(change.key)}</b>
                          </Col>
                        </Row>
                        <Row className="pt-1 pb-3">{printContent(change)}</Row>
                      </li>
                    ))}
                  </ul>
                )}
              </Container>
            </div>
          </div>
        );
      })}
    </div>
  );
}
