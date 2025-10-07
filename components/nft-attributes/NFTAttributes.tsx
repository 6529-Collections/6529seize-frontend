import { Col, Container, Row } from "react-bootstrap";
import styles from "./NFTAttributes.module.scss";
import { IAttribute } from "@/entities/INFT";

export default function NFTAttributes(
  props: Readonly<{
    attributes: IAttribute[];
  }>
) {
  return (
    <Container className="no-padding">
      <Row>
        {props.attributes.map((a: any) => (
          <Col
            key={a.trait_type}
            xs={{ span: 6 }}
            sm={{ span: 3 }}
            md={{ span: 2 }}
            lg={{ span: 2 }}
            className="pt-2 pb-2">
            <Container>
              <Row>
                <Col className={styles.nftAttribute}>
                  <span>{a.trait_type}</span>
                  <br />
                  <span title={a.value}>{a.value}</span>
                </Col>
              </Row>
            </Container>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
