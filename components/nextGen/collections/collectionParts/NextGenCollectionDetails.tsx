import styles from "../NextGen.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import { addProtocol, formatAddress } from "../../../../helpers/Helpers";
import { NextGenCollection } from "../../../../entities/INextgen";
import NextGenCollectionProvenance from "./NextGenCollectionProvenance";
import { ContentView } from "./NextGenCollection";
import { NEXTGEN_CHAIN_ID, NEXTGEN_CORE } from "../../nextgen_contracts";
import { goerli, sepolia } from "viem/chains";
import Tippy from "@tippyjs/react";

interface CollectionProps {
  collection: NextGenCollection;
}

interface Props extends CollectionProps {
  view: ContentView;
}

function NextGenCollectionDetailsOverview(props: Readonly<CollectionProps>) {
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
              <Col sm={12} md={4} className="pt-2 pb-2">
                {props.collection.artist_signature && (
                  <>
                    <Row>
                      <Col className="font-color-h">Artist Signature</Col>
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

function NextGenCollectionDetailsAbout(props: Readonly<CollectionProps>) {
  return (
    <Container className="no-padding">
      <Row>
        <Col>
          <p>
            Lorem ipsum dolor sit amet, ius an idque falli periculis, vero
            eligendi recteque et nam, sea detraxit phaedrum periculis ne. No
            prima soluta sea. Has cu praesent dignissim vulputate, mel cu
            placerat accusata. Solum latine adversarium id mei, ea mel nonumy
            commune, consul fabulas an vel. Pri in adipisci praesent urbanitas,
            legimus imperdiet vituperatoribus has cu, ex possim definiebas per.
          </p>
          <p>
            Quando suavitate sea ei, duo ut propriae singulis quaerendum. Sumo
            partem duo ut, agam aliquando ne eos. Pro delenit adipisci at, no
            mei eligendi dissentias consectetuer. Ut solum fastidii vel, ei quo
            invidunt evertitur disputando.
          </p>
          <p>
            Ne omittam appareat nec, cum modo iisque intellegebat cu. Has no
            altera dolorem appetere, sea omnes corpora fastidii cu. Munere
            epicuri id duo. Justo voluptua moderatius usu ei, partiendo
            disputationi ne eos. Bonorum pertinacia eloquentiam at ius, id
            molestie appetere dissentias sea. Omnes inimicus ad sit.
          </p>
          <p>
            Quo ipsum phaedrum definitiones ei. Mea eu ornatus minimum, ut
            eruditi conceptam usu, id albucius urbanitas adversarium eum.
            Eripuit eloquentiam mel ex, id has unum facilisi voluptaria. Pro
            illum complectitur ut, id cetero constituto accommodare cum, sed ea
            deleniti voluptatibus. No per modus assum omnes, nostro offendit
            ocurreret mel ad.
          </p>
          <p>
            Everti viderer legendos ne cum, per epicuri suscipit percipit et,
            mel verear nostrud convenire cu. Mazim quando eum at. Id vel posse
            fugit cetero, ne agam detracto eum. Scriptorem necessitatibus no
            vis.
          </p>
        </Col>
      </Row>
    </Container>
  );
}

export default function NextGenCollectionDetails(props: Readonly<Props>) {
  if (props.view === ContentView.PROVENANCE) {
    return <NextGenCollectionProvenance collection={props.collection} />;
  } else if (props.view === ContentView.OVERVIEW) {
    return <NextGenCollectionDetailsOverview collection={props.collection} />;
  } else {
    return <NextGenCollectionDetailsAbout collection={props.collection} />;
  }
}
