import styles from "./NextGen.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import { useContractRead } from "wagmi";
import { useState } from "react";
import {
  AdditionalData,
  EMPTY_TOKEN_URI,
  Info,
  PhaseTimes,
  TokenURI,
} from "../nextgen_entities";
import { NEXTGEN_CHAIN_ID, NEXTGEN_CORE } from "../nextgen_contracts";
import NextGenTokenPreview from "./NextGenTokenPreview";
import {
  extractAttributes,
  extractField,
  extractURI,
  retrieveCollectionAdditionalData,
  retrieveCollectionInfo,
  retrieveCollectionPhases,
} from "../nextgen_helpers";

interface Props {
  collection: number;
  setPhaseTimes: (phaseTimes: PhaseTimes) => void;
}

export default function NextGenCollectionPreview(props: Props) {
  const [sampleToken, setSampleToken] = useState<number>();
  const [sampleTokenUri, setSampleTokenUri] =
    useState<TokenURI>(EMPTY_TOKEN_URI);
  const [info, setInfo] = useState<Info>();
  const [additionalData, setAdditionalData] = useState<AdditionalData>();
  const [phaseTimes, setPhaseTimes] = useState<PhaseTimes>();

  useContractRead({
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "viewTokensIndexMin",
    watch: true,
    args: [props.collection],
    onSettled(data: any, error: any) {
      if (data) {
        setSampleToken(parseInt(data));
      }
    },
  });

  useContractRead({
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "tokenURI",
    enabled: sampleToken != undefined,
    args: [sampleToken],
    onSettled(data: any, error: any) {
      if (sampleToken && data) {
        if (data.startsWith("data") && sampleToken) {
          const uri = extractURI(data);
          const name = extractField("name", data);
          const description = extractField("description", data);
          const image = extractField("image", data);
          const attrs = extractAttributes(data);
          setSampleTokenUri({
            id: sampleToken,
            collection: props.collection,
            uri: uri.uri,
            data: uri.data,
            name: name,
            image: image,
            description: description,
            attributes: attrs,
          });
        } else {
          setSampleTokenUri({
            id: sampleToken,
            collection: props.collection,
            uri: data,
            name: "",
            description: "",
            attributes: [],
          });
        }
      }
    },
  });

  retrieveCollectionInfo(props.collection, (data: Info) => {
    setInfo(data);
  });

  retrieveCollectionAdditionalData(props.collection, (data: AdditionalData) => {
    setAdditionalData(data);
  });

  retrieveCollectionPhases(props.collection, (data: PhaseTimes) => {
    setPhaseTimes(data);
    props.setPhaseTimes(data);
  });

  if (!additionalData || additionalData.total_supply == 0) {
    return <></>;
  }

  return (
    <a
      href={`/nextgen/collection/${props.collection}`}
      className="decoration-none scale-hover">
      <Container className={styles.collectionPreview}>
        <Row>
          <Col>
            <NextGenTokenPreview hide_info={true} token={sampleTokenUri} />
          </Col>
        </Row>
        <Row>
          <Col>
            <Container className={styles.collectionPreviewTitle}>
              {info && (
                <>
                  <Row>
                    <Col className="font-larger">
                      <b>
                        #{props.collection} - {info.name}
                      </b>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      by <b>{info.artist}</b>
                    </Col>
                  </Row>
                </>
              )}
              <Row>
                <Col className="font-color-h d-flex">
                  {additionalData && additionalData.circulation_supply > 0 && (
                    <>
                      {additionalData.circulation_supply} /{" "}
                      {additionalData.total_supply} minted
                    </>
                  )}
                </Col>
              </Row>
            </Container>
          </Col>
        </Row>
      </Container>
    </a>
  );
}
