import styles from "./NextGen.module.scss";
import { Col, Container, Row } from "react-bootstrap";
import { TokenURI } from "../nextgen_entities";
import Image from "next/image";
import { parseIpfsUrl } from "../../../helpers/Helpers";
import { useEffect, useState } from "react";

interface Props {
  token: TokenURI;
  show_link?: boolean;
  preview?: boolean;
  setMetadata?: (url: string) => void;
  setName?: (name: string) => void;
  setDescription?: (description: string) => void;
}

export function NextGenTokenImageContent(props: Props) {
  const [image, setImage] = useState<string>();
  const [animation, setAnimation] = useState<string>();

  useEffect(() => {
    setImage(props.token.image);
  }, [props.token.image]);

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
          if (!props.preview && data.animation_url) {
            setAnimation(parseIpfsUrl(data.animation_url));
          }
          if (data.name && props.setName) props.setName(data.name);
          if (data.description && props.setDescription)
            props.setDescription(data.description);
        });
    }
  }, [props.token]);

  return (
    <>
      {props.token.data && !props.token.image && !props.preview ? (
        <iframe srcDoc={props.token.uri} />
      ) : animation ? (
        <iframe src={animation} />
      ) : image ? (
        <Image
          loading={"eager"}
          width="0"
          height="0"
          style={{
            height: "auto",
            width: image.startsWith("data") ? "100%" : "auto",
            maxHeight: "100%",
            maxWidth: "100%",
          }}
          src={`https://d3lqz0a4bldqgf.cloudfront.net/nextgen/tokens/images/${props.token.id}.png`}
          onError={({ currentTarget }) => {
            currentTarget.src = image;
          }}
          alt={props.token.name}
        />
      ) : (
        ``
      )}
    </>
  );
}

export default function NextGenTokenImage(props: Props) {
  return (
    <Container className="no-padding">
      <Row>
        <Col
          style={{ position: "relative" }}
          className={
            props.preview
              ? styles.tokenFrameContainer
              : styles.tokenFrameContainerFull
          }>
          <NextGenTokenImageContent
            token={props.token}
            preview={props.preview}
            setMetadata={props.setMetadata}
            setName={props.setName}
            setDescription={props.setDescription}
          />
          <div
            className={`${styles.tokenImageOverlay} ${
              props.show_link ? `cursor-pointer` : ``
            }`}
            onClick={() => {
              if (props.show_link) {
                window.location.href = `/nextgen/token/${props.token.id}`;
              }
            }}></div>
        </Col>
      </Row>
    </Container>
  );
}
