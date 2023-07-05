import styles from "./NextGen.module.scss";
import { mainnet, useContractRead, useEnsName } from "wagmi";
import { Col, Container, Row, Table } from "react-bootstrap";
import { NEXT_GEN_CONTRACT } from "../../constants";
import { NEXT_GEN_ABI } from "../../abis";
import { useState } from "react";
import { Info, TokenURI } from "./entities";
import NextGenTokenImage from "./NextGenTokenImage";
import Address from "../address/Address";
import { extractField, extractURI } from "./NextGenCollection";
import Image from "next/image";
import { goerli } from "wagmi/chains";

interface Props {
  collection: number;
  id: number;
}

export default function NextGenToken(props: Props) {
  const [token, setToken] = useState<TokenURI>();
  const [info1, setInfo1] = useState<Info>();
  const [owner, setOwner] = useState<`0x${string}`>();
  const [ownerENS, setOwnerENS] = useState<string>();
  const [codeCopied, setCodeCopied] = useState(false);
  const [copyText, setCopyText] = useState<string>();

  useContractRead({
    address: NEXT_GEN_CONTRACT.contract,
    abi: NEXT_GEN_ABI,
    chainId: NEXT_GEN_CONTRACT.chain_id,
    functionName: "tokenURI",
    watch: true,
    args: [props.id],
    onSettled(data: any, error: any) {
      if (data.startsWith("data")) {
        const uri = extractURI(data);
        const name = extractField("name", data);
        const description = extractField("description", data);
        setToken({
          id: props.id,
          collection: props.collection,
          uri: uri,
          name: name,
          description: description,
          is_data: true,
        });
      } else {
        setToken({
          id: props.id,
          collection: props.collection,
          uri: data,
          name: "",
          description: "",
          is_data: false,
        });
      }
    },
  });

  useContractRead({
    address: NEXT_GEN_CONTRACT.contract,
    abi: NEXT_GEN_ABI,
    chainId: NEXT_GEN_CONTRACT.chain_id,
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
        setInfo1(i1);
      }
    },
  });

  useContractRead({
    address: NEXT_GEN_CONTRACT.contract,
    abi: NEXT_GEN_ABI,
    chainId: NEXT_GEN_CONTRACT.chain_id,
    functionName: "ownerOf",
    watch: true,
    args: [props.id],
    onSettled(data: any, error: any) {
      if (data) {
        setOwner(data);
      }
    },
  });

  useEnsName({
    address: owner,
    chainId: mainnet.id,
    onSettled(data: any, error: any) {
      if (data) {
        setOwnerENS(data);
      }
    },
  });

  return (
    <Container className="pt-4 pb-4">
      {token && (
        <Row>
          <Col xs={12} md={6} className="pt-2">
            <NextGenTokenImage token={token} />
          </Col>
          <Col className="pt-2">
            <Container className="no-padding">
              <Row>
                <Col>
                  <h2>{token.name}</h2>
                </Col>
              </Row>
              <Row>
                <Col>{token.description}</Col>
              </Row>
              <Row className="pt-3">
                <Col>
                  <Table bordered={false}>
                    <tbody>
                      {owner && (
                        <tr>
                          <td className={`pb-3`}>Owner</td>
                          <td className="text-right">
                            <Address wallets={[owner]} display={ownerENS} />
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td>Token ID</td>
                        <td className="text-right">
                          <b>#{props.id}</b>
                        </td>
                      </tr>
                      <tr>
                        <td>Collection</td>
                        <td className="text-right">
                          <b>
                            <a href={`/nextgen/${props.collection}`}>
                              #{props.collection}{" "}
                              {info1 ? `- ${info1.name}` : ``}
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
                            className={`${styles.copyData} pt-3`}
                            colSpan={2}
                            onClick={() => {
                              if (navigator.clipboard) {
                                navigator.clipboard.writeText(copyText);
                                setCodeCopied(true);
                                setTimeout(() => {
                                  setCodeCopied(false);
                                }, 1500);
                              }
                            }}>
                            {codeCopied
                              ? `Copied - Paste in brower search bar to view`
                              : `Copy Image Data to Clipboard`}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Col>
              </Row>
              <Row className="pt-3">
                <Col>
                  <a
                    href={`https://${
                      NEXT_GEN_CONTRACT.chain_id == goerli.id
                        ? `testnets.opensea`
                        : `opensea`
                    }.io/assets/${
                      NEXT_GEN_CONTRACT.chain_id == goerli.id
                        ? `goerli`
                        : `ethereum`
                    }/${NEXT_GEN_CONTRACT.contract}/${props.id}`}
                    target="_blank"
                    rel="noreferrer">
                    <Image
                      className={styles.marketplace}
                      src="/opensea.png"
                      alt="opensea"
                      width={40}
                      height={40}
                    />
                  </a>
                  <a
                    href={`https://${
                      NEXT_GEN_CONTRACT.chain_id == goerli.id
                        ? `goerli.x2y2`
                        : `x2y2`
                    }.io/eth/${NEXT_GEN_CONTRACT.contract}/${props.id}`}
                    target="_blank"
                    rel="noreferrer">
                    <Image
                      className={styles.marketplace}
                      src="/x2y2.png"
                      alt="x2y2"
                      width={40}
                      height={40}
                    />
                  </a>
                </Col>
              </Row>
            </Container>
          </Col>
        </Row>
      )}
    </Container>
  );
}
