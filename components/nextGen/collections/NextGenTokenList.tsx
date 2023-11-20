import { Col, Container, Row } from "react-bootstrap";
import NextGenTokenPreview from "./NextGenTokenPreview";

interface Props {
  collection: number;
  tokens: number[];
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
            key={`collection-${props.collection}-token-list-${t}`}>
            <NextGenTokenPreview token_id={t} collection={props.collection} />
          </Col>
        ))}
      </Row>
    </Container>
  );
}
