import MemeCalendarDetails from "@/components/meme-calendar/MemeCalendarDetails";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";
import { Col, Container, Row } from "react-bootstrap";

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "Memes Minting Calendar 101" });
}

export default function MemesMintingPage() {
  return (
    <Container className="tw-pt-6 tw-pb-8">
      <Row>
        <Col>
          <MemeCalendarDetails />
        </Col>
      </Row>
    </Container>
  );
}
