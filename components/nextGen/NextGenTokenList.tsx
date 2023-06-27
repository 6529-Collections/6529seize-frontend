import styles from "./NextGen.module.scss";
import NextGenTokenImage from "./NextGenTokenImage";
import { Col, Container, Row } from "react-bootstrap";
import { TokenURI } from "./entities";

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
            <Container className="no-padding pt-3 pb-3">
              <Row>
                <Col className="text-center">
                  <NextGenTokenImage
                    collection={props.collection}
                    id={t.id}
                    preview={true}
                  />
                </Col>
              </Row>
              <Row>
                <Col className="text-center">
                  <a
                    href={`/nextgen/${props.collection}/${t.id}`}
                    className="decoration-none">
                    Token #{t.id}
                  </a>
                </Col>
              </Row>
            </Container>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
