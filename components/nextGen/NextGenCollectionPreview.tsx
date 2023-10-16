import styles from "./NextGen.module.scss";
import { Container, Row, Col, Table } from "react-bootstrap";
import { useContractRead } from "wagmi";
import { useState } from "react";
import { COLLECTION_PREVIEWS } from "./NextGen";
import Image from "next/image";
import { AdditionalData, Info } from "./entities";
import { NEXTGEN_CHAIN_ID, NEXTGEN_CORE } from "./contracts";

interface Props {
  collection: number;
}

export default function NextGenCollectionPreview(props: Props) {
  const [info, setInfo] = useState<Info>();
  const [additionalData, setAdditionalData] = useState<AdditionalData>();

  useContractRead({
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "retrieveCollectionInfo",
    watch: true,
    args: [props.collection],
    onSettled(data: any, error: any) {
      if (data) {
        const d = data as any[];
        const i1: Info = {
          name: d[0],
          artist: d[1],
          description: d[2],
          website: d[3],
          licence: d[4],
          base_uri: d[5],
        };
        setInfo(i1);
      }
    },
  });

  useContractRead({
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "retrieveCollectionAdditionalData",
    watch: true,
    args: [props.collection],
    onSettled(data: any, error: any) {
      if (data) {
        const d = data as any[];
        const ad1: AdditionalData = {
          artist_address: d[0],
          max_purchases: parseInt(d[1]),
          circulation_supply: parseInt(d[2]),
          total_supply: parseInt(d[3]),
        };
        setAdditionalData(ad1);
      }
    },
  });

  return (
    <a
      href={`/nextgen/collection/${props.collection}`}
      className="decoration-none scale-hover">
      <Container className={styles.collectionPreview}>
        <Row>
          <Col>
            <Image
              loading={"lazy"}
              width="0"
              height="0"
              style={{
                height: "auto",
                width: "auto",
                maxWidth: "100%",
                maxHeight: "100%",
                padding: "30px",
              }}
              src={`${COLLECTION_PREVIEWS}/${props.collection}.png`}
              alt={`${props.collection}-preview`}
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <Container className={styles.collectionPreview}>
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
                    <>{additionalData.circulation_supply} Minted</>
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
