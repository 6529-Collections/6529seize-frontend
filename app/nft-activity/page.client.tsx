"use client";

import LatestActivity from "@/components/latest-activity/LatestActivity";
import { getAppMetadata } from "@/components/providers/metadata";
import { useSetTitle } from "@/contexts/TitleContext";
import styles from "@/styles/Home.module.scss";
import type { Metadata } from "next";
import { Col, Container, Row } from "react-bootstrap";

export default function NFTActivityPage() {
  useSetTitle("NFT Activity | Network");

  return (
    <main className={styles.main}>
      <Container fluid className={styles.leaderboardContainer}>
        <Row>
          <Col>
            <LatestActivity page={1} pageSize={50} showMore />
          </Col>
        </Row>
      </Container>
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "NFT Activity", description: "Network" });
}
