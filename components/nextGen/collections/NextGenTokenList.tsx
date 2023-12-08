import { Col, Container, Row } from "react-bootstrap";
import { NextGenTokenImage } from "./NextGenTokenImage";

interface Props {
  collection: number;
  tokens: number[];
  hide_info: boolean;
}

export default function NextGenTokenList(props: Readonly<Props>) {
  return (
    <Container className="no-padding">
      <Row>
        {props.tokens.map((t) => (
          <Col
            xs={6}
            sm={4}
            md={4}
            key={`collection-${props.collection}-token-list-${t}`}
            className="pt-2 pb-2">
            <NextGenTokenImage collection={props.collection} token_id={t} />
          </Col>
        ))}
      </Row>
    </Container>
  );
}
