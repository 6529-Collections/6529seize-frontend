import { Col, Container, Row } from "react-bootstrap";
import { TokenURI } from "./entities";
import NextGenTokenPreview from "./NextGenTokenPreview";

interface Props {
  collection: number;
  tokens: TokenURI[];
}

export default function NextGenTokenList(props: Props) {
  return (
    <Container className="no-padding">
      <Row>
        {props.tokens.map((t) => (
          <Col
            xs={6}
            sm={4}
            md={3}
            key={`collection-${props.collection}-token-list-${t.id}`}>
            <NextGenTokenPreview token={t} />
          </Col>
        ))}
      </Row>
    </Container>
  );
}
