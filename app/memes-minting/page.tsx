import { Container, Row, Col } from 'react-bootstrap';
import NextMintCard from '@/components/schedule/NextMintCard';
import UpcomingMints from '@/components/schedule/UpcomingMints';
import { getAppMetadata } from '@/components/providers/metadata';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: 'Memes Minting Schedule' });
}

export default function MemesMintingPage() {
  return (
    <Container className="my-4">
      <Row className="g-4">
        <Col md={6}>
          <NextMintCard />
        </Col>
        <Col md={6}>
          <UpcomingMints />
        </Col>
      </Row>
    </Container>
  );
}
