import styles from "./NextGen.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import { useContractRead } from "wagmi";
import { useState } from "react";
import { COLLECTION_PREVIEWS } from "./NextGen";
import Image from "next/image";
import { Info } from "./entities";
import { NEXTGEN_CORE } from "./contracts";

interface Props {
  collection: number;
}

export default function NextGenCollectionPreview(props: Props) {
  const [info, setInfo] = useState<Info>();

  useContractRead({
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CORE.chain_id,
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

  return (
    <a
      href={`/nextgen/collection/${props.collection}`}
      className="decoration-none">
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
              {info && (
                <>
                  <Row>
                    <Col>
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
