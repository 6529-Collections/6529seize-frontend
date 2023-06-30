import styles from "./NextGen.module.scss";
import { useState } from "react";
import { useContractRead } from "wagmi";
import { NEXT_GEN_ABI } from "../../abis";
import { NEXT_GEN_CONTRACT } from "../../constants";
import { Col, Container, Row } from "react-bootstrap";

interface Props {
  collection: number;
  id: number;
  preview?: boolean;
  onSetAnimationUrl?(url: string): void;
}

export default function NextGenTokenImage(props: Props) {
  const [htmlContent, setHtmlContent] = useState<string>();

  function extractContent(s: string) {
    const regex = /"animation_url":"([^"]+)"/;
    const match = s.match(regex);
    if (match && match.length >= 2) {
      const animationUrl = match[1];
      if (props.onSetAnimationUrl) {
        props.onSetAnimationUrl(animationUrl);
      }
      const base64Data = animationUrl.split(",")[1];
      const uri = Buffer.from(base64Data, "base64").toString("utf-8");
      return uri;
    } else {
      return "";
    }
  }

  useContractRead({
    address: NEXT_GEN_CONTRACT.contract,
    abi: NEXT_GEN_ABI,
    chainId: NEXT_GEN_CONTRACT.chain_id,
    functionName: "tokenURI",
    watch: true,
    args: [props.id],
    onSettled(data: any, error: any) {
      if (data) {
        const content = extractContent(data);
        setHtmlContent(content);
      } else {
        window.location.href = "/404";
      }
    },
  });
  return (
    <Container className="no-padding">
      <Row>
        <Col style={{ position: "relative" }}>
          <iframe
            srcDoc={htmlContent}
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
                window.location.href = `/nextgen/${props.collection}/${props.id}`;
              }
            }}></div>
        </Col>
      </Row>
    </Container>
  );
}
