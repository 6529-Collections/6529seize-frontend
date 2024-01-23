import { Row, Col, Container } from "react-bootstrap";
import DotLoader from "../dotLoader/DotLoader";
import styles from "./CommunityStats.module.scss";

export default function CommunityStatsDaysSelector(
  props: Readonly<{
    loaded: boolean;
    page_size: number;
    setPageSize: (size: number) => void;
  }>
) {
  return (
    <Container className="no-padding">
      <Row>
        <Col className="d-flex align-items-center justify-content-end gap-2 pt-4">
          {!props.loaded && <DotLoader />}
          <span
            className={`${styles.statsTimeSelectionSpan} ${
              props.page_size == 7 ? styles.statsTimeSelectionSpanSelected : ""
            }`}
            onClick={() => props.setPageSize(7)}>
            7D
          </span>
          <span
            className={`${styles.statsTimeSelectionSpan} ${
              props.page_size == 30 ? styles.statsTimeSelectionSpanSelected : ""
            }`}
            onClick={() => props.setPageSize(30)}>
            1M
          </span>
          <span
            className={`${styles.statsTimeSelectionSpan} ${
              props.page_size == 90 ? styles.statsTimeSelectionSpanSelected : ""
            }`}
            onClick={() => props.setPageSize(90)}>
            3M
          </span>
          <span
            className={`${styles.statsTimeSelectionSpan} ${
              props.page_size == 200
                ? styles.statsTimeSelectionSpanSelected
                : ""
            }`}
            onClick={() => props.setPageSize(200)}>
            All
          </span>
        </Col>
      </Row>
    </Container>
  );
}
