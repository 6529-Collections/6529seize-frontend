import styles from "../NextGen.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import { addProtocol, formatAddress } from "../../../../helpers/Helpers";
import { NextGenCollection } from "../../../../entities/INextgen";
import NextGenCollectionProvenance from "./NextGenCollectionProvenance";
import { ContentView } from "./NextGenCollection";
import { NEXTGEN_CHAIN_ID, NEXTGEN_CORE } from "../../nextgen_contracts";
import { goerli, sepolia } from "viem/chains";
import Tippy from "@tippyjs/react";

interface Props {
  collection: NextGenCollection;
  view: ContentView;
}

export default function NextGenCollectionDetails(props: Readonly<Props>) {
  if (props.view === ContentView.PROVENANCE) {
    return <NextGenCollectionProvenance collection={props.collection} />;
  }

  function getEtherscanLink() {
    let chainName = "";
    if (NEXTGEN_CHAIN_ID === sepolia.id) {
      chainName = "sepolia.";
    }
    if (NEXTGEN_CHAIN_ID === goerli.id) {
      chainName = "goerli.";
    }

    return `https://${chainName}etherscan.io/address/${NEXTGEN_CORE[NEXTGEN_CHAIN_ID]}`;
  }

  return (
    <Container className="no-padding">
      <Row>
        <Col>
          <Container className="no-padding">
            <Row>
              <Col sm={12} md={4}>
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
                  <Col xs={12} className="pt-2 pb-2 d-flex flex-column">
                    <span className="font-color-h">Website</span>
                    <span>
                      <a
                        className="font-color text-decoration-none"
                        href={addProtocol(props.collection.website)}
                        target="_blank"
                        rel="noreferrer">
                        {props.collection.website}
                      </a>
                    </span>
                  </Col>
                  <Col xs={12} className="pt-2 pb-2 d-flex gap-5">
                    <span className="d-flex flex-column">
                      <span className="font-color-h">License</span>
                      <span>{props.collection.licence}</span>
                    </span>
                    <span className="d-flex flex-column">
                      <span className="font-color-h">Library</span>
                      <span>
                        {props.collection.library
                          ? props.collection.library
                          : "-"}
                      </span>
                    </span>
                  </Col>
                  <Col xs={12} className="pt-2 pb-2 d-flex flex-column">
                    <span className="font-color-h">Contract</span>
                    <span>
                      <Tippy
                        content={NEXTGEN_CORE[NEXTGEN_CHAIN_ID]}
                        placement={"right"}
                        theme={"light"}
                        delay={500}>
                        <a
                          className="font-color text-decoration-none"
                          href={getEtherscanLink()}
                          target="_blank"
                          rel="noreferrer">
                          {formatAddress(NEXTGEN_CORE[NEXTGEN_CHAIN_ID])}
                        </a>
                      </Tippy>
                    </span>
                  </Col>
                </Row>
              </Col>
              <Col sm={12} md={8} className="pt-2 pb-2 d-flex flex-column">
                <span className="font-color-h">Collection Overview</span>
                <span>{props.collection.description}</span>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
