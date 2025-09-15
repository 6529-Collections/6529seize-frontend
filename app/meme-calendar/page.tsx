import { getAppMetadata } from "@/components/providers/metadata";
import MemesMintingCalendar from "@/components/schedule/MemesMintingCalendar"; // + add
import type { Metadata } from "next";
import { Col, Container, Row } from "react-bootstrap";

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "Memes Minting Calendar" });
}

export default function MemesMintingCalendarPage() {
  return (
    // <div className="tw-container tw-mx-auto tw-px-4 tw-my-6">
    <Container className="tw-pt-6 tw-pb-8">
      <Row>
        <Col>
          <MemesMintingCalendar />
        </Col>
      </Row>
    </Container>
    // </div>
  );
}
