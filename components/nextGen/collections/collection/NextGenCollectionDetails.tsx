import styles from "../NextGen.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import {
  AdditionalData,
  Info,
  LibraryScript,
  MintingDetails,
  PhaseTimes,
  TokenURI,
} from "../../nextgen_entities";
import { fromGWEI } from "../../../../helpers/Helpers";
import { NextGenTokenImageContent } from "../NextGenTokenImage";
import { useState } from "react";
import {
  retrieveCollectionCosts,
  retrieveCollectionLibraryAndScript,
} from "../../nextgen_helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";

interface Props {
  collection: number;
  additional_data: AdditionalData;
  info: Info;
  phase_times: PhaseTimes;
  token_uris: TokenURI[];
  burn_amount: number;
  token_start_index: number;
  token_end_index: number;
  mint_price: number;
  artist_signature: string;
}

export default function NextGenCollectionDetails(props: Props) {
  const [mintingDetails, setMintingDetails] = useState<MintingDetails>();
  const [libraryScript, setLibraryScript] = useState<LibraryScript>();

  const [scriptClamped, setScriptClamped] = useState<boolean>(true);

  const [isCopied, setIsCopied] = useState<boolean>(false);

  function copy(text: any) {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 1000);
  }

  retrieveCollectionCosts(props.collection, (data: MintingDetails) => {
    setMintingDetails(data);
  });

  retrieveCollectionLibraryAndScript(
    props.collection,
    (data: LibraryScript) => {
      setLibraryScript(data);
    }
  );

  return (
    <Container className="no-padding">
      <Row>
        <Col sm={12} md={5} className="pt-3">
          <Container className="no-padding">
            <Row className="pb-3">
              <Col className={styles.tokenFrameContainerHalf}>
                {props.token_uris.length > 0 && (
                  <NextGenTokenImageContent
                    preview={true}
                    token={props.token_uris[0]}
                  />
                )}
              </Col>
            </Row>
            <Row>
              {props.token_start_index > 0 && props.token_end_index > 0 && (
                <Col xs={12} className="pb-2">
                  Token Indexes{" "}
                  <b>
                    {props.token_start_index} - {props.token_end_index}
                  </b>
                </Col>
              )}
              <Col xs={12} className="pb-2">
                Total Supply <b>x{props.additional_data.total_supply}</b>
              </Col>
              <Col xs={12} className="pb-2">
                Minted <b>x{props.additional_data.circulation_supply}</b>
              </Col>
              {props.burn_amount > 0 && (
                <Col xs={12} className="pb-2">
                  <span>
                    Burnt <b>x{props.burn_amount}</b>
                  </span>
                </Col>
              )}
              <Col xs={12} className="pb-2">
                Available{" "}
                <b>
                  {props.additional_data.total_supply -
                    props.additional_data.circulation_supply -
                    props.burn_amount >
                  0
                    ? `x${
                        props.additional_data.total_supply -
                        props.additional_data.circulation_supply -
                        props.burn_amount
                      }`
                    : `-`}
                </b>
              </Col>
              <Col xs={12} className="pb-2">
                Mint Cost{" "}
                <b>
                  {props.mint_price > 0 ? fromGWEI(props.mint_price) : `Free`}{" "}
                  {props.mint_price > 0 ? `ETH` : ``}
                </b>
              </Col>
              <Col xs={12} className="pb-2">
                <span>
                  Max Purchases (Public Phase){" "}
                  <b>x{props.additional_data.max_purchases}</b>
                </span>
              </Col>
            </Row>
          </Container>
        </Col>
        <Col sm={12} md={7} className="pt-3">
          <Container className="no-padding">
            {props.artist_signature && (
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
                        __html: props.artist_signature,
                      }}></div>
                  </Col>
                </Row>
              </>
            )}
            <Row>
              <Col xs={12}>
                <b>Collection Overview</b>
              </Col>
              <Col xs={12}>{props.info.description}</Col>
            </Row>
            <Row className="pt-3">
              <Col xs={12}>
                <b>Licence</b>
              </Col>
              <Col xs={12}>{props.info.licence}</Col>
            </Row>
            <Row className="pt-3">
              <Col xs={12}>
                <b>Base URI</b>
              </Col>
              <Col xs={12}>{props.info.base_uri}</Col>
            </Row>
            <Row className="pt-3">
              <Col xs={12}>
                <b>Merkle Root</b>
              </Col>
              <Col xs={12}>{props.phase_times.merkle_root}</Col>
            </Row>
            {mintingDetails && (
              <Row className="pt-3">
                <Col xs={12}>
                  <b>Delegation Address</b>
                </Col>
                <Col xs={12}>
                  {mintingDetails.del_address
                    ? mintingDetails.del_address
                    : "-"}
                </Col>
              </Row>
            )}
            {libraryScript && (
              <>
                <Row className="pt-3">
                  <Col xs={12}>
                    <b>Library</b>
                  </Col>
                  <Col xs={12}>
                    {libraryScript.library ? libraryScript.library : "-"}
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col
                    xs={12}
                    className="d-flex align-items-center justify-content-between">
                    <span>
                      <b>Script</b>
                    </span>
                    <Tippy
                      content={isCopied ? "Copied" : "Copy"}
                      placement={"top"}
                      theme={"light"}
                      hideOnClick={false}>
                      <FontAwesomeIcon
                        icon="copy"
                        name={`copy-btn`}
                        aria-label={`copy-btn`}
                        className={styles.copyIcon}
                        onClick={() => copy(libraryScript.script)}
                      />
                    </Tippy>
                  </Col>
                  <Col xs={12} className="d-flex flex-column pt-1">
                    {libraryScript.script ? (
                      <>
                        <code
                          className={`${styles.codeBlock} ${
                            scriptClamped ? "area-clamped" : "area-expanded"
                          }`}>
                          {libraryScript.script}
                        </code>
                        <span
                          className="font-smaller font-color-h cursor-pointer decoration-hover-underline"
                          onClick={() => setScriptClamped(!scriptClamped)}>
                          {scriptClamped ? `Show More` : `Show Less`}
                        </span>
                      </>
                    ) : (
                      "-"
                    )}
                  </Col>
                </Row>
              </>
            )}
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
