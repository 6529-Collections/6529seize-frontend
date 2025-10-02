"use client";

import Link from "next/link";
import { Col, Container, Row } from "react-bootstrap";
import styles from "./CommunityDownloads.module.scss";
import useCapacitor from "@/hooks/useCapacitor";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import { useSetTitle } from "@/contexts/TitleContext";

export default function CommunityDownloads() {
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();
  useSetTitle("Open Data");

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
                <Link href="/open-data/network-metrics">
                  <span className={styles.downloadLink}>Network Metrics</span>
                </Link>
              </Col>
              <Col xs={12} sm={6} md={4} className="pt-2 pb-3">
                <Link href="/open-data/consolidated-network-metrics">
                  <span className={styles.downloadLink}>
                    Consolidated Network Metrics
                  </span>
                </Link>
              </Col>
              {(!capacitor.isIos || country === "US") && (
                <Col xs={12} sm={6} md={4} className="pt-2 pb-3">
                  <Link href="/open-data/meme-subscriptions">
                    <span className={styles.downloadLink}>
                      Meme Subscriptions
                    </span>
                  </Link>
                </Col>
              )}
              <Col xs={12} sm={6} md={4} className="pt-2 pb-3">
                <Link href="/open-data/rememes">
                  <span className={styles.downloadLink}>Rememes</span>
                </Link>
              </Col>
              <Col xs={12} sm={6} md={4} className="pt-2 pb-3">
                <Link href="/open-data/team">
                  <span className={styles.downloadLink}>Team</span>
                </Link>
              </Col>
              <Col xs={12} sm={6} md={4} className="pt-2 pb-3">
                <Link href="/open-data/royalties">
                  <span className={styles.downloadLink}>Royalties</span>
                </Link>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
