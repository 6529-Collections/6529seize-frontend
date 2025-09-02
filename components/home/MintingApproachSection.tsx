import Link from "next/link";
import { Col, Row } from "react-bootstrap";

interface MintingApproachSectionProps {
 readonly nftId: number;
}

export default function MintingApproachSection({
  nftId,
}: MintingApproachSectionProps) {
  return (
    <>
      <Row>
        <Col>
          <h3>Minting Approach</h3>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <Link href={`/the-memes/${nftId}/distribution`}>
            Distribution Plan
          </Link>
        </Col>
      </Row>
    </>
  );
}
