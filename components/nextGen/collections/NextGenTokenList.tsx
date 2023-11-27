import { Col, Container, Row } from "react-bootstrap";
import NextGenTokenPreview from "./NextGenTokenPreview";

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
            md={3}
            key={`collection-${props.collection}-token-list-${t}`}>
            <NextGenTokenPreview
              token_id={t}
              collection={props.collection}
              hide_info={props.hide_info}
            />
          </Col>
        ))}
      </Row>
    </Container>
  );
}
