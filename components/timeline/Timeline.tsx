import { Col, Container, Row, Table } from "react-bootstrap";
import { NFTHistory } from "../../entities/INFT";
import styles from "./Timeline.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getContentTypeFromURL } from "../../helpers/Helpers";
import TimelineMediaComponent from "./TimelineMedia";

interface Props {
  steps: NFTHistory[];
}

export default function Timeline(props: Props) {
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

  const getKeyDisplay = (key: string) => {
    key = key.replaceAll("_", " ");
    key = key.replaceAll("::", " - ");
    key = key.replace(/\b\w/g, (match) => match.toUpperCase());
    return key;
  };

  const isImage = (key: string) => {
    return ["image", "image_url"].includes(key);
  };

  const isAnimation = (key: string) => {
    return ["animation", "animation_url"].includes(key);
  };

  return (
    <>
      <Container className="mb-5 no-padding">
        <Row className={styles.timelineTableScrollContainer}>
          <Col className="no-padding">
            <Table className={styles.timelineTable}>
              <thead>
                <tr>
                  <th>Date - Time</th>
                  <th>Event</th>
                </tr>
              </thead>
              <tbody>
                {props.steps.map((step, index) => {
                  return (
                    <tr key={`timeline-table-${index}`}>
                      <td>{getDateDisplay(step.transaction_date)}</td>
                      <td>
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
                              {step.description.changes.map((change, index) => (
                                <li key={`timeline-table-${index}`}>
                                  <Row className="pt-3 pb-1">
                                    <Col>
                                      <b>{getKeyDisplay(change.key)}</b>
                                    </Col>
                                  </Row>
                                  <Row className="pt-1 pb-3">
                                    {isImage(change.key) ? (
                                      <>
                                        <Col className="d-flex align-items-start flex-column gap-1">
                                          <b>From:</b>
                                          <TimelineMediaComponent
                                            url={change.from}
                                          />
                                          <a
                                            className={styles.changeLink}
                                            href={change.from}
                                            target="_blank"
                                            rel="noreferrer">
                                            link
                                          </a>
                                        </Col>
                                        <Col className="d-flex align-items-start flex-column gap-1">
                                          <b>To:</b>
                                          <TimelineMediaComponent
                                            url={change.to}
                                          />
                                          <a
                                            className={styles.changeLink}
                                            href={change.to}
                                            target="_blank"
                                            rel="noreferrer">
                                            link
                                          </a>
                                        </Col>
                                      </>
                                    ) : isAnimation(change.key) ? (
                                      <>
                                        <Col xs={12}>
                                          <b>From:</b>{" "}
                                          <a
                                            href={change.from}
                                            target="_blank"
                                            rel="noreferrer">
                                            {change.from}
                                          </a>
                                        </Col>
                                        <Col xs={12} className="pt-2">
                                          <b>To:</b>{" "}
                                          <a
                                            href={change.to}
                                            target="_blank"
                                            rel="noreferrer">
                                            {change.to}
                                          </a>
                                        </Col>
                                      </>
                                    ) : (
                                      <>
                                        <Col xs={12}>
                                          <b>From:</b>{" "}
                                          <span>{change.from}</span>
                                        </Col>
                                        <Col xs={12} className="pt-2">
                                          <b>To:</b> {change.to}
                                        </Col>
                                      </>
                                    )}
                                  </Row>
                                </li>
                              ))}
                            </ul>
                          )}
                        </Container>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Col>
        </Row>
      </Container>
      <div className={styles.timeline}>
        {props.steps.map((step, index) => {
          return (
            <div
              key={`timeline-${index}`}
              className={`${styles.timelineContainer} ${
                index % 2 === 0 ? styles.right : styles.left
              }`}>
              <div className={styles.content}>
                <h5 className="float-none m-0 mb-3">
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
                    <ul>
                      {step.description.changes.map((change, index) => (
                        <li key={`timeline-table-${index}`}>
                          <Row className="pt-3 pb-1">
                            <Col>
                              <b>{getKeyDisplay(change.key)}</b>
                            </Col>
                          </Row>
                          <Row className="pt-1 pb-3">
                            {isImage(change.key) ? (
                              <>
                                <Col className="d-flex align-items-start flex-column gap-1">
                                  <b>From:</b>
                                  <TimelineMediaComponent url={change.from} />
                                  <a
                                    className={styles.changeLink}
                                    href={change.from}
                                    target="_blank"
                                    rel="noreferrer">
                                    link
                                  </a>
                                </Col>
                                <Col className="d-flex align-items-start flex-column gap-1">
                                  <b>To:</b>
                                  <TimelineMediaComponent url={change.to} />
                                  <a
                                    className={styles.changeLink}
                                    href={change.to}
                                    target="_blank"
                                    rel="noreferrer">
                                    link
                                  </a>
                                </Col>
                              </>
                            ) : (
                              <>
                                <Col xs={12}>
                                  <b>From:</b> <span>{change.from}</span>
                                </Col>
                                <Col xs={12} className="pt-2">
                                  <b>To:</b> {change.to}
                                </Col>
                              </>
                            )}
                          </Row>
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
    </>
  );
}
