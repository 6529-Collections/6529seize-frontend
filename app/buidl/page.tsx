"use client";

import styles from "@/styles/Home.module.scss";
import Image from "next/image";
import { Container, Row, Col } from "react-bootstrap";
import { useSetTitle } from "@/contexts/TitleContext";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

export default function BuidlPage() {
  useSetTitle("BUIDL");

  return (
    <main className={styles.main}>
      <Container fluid className={`${styles.pageNotFound} text-center`}>
        <Row>
          <Col>
            <Image src="/SummerGlasses.svg" width={100} height={100} alt="SummerGlasses" />
          </Col>
        </Row>
        <Row>
          <Col>
            <h4>
              <p>
                We are going to BUIDL together to spread the word about a decentralized metaverse.
              </p>
              <p>Tools to help in this goal are coming soon.</p>
            </h4>
          </Col>
        </Row>
      </Container>
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "BUIDL" });
}
