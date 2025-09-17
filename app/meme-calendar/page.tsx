import MemesMintingCalendar from "@/components/meme-calendar/MemesMintingCalendar";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";
import { Col, Container, Row } from "react-bootstrap";

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "Memes Minting Calendar" });
}

export default function MemesMintingCalendarPage() {
  return (
    <Container className="tw-pt-6 tw-pb-8">
      <Row>
        <Col>
          <MemesMintingCalendar />
        </Col>
      </Row>
    </Container>
  );
}
