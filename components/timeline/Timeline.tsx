import { Col, Container, Row } from "react-bootstrap";
import type { BaseNFT, NFTHistory } from "@/entities/INFT";
import styles from "./Timeline.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { numberWithCommasFromString } from "@/helpers/Helpers";
import TimelineMediaComponent, { MediaType } from "./TimelineMedia";
import { faExternalLinkSquare } from "@fortawesome/free-solid-svg-icons";
import { formatDate } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

interface Props {
  nft: BaseNFT;
  steps: NFTHistory[];
  locale?: SupportedLocale;
}

const TIMELINE_DATE_FORMAT = {
  day: "2-digit",
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
  year: "numeric",
} satisfies Intl.DateTimeFormatOptions;

export default function Timeline(props: Readonly<Props>) {
  const locale = props.locale ?? DEFAULT_LOCALE;

  const getDateDisplay = (date: Date) => {
    return t(locale, "timeline.date.utc", {
      date: formatDate(locale, date, TIMELINE_DATE_FORMAT),
    });
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
    const displayValue = String(numberWithCommasFromString(value));

    return (
      <Col sm={12} md={fullWidth ? 12 : 6}>
        <b>{label}:</b>{" "}
        <div className={styles["metadataValue"]}>{displayValue}</div>
      </Col>
    );
  }

  function printFromToFields(from: any, to: any) {
    if (from && to) {
      return (
        <>
          {printAttribute(t(locale, "timeline.fields.from"), from)}
          {printAttribute(t(locale, "timeline.fields.to"), to)}
        </>
      );
    }

    const label = from
      ? t(locale, "timeline.fields.removedValue")
      : t(locale, "timeline.fields.addedValue");
    const nonUndefined = from || to;
    return printAttribute(label, nonUndefined, true);
  }

  function printLink(label: string, value: any) {
    return (
      <Col xs={12}>
        <b>{label}:</b>{" "}
        <a href={value} target="_blank" rel="noopener noreferrer">
          {value}
        </a>
      </Col>
    );
  }

  function printFromToUrls(from: any, to: any) {
    if (from && to) {
      return (
        <>
          {printLink(t(locale, "timeline.fields.from"), from)}
          {printLink(t(locale, "timeline.fields.to"), to)}
        </>
      );
    }

    const label = from
      ? t(locale, "timeline.fields.removedUrl")
      : t(locale, "timeline.fields.addedUrl");
    const nonUndefined = from || to;
    return printLink(label, nonUndefined);
  }

  function printImage(label: string, value: any) {
    return (
      <Col className="d-flex align-items-start flex-column gap-1">
        <b>{label}:</b>
        <TimelineMediaComponent
          type={MediaType.IMAGE}
          url={value}
          label={label}
          locale={locale}
        />
      </Col>
    );
  }

  function printFromToImages(from: any, to: any) {
    if (from && to) {
      return (
        <>
          {printImage(t(locale, "timeline.fields.from"), from)}
          {printImage(t(locale, "timeline.fields.to"), to)}
        </>
      );
    }

    const label = from
      ? t(locale, "timeline.fields.removedImage")
      : t(locale, "timeline.fields.addedImage");
    const nonUndefined = from || to;
    return printImage(label, nonUndefined);
  }

  function printAnimation(label: string, value: any) {
    return (
      <Col className="d-flex align-items-start flex-column gap-1">
        <b>{label}:</b>
        <TimelineMediaComponent
          type={getType()}
          url={value}
          label={label}
          locale={locale}
        />
      </Col>
    );
  }

  function printFromToAnimation(from: any, to: any) {
    if (from && to) {
      return (
        <>
          {printAnimation(t(locale, "timeline.fields.from"), from)}
          {printAnimation(t(locale, "timeline.fields.to"), to)}
        </>
      );
    }

    const label = from
      ? t(locale, "timeline.fields.removedAnimation")
      : t(locale, "timeline.fields.addedAnimation");
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
      content = printAttribute(
        t(locale, "timeline.fields.value"),
        change.to,
        true
      );
    } else if (change.key.endsWith("(Removed)")) {
      content = printAttribute(
        t(locale, "timeline.fields.value"),
        change.from,
        true
      );
    } else {
      content = printFromToFields(change.from, change.to);
    }

    return content;
  }

  return (
    <div className={styles["timeline"]}>
      {props.steps.map((step, index) => {
        return (
          <div
            key={`timeline-${step.block}`}
            className={`${styles["timelineContainer"]} ${
              index % 2 === 0 ? styles["right"] : styles["left"]
            }`}
          >
            <div className={styles["content"]}>
              <h5 className="m-0 mb-3">
                {getDateDisplay(step.transaction_date)}
              </h5>
              <Container className="no-padding">
                <Row className="pb-1">
                  <Col className="d-flex justify-content-between align-items-center gap-4">
                    <b>{step.description.event}</b>
                    <span className="d-flex gap-4">
                      <a
                        href={step.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t(locale, "timeline.links.uriAriaLabel")}
                        className="d-flex align-items-center justify-content-center gap-2 decoration-none"
                      >
                        {t(locale, "timeline.links.uri")}
                        <FontAwesomeIcon
                          icon={faExternalLinkSquare}
                          aria-hidden="true"
                          className={styles["linkIcon"]}
                        />
                      </a>
                      <a
                        href={`https://etherscan.io/tx/${step.transaction_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t(locale, "timeline.links.txnAriaLabel")}
                        className="d-flex align-items-center justify-content-center gap-2 decoration-none"
                      >
                        {t(locale, "timeline.links.txn")}
                        <FontAwesomeIcon
                          icon={faExternalLinkSquare}
                          aria-hidden="true"
                          className={styles["linkIcon"]}
                        />
                      </a>
                    </span>
                  </Col>
                </Row>
                {step.description.changes.length > 0 && (
                  <ul className={styles["changesUl"]}>
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
