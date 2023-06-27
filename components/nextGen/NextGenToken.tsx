import styles from "./NextGen.module.scss";
import { useContractRead } from "wagmi";
import { Col, Container, Row, Table } from "react-bootstrap";
import { NEXT_GEN_CONTRACT } from "../../constants";
import { NEXT_GEN_ABI } from "../../abis";
import { useState } from "react";
import { Info1 } from "./entities";
import NextGenTokenImage from "./NextGenTokenImage";

interface Props {
  collection: number;
  id: number;
}

export default function NextGenToken(props: Props) {
  const [info1, setInfo1] = useState<Info1>();
  const [codeCopied, setCodeCopied] = useState(false);
  const [copyText, setCopyText] = useState<string>();

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

  return (
    <Container className="no-padding pt-5 pb-5">
      <Row>
        <Col>
          <NextGenTokenImage
            collection={props.collection}
            id={props.id}
            onSetAnimationUrl={(animationUrl: string) => {
              setCopyText(animationUrl);
            }}
          />
        </Col>
        <Col>
          <Container>
            <Row>
              <Col>
                <Table bordered={false}>
                  <tbody>
                    <tr>
                      <td>Token</td>
                      <td className="text-right">
                        <b>#{props.id}</b>
                      </td>
                    </tr>
                    <tr>
                      <td>Collection</td>
                      <td className="text-right">
                        <b>
                          <a href={`/nextgen/${props.collection}`}>
                            #{props.collection} {info1 ? `- ${info1.name}` : ``}
                          </a>
                        </b>
                      </td>
                    </tr>
                    {info1 && (
                      <tr>
                        <td>Artist</td>
                        <td className="text-right">{info1.artist}</td>
                      </tr>
                    )}
                    {copyText && (
                      <tr>
                        <td
                          className={`${styles.copyData} pt-2`}
                          colSpan={2}
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(copyText);
                              setCodeCopied(true);
                              setTimeout(() => {
                                setCodeCopied(false);
                              }, 500);
                            }
                          }}>
                          {codeCopied ? `Copied!` : `Copy Data to Clipboard`}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
