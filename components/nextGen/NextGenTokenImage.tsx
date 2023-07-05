import styles from "./NextGen.module.scss";
import { useState } from "react";
import { useContractRead } from "wagmi";
import { NEXT_GEN_ABI } from "../../abis";
import { NEXT_GEN_CONTRACT } from "../../constants";
import { Col, Container, Row } from "react-bootstrap";
import { TokenURI } from "./entities";

interface Props {
  token: TokenURI;
  preview?: boolean;
}

export default function NextGenTokenImage(props: Props) {
  return (
    <Container className="no-padding">
      <Row>
        <Col style={{ position: "relative" }}>
          <iframe
            srcDoc={props.token.uri}
            className={
              props.preview
                ? styles.renderedHtmlContainerPreview
                : styles.renderedHtmlContainer
            }
          />
          <div
            className={`${styles.tokenImageOverlay} ${
              props.preview ? `cursor-pointer` : ``
            }`}
            onClick={() => {
              if (props.preview) {
                window.location.href = `/nextgen/${props.token.collection}/${props.token.id}`;
              }
            }}></div>
        </Col>
      </Row>
    </Container>
  );
}
