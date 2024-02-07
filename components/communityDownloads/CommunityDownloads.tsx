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
                <h1>Open Data</h1>
              </Col>
            </Row>
            <Row className="pt-4">
              <Col xs={12} sm={6} md={4} className="pt-2 pb-3">
                <a href="/open-data/community-metrics">
                  <span className={styles.downloadLink}>Community Metrics</span>
                </a>
              </Col>
              <Col xs={12} sm={6} md={4} className="pt-2 pb-3">
                <a href="/open-data/consolidated-community-metrics">
                  <span className={styles.downloadLink}>
                    Consolidated Community Metrics
                  </span>
                </a>
              </Col>
              <Col xs={12} sm={6} md={4} className="pt-2 pb-3">
                <a href="/open-data/rememes">
                  <span className={styles.downloadLink}>Rememes</span>
                </a>
              </Col>
              <Col xs={12} sm={6} md={4} className="pt-2 pb-3">
                <a href="/open-data/team">
                  <span className={styles.downloadLink}>Team</span>
                </a>
              </Col>
              <Col xs={12} sm={6} md={4} className="pt-2 pb-3">
                <a href="/open-data/royalties">
                  <span className={styles.downloadLink}>Royalties</span>
                </a>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
