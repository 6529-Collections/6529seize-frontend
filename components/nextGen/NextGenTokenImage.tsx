import styles from "./NextGen.module.scss";
import { Col, Container, Row } from "react-bootstrap";
import { TokenURI } from "./entities";
import Image from "next/image";
import { parseIpfsUrl } from "../../helpers/Helpers";
import { useEffect, useState } from "react";

interface Props {
  token: TokenURI;
  preview?: boolean;
  setMetadata?: (url: string) => void;
  setName?: (name: string) => void;
  setDescription?: (description: string) => void;
}

export default function NextGenTokenImage(props: Props) {
  const [image, setImage] = useState<string>();
  const [animation, setAnimation] = useState<string>();

  useEffect(() => {
    if (!props.token.data) {
      let url = parseIpfsUrl(props.token.uri);
      if (props.setMetadata) {
        props.setMetadata(url);
      }
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data.image) setImage(parseIpfsUrl(data.image));
          if (data.animation_url)
            setAnimation(parseIpfsUrl(data.animation_url));
          if (data.name && props.setName) props.setName(data.name);
          if (data.description && props.setDescription)
            props.setDescription(data.description);
        });
    }
  }, []);

  return (
    <Container className="no-padding">
      <Row>
        <Col style={{ position: "relative" }}>
          {props.token.data ? (
            <iframe
              srcDoc={props.token.uri}
              className={
                props.preview
                  ? styles.renderedHtmlContainerPreview
                  : styles.renderedHtmlContainer
              }
            />
          ) : animation ? (
            <iframe
              src={animation}
              className={
                props.preview
                  ? styles.renderedHtmlContainerPreview
                  : styles.renderedHtmlContainer
              }
            />
          ) : image ? (
            <Image
              loading={"eager"}
              width="0"
              height="0"
              style={{ height: "auto", width: "100%" }}
              src={image}
              alt={props.token.name}
            />
          ) : (
            ``
          )}
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
