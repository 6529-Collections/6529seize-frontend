import { Col, Container, Row, Table } from "react-bootstrap";
import { NFTHistory } from "../../entities/INFT";
import styles from "./Timeline.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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

  const getDescriptionDisplay = (description: string, iconClass: string) => {
    const linkRegex = /(https?:\/\/[^\s]+)/g;
    description = description.replaceAll(
      linkRegex,
      `<a href='$1' target="_blank" rel="noreferrer">$1</a>`
    );
    description = description.replaceAll("\n", "<br/>");
    description = description.replaceAll(
      " -> ",
      `<div class="text-center"><span class="${iconClass} mt-3 mb-3">&#8595;</span></div>`
    );
    return description;
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
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {props.steps.map((step, index) => {
                  return (
                    <tr key={`timeline-table-${index}`}>
                      <td>{getDateDisplay(step.transaction_date)}</td>
                      <td
                        dangerouslySetInnerHTML={{
                          __html: getDescriptionDisplay(
                            step.description,
                            "icon-white"
                          ),
                        }}></td>
                      <td>
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
                      </td>
                      <td>
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
                <p
                  className="m-0"
                  dangerouslySetInnerHTML={{
                    __html: getDescriptionDisplay(
                      step.description,
                      "icon-black"
                    ),
                  }}></p>
                <p className="m-0 mt-3 d-flex justify-content-end gap-3">
                  <a
                    href={step.uri}
                    target="_blank"
                    rel="noreferrer"
                    className={`d-inline-flex align-items-center justify-content-center gap-1 ${styles.externalLink}`}>
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
                    className={`d-inline-flex align-items-center justify-content-center gap-1 ${styles.externalLink}`}>
                    TXN
                    <FontAwesomeIcon
                      icon="external-link-square"
                      className={styles.linkIcon}
                    />
                  </a>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
