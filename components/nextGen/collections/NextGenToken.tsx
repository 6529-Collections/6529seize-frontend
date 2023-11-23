import styles from "./NextGen.module.scss";
import { mainnet, useAccount, useContractRead, useEnsName } from "wagmi";
import { Col, Container, Row, Table } from "react-bootstrap";
import { useState } from "react";
import {
  AdditionalData,
  Info,
  PhaseTimes,
  TokenURI,
} from "../nextgen_entities";
import NextGenTokenImage from "./NextGenTokenImage";
import Address from "../../address/Address";
import Image from "next/image";
import { goerli } from "wagmi/chains";
import {
  NEXTGEN_CHAIN_ID,
  NEXTGEN_CORE,
  NEXTGEN_MINTER,
} from "../nextgen_contracts";
import NextGenCollectionHeader from "./collection/NextGenCollectionHeader";
import { areEqualAddresses } from "../../../helpers/Helpers";
import {
  retrieveCollectionAdditionalData,
  retrieveCollectionInfo,
  retrieveCollectionPhases,
  extractAttributes,
  extractField,
  extractURI,
} from "../nextgen_helpers";

interface Props {
  collection: number;
  token: number;
}

export default function NextGenToken(props: Props) {
  const account = useAccount();

  const [tokenFetched, setTokenFetched] = useState(false);
  const [tokenNotFound, setTokenNotFound] = useState(false);

  const [token, setToken] = useState<TokenURI>();
  const [info, setInfo] = useState<Info>();
  const [phaseTimes, setPhaseTimes] = useState<PhaseTimes>();
  const [additionalData, setAdditionalData] = useState<AdditionalData>();

  const [owner, setOwner] = useState<`0x${string}`>();
  const [ownerENS, setOwnerENS] = useState<string>();
  const [metadata, setMetadata] = useState<string>();
  const [name, setName] = useState<string>();
  const [description, setDescription] = useState<string>();
  const [codeCopied, setCodeCopied] = useState(false);

  useContractRead({
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "tokenURI",
    watch: true,
    args: [props.token],
    onSettled(data: any, error: any) {
      if (error) {
        setTokenNotFound(true);
      } else if (data.startsWith("data")) {
        const uri = extractURI(data);
        const name = extractField("name", data);
        const description = extractField("description", data);
        const attrs = extractAttributes(data);
        setToken({
          id: props.token,
          collection: props.collection,
          uri: uri.uri,
          data: uri.data,
          name: name,
          description: description,
          attributes: attrs,
        });
      } else {
        setToken({
          id: props.token,
          collection: props.collection,
          uri: data,
          name: "",
          description: "",
          attributes: [],
        });
      }
      setTokenFetched(true);
    },
  });

  retrieveCollectionInfo(props.collection, (data: Info) => {
    setInfo(data);
  });

  retrieveCollectionPhases(props.collection, (data: PhaseTimes) => {
    setPhaseTimes(data);
  });

  retrieveCollectionAdditionalData(props.collection, (data: AdditionalData) => {
    setAdditionalData(data);
  });

  useContractRead({
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "ownerOf",
    watch: true,
    args: [props.token],
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

  function printToken() {
    if (!token) {
      return;
    }
    return (
      <>
        <Container fluid className={`${styles.tokenContainer} pt-4 pb-4`}>
          <Row>
            <Col>
              <Container>
                <Row>
                  <Col>
                    <h2>{token.name ? token.name : name}</h2>
                  </Col>
                </Row>
                <Row className="pt-2">
                  <Col>
                    <NextGenTokenImage
                      token={token}
                      setMetadata={(url) => setMetadata(url)}
                      setName={(name) => setName(name)}
                      setDescription={(description) =>
                        setDescription(description)
                      }
                    />
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>
        </Container>
        <Container className="pt-4 pb-4">
          <Row>
            <Col className="d-flex align-items-center justify-content-between">
              <h4 className="mb-0 font-color d-flex gap-1">
                {owner && (
                  <>
                    <span>Owned By</span>&nbsp;
                    <Address wallets={[owner]} display={ownerENS} />
                    {areEqualAddresses(owner, account.address) && (
                      <span>(you)</span>
                    )}
                  </>
                )}
              </h4>
              <span className="d-flex gap-4">
                <a
                  href={`https://${
                    NEXTGEN_CHAIN_ID === goerli.id
                      ? `testnets.opensea`
                      : `opensea`
                  }.io/assets/${
                    NEXTGEN_CHAIN_ID === goerli.id ? `goerli` : `ethereum`
                  }/${NEXTGEN_CORE.contract}/${props.token}`}
                  target="_blank"
                  rel="noreferrer">
                  <Image
                    className={styles.marketplace}
                    src="/opensea.png"
                    alt="opensea"
                    width={32}
                    height={32}
                  />
                </a>
                <a
                  href={`https://${
                    NEXTGEN_CHAIN_ID === goerli.id ? `goerli.x2y2` : `x2y2`
                  }.io/eth/${NEXTGEN_CORE.contract}/${props.token}`}
                  target="_blank"
                  rel="noreferrer">
                  <Image
                    className={styles.marketplace}
                    src="/x2y2.png"
                    alt="x2y2"
                    width={32}
                    height={32}
                  />
                </a>
              </span>
            </Col>
          </Row>
          <Row className="pt-3">
            <Col>{token.description ? token.description : description}</Col>
          </Row>
          <Row className="pt-3">
            <Col sm={12} md={6}>
              <Table bordered={false}>
                <tbody>
                  <tr>
                    <td>Token ID</td>
                    <td>
                      <b>#{props.token}</b>
                    </td>
                  </tr>
                  <tr>
                    <td>Collection</td>
                    <td>
                      <b>
                        <a href={`/nextgen/collection/${props.collection}`}>
                          #{props.collection} {info ? `- ${info.name}` : ``}
                        </a>
                      </b>
                    </td>
                  </tr>
                  {info && (
                    <tr>
                      <td>Artist</td>
                      <td>{info.artist}</td>
                    </tr>
                  )}
                  {token.data && (
                    <tr>
                      <td>Metadata</td>
                      <td>On-Chain</td>
                    </tr>
                  )}
                  {metadata && (
                    <tr>
                      <td>Metadata</td>
                      <td>Off-Chain</td>
                    </tr>
                  )}
                  {token.data && (
                    <tr>
                      <td
                        className={`${styles.copyData} pt-3`}
                        colSpan={2}
                        onClick={() => {
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(token.data);
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
                  {metadata && (
                    <tr>
                      <td className={`${styles.copyData} pt-3`} colSpan={2}>
                        <a href={metadata} target="_blank" rel="noreferrer">
                          View Metadata
                        </a>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Col>
            {token.attributes.length > 0 && (
              <Col sm={12} md={6}>
                <Container className="no-padding">
                  <Row>
                    <Col>
                      <h4>Properties</h4>
                    </Col>
                  </Row>
                  <Row>
                    {token.attributes.map((a) => (
                      <Col
                        key={a.trait_type}
                        xs={{ span: 6 }}
                        sm={{ span: 4 }}
                        md={{ span: 3 }}
                        lg={{ span: 3 }}
                        className="pt-2 pb-2">
                        <Container>
                          <Row>
                            <Col className={styles.nftAttribute}>
                              <span>{a.trait_type}</span>
                              <br />
                              <span title={a.value}>{a.value}</span>
                            </Col>
                          </Row>
                        </Container>
                      </Col>
                    ))}
                  </Row>
                </Container>
              </Col>
            )}
          </Row>
        </Container>
      </>
    );
  }

  if (!tokenFetched) {
    return (
      <Container className="pt-5">
        <Row>
          <Col className="text-center">
            <h4 className="mb-0 float-none">Fetching Token...</h4>
          </Col>
        </Row>
      </Container>
    );
  } else {
    if (tokenNotFound) {
      return (
        <Container className="pt-5 text-center">
          <Row>
            <Col>
              <h4 className="mb-0 float-none">
                Token #{props.token} not found
              </h4>
            </Col>
          </Row>
          <Row>
            <Col>
              <Image
                width="0"
                height="0"
                style={{ height: "auto", width: "120px" }}
                src="/SummerGlasses.svg"
                alt="SummerGlasses"
              />
            </Col>
          </Row>
          <Row>
            <Col>
              <a href={`/nextgen`}>BACK TO NEXTGEN</a>
            </Col>
          </Row>
          <Row className="pt-3">
            <Col>
              <a href={`/`}>BACK TO HOME</a>
            </Col>
          </Row>
        </Container>
      );
    } else {
      return (
        <>
          <Container className="pt-4 pb-4">
            {info && phaseTimes && additionalData && (
              <NextGenCollectionHeader
                collection={props.collection}
                info={info}
                phase_times={phaseTimes}
                additional_data={additionalData}
                collection_link={true}
              />
            )}
          </Container>
          {printToken()}
        </>
      );
    }
  }
}
