import { Col, Container, Row } from "react-bootstrap";
import styles from "./CommunityDownloads.module.scss";
import useCapacitor from "../../hooks/useCapacitor";
import { useCookieConsent } from "../cookies/CookieConsentContext";

export default function CommunityDownloads() {
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();
  return (
    <Container fluid>
      <Row>
        <Col>
          <Container className="pt-4">
            <Row>
              <Col>
                <h1>
                  <span className="font-lightest">Open</span> Data
                </h1>
              </Col>
            </Row>
            <Row className="pt-4">
              <Col xs={12} sm={6} md={4} className="pt-2 pb-3">
                <a href="/open-data/network-metrics">
                  <span className={styles.downloadLink}>Network Metrics</span>
                </a>
              </Col>
              <Col xs={12} sm={6} md={4} className="pt-2 pb-3">
                <a href="/open-data/consolidated-network-metrics">
                  <span className={styles.downloadLink}>
                    Consolidated Network Metrics
                  </span>
                </a>
              </Col>
              {(!capacitor.isIos || country === "US") && (
                <Col xs={12} sm={6} md={4} className="pt-2 pb-3">
                  <a href="/open-data/meme-subscriptions">
                    <span className={styles.downloadLink}>
                      Meme Subscriptions
                    </span>
                  </a>
                </Col>
              )}
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
