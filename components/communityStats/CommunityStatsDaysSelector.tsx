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
  function printSelection(title: string, value: number) {
    return (
      <button
        className={`btn-link decoration-none ${styles.statsTimeSelectionSpan} ${
          props.page_size == value ? styles.statsTimeSelectionSpanSelected : ""
        }`}
        onClick={() => props.setPageSize(value)}>
        {title}
      </button>
    );
  }

  return (
    <Container className="no-padding">
      <Row>
        <Col className="d-flex align-items-center justify-content-end gap-2 pt-4">
          {!props.loaded && <DotLoader />}
          {printSelection("7D", 7)}
          {printSelection("1M", 30)}
          {printSelection("3M", 90)}
          {printSelection("ALL", 200)}
        </Col>
      </Row>
    </Container>
  );
}
