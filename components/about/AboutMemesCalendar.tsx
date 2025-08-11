"use client";

import { Container, Row, Col } from "react-bootstrap";
import NextMintCard from "@/components/schedule/NextMintCard";
import UpcomingMints from "@/components/schedule/UpcomingMints";

export default function AboutMemesCalendar() {
  return (
    <Container>
      <Row className="pt-3">
        <Col md={6} className="mb-4">
          <NextMintCard />
        </Col>
        <Col md={6} className="mb-4">
          <UpcomingMints />
        </Col>
      </Row>
    </Container>
  );
}
