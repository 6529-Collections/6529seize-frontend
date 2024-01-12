import styles from "../NextGen.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import { addProtocol } from "../../../../helpers/Helpers";
import { useState } from "react";
import { NextGenCollection } from "../../../../entities/INextgen";
import NextGenCollectionProvenance from "./NextGenCollectionProvenance";

interface Props {
  collection: NextGenCollection;
}

export default function NextGenCollectionDetails(props: Readonly<Props>) {
  const [scriptClamped, setScriptClamped] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  function copy(text: any) {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 1000);
  }

  function printScriptClamp() {
    return (
      <span
        className="font-smaller font-color-h cursor-pointer decoration-hover-underline"
        onClick={() => setScriptClamped(!scriptClamped)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setScriptClamped(!scriptClamped);
          }
        }}>
        {scriptClamped ? `Show More` : `Show Less`}
      </span>
    );
  }

  return (
    <>
      <NextGenCollectionProvenance collection={props.collection} />
      <Container className="no-padding pt-5">
        <Row>
          <Col>
            <h3 className="mb-0">About</h3>
          </Col>
        </Row>
        <hr />
        <Row className="pt-2">
          <Col sm={12} md={8}>
            <Container className="no-padding">
              {props.collection.artist_signature && (
                <>
                  <Row>
                    <Col>
                      <b>Artist Signature</b>
                    </Col>
                  </Row>
                  <Row className="pb-4">
                    <Col xs={12} className="pt-2">
                      <div
                        className={styles.artistSignature}
                        dangerouslySetInnerHTML={{
                          __html: props.collection.artist_signature,
                        }}></div>
                    </Col>
                  </Row>
                </>
              )}
              <Row>
                <Col xs={12}>
                  <b>Website</b>
                </Col>
                <Col xs={12}>
                  <a
                    className="font-color text-decoration-none"
                    href={addProtocol(props.collection.website)}
                    target="_blank"
                    rel="noreferrer">
                    {props.collection.website}
                  </a>
                </Col>
              </Row>
              <Row className="pt-3">
                <Col xs={12}>
                  <b>Collection Overview</b>
                </Col>
                <Col xs={12}>{props.collection.description}</Col>
              </Row>
              <Row className="pt-3">
                <Col xs={12}>
                  <b>Licence</b>
                </Col>
                <Col xs={12}>{props.collection.licence}</Col>
              </Row>
              <Row className="pt-3">
                <Col xs={12}>
                  <b>Base URI</b>
                </Col>
                <Col xs={12}>{props.collection.base_uri}</Col>
              </Row>
              <Row className="pt-3">
                <Col xs={12}>
                  <b>Merkle Root</b>
                </Col>
                <Col xs={12}>{props.collection.merkle_root}</Col>
              </Row>
              <Row className="pt-3">
                <Col xs={12}>
                  <b>Library</b>
                </Col>
                <Col xs={12}>
                  {props.collection.library ? props.collection.library : "-"}
                </Col>
              </Row>
            </Container>
          </Col>
        </Row>
      </Container>
    </>
  );
}
