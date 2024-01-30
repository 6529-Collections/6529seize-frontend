import styles from "./NextGen.module.scss";
import { useAccount, useContractRead, useEnsName } from "wagmi";
import { Col, Container, Row } from "react-bootstrap";
import { useEffect, useState } from "react";
import Image from "next/image";
import { NEXTGEN_CHAIN_ID, NEXTGEN_CORE } from "../nextgen_contracts";
import NextGenCollectionHeader from "./collectionParts/NextGenCollectionHeader";
import DotLoader from "../../dotLoader/DotLoader";
import { NextGenCollection } from "../../../entities/INextgen";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { commonApiFetch } from "../../../services/api/common-api";
import Address from "../../address/Address";
import { areEqualAddresses } from "../../../helpers/Helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { mainnet } from "viem/chains";
import { getOpenseaLink } from "../nextgen_helpers";

interface Props {
  collection: NextGenCollection;
  token_id: number;
}

export default function NextGenTokenOnChain(props: Readonly<Props>) {
  const account = useAccount();

  const [owner, setOwner] = useState<`0x${string}`>();
  const [ownerENS, setOwnerENS] = useState<string>();

  const [fetchingMetadata, setFetchingMetadata] = useState<boolean>(true);
  const [tokenNotFound, setTokenNotFound] = useState<boolean>(false);
  const [tokenMetadataUrl, setTokenMetadataUrl] = useState<string>("");
  const [tokenImage, setTokenImage] = useState<string>("");

  const [ownerProfileHandle, setOwnerProfileHandle] = useState<string>();

  const normalisedTokenId = props.token_id - props.collection.id * 10000000000;
  const tokenName = `${props.collection.name} - #${normalisedTokenId}`;

  useContractRead({
    address: NEXTGEN_CORE[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "tokenURI",
    watch: true,
    args: [props.token_id],
    onSettled(data: any, error: any) {
      if (data) {
        const tokenUri = data;
        setTokenMetadataUrl(tokenUri);
        fetch(tokenUri).then((meta) => {
          meta.json().then((metaJson) => {
            setTokenImage(metaJson.image);
          });
        });
      } else {
        setTokenNotFound(true);
      }
      setFetchingMetadata(false);
    },
  });

  useContractRead({
    address: NEXTGEN_CORE[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "ownerOf",
    watch: true,
    args: [props.token_id],
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

  useEffect(() => {
    if (owner) {
      commonApiFetch<IProfileAndConsolidations>({
        endpoint: `profiles/${owner}`,
      }).then((profile) => {
        if (profile.profile?.handle) {
          setOwnerProfileHandle(profile.profile.handle);
        }
      });
    }
  }, [owner]);

  function printToken() {
    return (
      <>
        <Container fluid className={`${styles.tokenContainer} pt-4 pb-4`}>
          <Row>
            <Col>
              <Container>
                <Row>
                  <Col className="d-flex align-items-center justify-content-between">
                    <h2>{tokenName}</h2>
                    <span className="d-flex gap-4">
                      <a
                        href={getOpenseaLink(NEXTGEN_CHAIN_ID, props.token_id)}
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
                    </span>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col className="text-center">
                    <Image
                      priority
                      loading={"eager"}
                      width="0"
                      height="0"
                      style={{
                        height: "auto",
                        width: "auto",
                        maxHeight: "100%",
                        maxWidth: "100%",
                        padding: "10px",
                      }}
                      src={tokenImage}
                      alt={tokenName}
                    />
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>
        </Container>
        <Container className="pt-3 pb-3">
          <Row>
            <Col>
              <h4>About</h4>
            </Col>
          </Row>
          <Row>
            <Col className="d-flex align-items-center gap-5">
              <span className="pt-1 pb-1 d-flex flex-column">
                <span className="font-color-h">Token ID</span>
                <span>#{props.token_id}</span>
              </span>
              <span className="pt-1 pb-1 d-flex flex-column">
                <span className="font-color-h">Collection</span>
                <a href={`/nextgen/collection/${props.collection.id}`}>
                  #{props.collection.id} {props.collection.name}
                </a>
              </span>
              <span className="pt-1 pb-1 d-flex flex-column">
                <span className="font-color-h">Artist</span>
                <a href={`/${props.collection.artist_address}`}>
                  {props.collection.artist}
                </a>
              </span>
              <span className="pt-1 pb-1 d-flex flex-column">
                <span className="font-color-h">Owner</span>
                <span className="d-flex">
                  <Address
                    wallets={[owner as `0x${string}`]}
                    display={ownerProfileHandle ?? ownerENS}
                  />
                  {areEqualAddresses(owner, account.address) && (
                    <span>(you)</span>
                  )}
                </span>
              </span>
              <span className="pt-1 pb-1 d-flex flex-column">
                <span className="font-color-h">Metadata</span>
                <span className="d-flex align-items-center gap-1">
                  <span>
                    {props.collection.on_chain ? "On-Chain" : "Off-Chain"}{" "}
                    <a href={tokenMetadataUrl} target="_blank" rel="noreferrer">
                      <FontAwesomeIcon
                        className={styles.copyIcon}
                        icon="external-link-square"></FontAwesomeIcon>
                    </a>
                  </span>
                </span>
              </span>
            </Col>
          </Row>
          <Row className="pt-3">
            <Col>
              <b>
                Token Indexing, check back later <DotLoader />
              </b>
            </Col>
          </Row>
        </Container>
      </>
    );
  }

  if (fetchingMetadata || tokenNotFound) {
    return (
      <Container className="pt-5">
        <Row>
          <Col className="text-center">
            <h4 className="mb-0 float-none">
              {fetchingMetadata ? (
                <>
                  Fetching Token <DotLoader />
                </>
              ) : (
                `Token Not Found`
              )}
            </h4>
          </Col>
        </Row>
      </Container>
    );
  }
  return (
    <>
      <Container className="pt-4 pb-4">
        <NextGenCollectionHeader
          collection={props.collection}
          collection_link={true}
          showDistributionLink={true}
        />
      </Container>
      {printToken()}
    </>
  );
}
