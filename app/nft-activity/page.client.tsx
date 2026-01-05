"use client";

import LatestActivity from "@/components/latest-activity/LatestActivity";
import { useSetTitle } from "@/contexts/TitleContext";
import styles from "@/styles/Home.module.scss";
import { Col, Container, Row } from "react-bootstrap";

export default function NFTActivityPage() {
  useSetTitle("NFT Activity | Network");

  return (
    <main className={styles["main"]}>
      <Container fluid className={styles["leaderboardContainer"]}>
        <Row>
          <Col>
            <LatestActivity page={1} pageSize={50} showMore />
          </Col>
        </Row>
      </Container>
    </main>
  );
}
