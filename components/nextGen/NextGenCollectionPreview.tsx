import styles from "./NextGen.module.scss";
import { Container, Row, Col, Table } from "react-bootstrap";
import { useAccount, useChainId, useContractRead } from "wagmi";
import { NEXT_GEN_CONTRACT } from "../../constants";
import { NEXT_GEN_ABI } from "../../abis";
import { useState } from "react";
import { COLLECTION_PREVIEWS } from "./NextGen";
import Image from "next/image";

interface Info1 {
  name: string;
  artist: string;
  description: string;
  website: string;
  licence: string;
  base_uri: string;
}

interface AdditionalData1 {
  artist_address: string;
  mint_cost: number;
  max_purchases: number;
  circulation_supply: number;
  total_supply: number;
  available: number;
}

interface Props {
  collection: number;
}

export default function NextGenCollectionPreview(props: Props) {
  const account = useAccount();
  const chainId = useChainId();
  const [info1, setInfo1] = useState<Info1>();
  const [additionalData1, setAdditionalData1] = useState<AdditionalData1>();

  useContractRead({
    address: NEXT_GEN_CONTRACT.contract,
    abi: NEXT_GEN_ABI,
    chainId: NEXT_GEN_CONTRACT.chain_id,
    functionName: "retrieveCollectionInfo1",
    watch: true,
    args: [props.collection],
    onSettled(data: any, error: any) {
      if (data) {
        const d = data as any[];
        const i1: Info1 = {
          name: d[0],
          artist: d[1],
          description: d[2],
          website: d[3],
          licence: d[4],
          base_uri: d[5],
        };
        setInfo1(i1);
      }
    },
  });

  useContractRead({
    address: NEXT_GEN_CONTRACT.contract,
    abi: NEXT_GEN_ABI,
    chainId: NEXT_GEN_CONTRACT.chain_id,
    functionName: "retrieveCollectionAdditionalData1",
    watch: true,
    args: [props.collection],
    onSettled(data: any, error: any) {
      if (data) {
        const d = data as any[];
        const ad1: AdditionalData1 = {
          artist_address: d[0],
          mint_cost: Math.round(parseInt(d[1]) * 100000) / 100000,
          max_purchases: parseInt(d[2]),
          circulation_supply: parseInt(d[3]),
          total_supply: parseInt(d[4]),
          available: parseInt(d[4]) - parseInt(d[3]),
        };
        setAdditionalData1(ad1);
      }
    },
  });

  return (
    <a href={`/nextgen/${props.collection}`} className="decoration-none">
      <Container className="no-padding">
        <Image
          loading={"lazy"}
          width="0"
          height="0"
          style={{ width: "100%", height: "auto" }}
          src={`${COLLECTION_PREVIEWS}/${props.collection}.png`}
          alt={`${props.collection}-preview`}
        />
        <Row>
          <Col>
            <Container className={styles.collectionPreview}>
              {info1 && (
                <>
                  <Row>
                    <Col>
                      <b>
                        {props.collection} - {info1.name}
                      </b>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      by <b>{info1.artist}</b>
                    </Col>
                  </Row>
                </>
              )}
              {/* {additionalData1 && (
                <Row>
                  <Col>
                    <Table className="mb-0">
                      <tbody>
                        <tr>
                          <td>Total Supply</td>
                          <td>x{additionalData1.total_supply}</td>
                        </tr>
                        <tr>
                          <td>Circulating Supply</td>
                          <td>x{additionalData1.circulation_supply}</td>
                        </tr>
                        <tr>
                          <td>Available</td>
                          <td>
                            {additionalData1.available > 0
                              ? `x${additionalData1.available}`
                              : `-`}
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                </Row>
              )} */}
            </Container>
          </Col>
        </Row>
      </Container>
    </a>
  );
}
