import { Col, Container, Row } from "react-bootstrap";
import styles from "./CommunityDownloads.module.scss";

export default function CommunityDownloads() {
  return (
    <Container fluid>
      <Row>
        <Col>
          <Container className="pt-4">
            <Row>
              <Col>
                <h1>DOWNLOADS</h1>
              </Col>
            </Row>
            <Row className="pt-4">
              <Col xs={12} sm={6} md={4}>
                <a href="/downloads/tdh">
                  <span className={styles.downloadLink}>TDH</span>
                </a>
              </Col>
              <Col xs={12} sm={6} md={4}>
                <a href="/downloads/rememes">
                  <span className={styles.downloadLink}>Rememes</span>
                </a>
              </Col>
              <Col xs={12} sm={6} md={4}>
                <a href="/downloads/team">
                  <span className={styles.downloadLink}>Team</span>
                </a>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
