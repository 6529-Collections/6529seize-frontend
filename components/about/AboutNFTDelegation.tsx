import { Col, Container, Row } from "react-bootstrap";
import styles from "./About.module.scss";
import { sepolia } from "wagmi/chains";
import { DELEGATION_CONTRACT } from "../../constants";

interface Props {
  html: string;
}

export default function AboutNFTDelegation(props: Props) {
  return (
    <>
      <Container>
        <Row>
          <Col className="text-center">
            <h1 className="float-none">NFT DELEGATION</h1>
          </Col>
        </Row>
        <Row className="pt-2 pb-2 text-center">
          <Col>
            <h5 className="float-none">
              <a href="/delegations-center">Go to Delegations Center</a>
            </h5>
          </Col>
        </Row>
        <Row className="pt-3 pb-3">
          <Col
            className={styles.htmlContainer}
            dangerouslySetInnerHTML={{
              __html: props.html,
            }}></Col>
        </Row>
      </Container>
    </>
  );
}
