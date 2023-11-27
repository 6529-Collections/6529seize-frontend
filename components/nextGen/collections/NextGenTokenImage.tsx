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
  hide_background?: boolean;
  setMetadata?: (url: string) => void;
  setName?: (name: string) => void;
  setDescription?: (description: string) => void;
}

export function NextGenTokenImageContent(props: Readonly<Props>) {
  const [image, setImage] = useState<string>();
  const [animation, setAnimation] = useState<string>();

  const generatorUrl = `https://nextgen-generator.seize.io/png/${props.token.id}`;
  const cloudfrontUrl = `https://d3lqz0a4bldqgf.cloudfront.net/nextgen/tokens/images/${props.token.id}.png`;

  useEffect(() => {
    setImage(props.token.image);
  }, [props.token.image]);

  useEffect(() => {
    if (!props.token.data && props.token.uri) {
      let url = parseIpfsUrl(props.token.uri);
      if (props.setMetadata) {
        props.setMetadata(url);
      }
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data.image) {
            setImage(parseIpfsUrl(data.image));
          }
          if (!props.preview && data.animation_url) {
            setAnimation(parseIpfsUrl(data.animation_url));
          }
          if (data.name && props.setName) props.setName(data.name);
          if (data.description && props.setDescription)
            props.setDescription(data.description);
        })
        .catch((err) => {
          // ignore err
        });
    }
  }, [props.token]);

  let content;

  if (props.token.data && !props.token.image && !props.preview) {
    content = <iframe srcDoc={props.token.uri} />;
  } else if (animation) {
    content = <iframe src={animation} />;
  } else {
    content = (
      <Image
        priority
        loading={"eager"}
        width="0"
        height="0"
        style={{
          height: "auto",
          width: image?.startsWith("data") ? "100%" : "auto",
          maxHeight: "100%",
          maxWidth: "100%",
        }}
        src={cloudfrontUrl}
        onError={({ currentTarget }) => {
          if (currentTarget.src === cloudfrontUrl) {
            currentTarget.src = generatorUrl;
          }
          if (image) {
            currentTarget.src = image;
          }
        }}
        alt={props.token.name}
      />
    );
  }

  return <>{content}</>;
}

export default function NextGenTokenImage(props: Readonly<Props>) {
  return (
    <Container className="no-padding">
      <Row>
        <Col
          style={{ position: "relative" }}
          className={`
            ${
              props.preview
                ? styles.tokenFrameContainer
                : styles.tokenFrameContainerFull
            } ${!props.hide_background ? styles.tokenFrameBackground : ""}`}>
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
            }}
            onKeyDown={(e) => {
              if (props.show_link && (e.key === "Enter" || e.key === " ")) {
                window.location.href = `/nextgen/token/${props.token.id}`;
              }
            }}
            tabIndex={0}></div>
        </Col>
      </Row>
    </Container>
  );
}
