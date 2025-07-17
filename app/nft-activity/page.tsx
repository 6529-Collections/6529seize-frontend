"use client";

import styles from "@/styles/Home.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";
import { useSetTitle } from "@/contexts/TitleContext";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

const LatestActivity = dynamic(() => import("@/components/latest-activity/LatestActivity"), {
  ssr: false,
});

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
