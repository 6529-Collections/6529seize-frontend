import styles from "./NextGen.module.scss";
import { useReadContract, useEnsName } from "wagmi";
import { Col, Container, Row } from "react-bootstrap";
import { useEffect, useState } from "react";
import Image from "next/image";
import { NEXTGEN_CHAIN_ID, NEXTGEN_CORE } from "../nextgen_contracts";
import DotLoader from "../../dotLoader/DotLoader";
import { NextGenCollection } from "../../../entities/INextgen";

import Address from "../../address/Address";
import { areEqualAddresses } from "../../../helpers/Helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { mainnet } from "viem/chains";
import { formatNameForUrl, getOpenseaLink } from "../nextgen_helpers";
import Tippy from "@tippyjs/react";
import useCapacitor from "../../../hooks/useCapacitor";
import { useSeizeConnectContext } from "../../auth/SeizeConnectContext";
import { useIdentity } from "../../../hooks/useIdentity";

interface Props {
  collection: NextGenCollection;
  token_id: number;
}

export default function NextGenTokenOnChain(props: Readonly<Props>) {
  const capacitor = useCapacitor();
  const account = useSeizeConnectContext();

  const [owner, setOwner] = useState<`0x${string}`>();
  const [ownerENS, setOwnerENS] = useState<string>();

  const [fetchingMetadata, setFetchingMetadata] = useState<boolean>(true);
  const [tokenNotFound, setTokenNotFound] = useState<boolean>(false);
  const [tokenMetadataUrl, setTokenMetadataUrl] = useState<string>("");
  const [tokenImage, setTokenImage] = useState<string>("");

  const normalisedTokenId = props.token_id - props.collection.id * 10000000000;
  const tokenName = `${props.collection.name} #${normalisedTokenId}`;

  const tokenUriRead = useReadContract({
    address: NEXTGEN_CORE[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "tokenURI",
    query: {
      refetchInterval: 10000,
    },
    args: [props.token_id],
  });

  useEffect(() => {
    const data = tokenUriRead.data;
    if (data) {
      const tokenUri = data as string;
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
  }, [tokenUriRead.data]);

  const ownerRead = useReadContract({
    address: NEXTGEN_CORE[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "ownerOf",
    query: {
      refetchInterval: 10000,
    },
    args: [props.token_id],
  });

  useEffect(() => {
    const data = ownerRead.data as any;
    if (data) {
      setOwner(data);
    }
  }, [ownerRead.data]);

  const ownerENSRead = useEnsName({
    address: owner,
    chainId: mainnet.id,
  });

  useEffect(() => {
    const data = ownerENSRead.data;
    if (data) {
      setOwnerENS(data);
    }
  }, [ownerENSRead.data]);

  const { profile } = useIdentity({
    handleOrWallet: owner,
    initialProfile: null,
  });

  function printToken() {
    return (
      <>
        <Container fluid className={`${styles.tokenContainer} pt-4 pb-4`}>
          <Row>
            <Col>
              <Container>
                <Row>
                  <Col className="d-flex align-items-center justify-content-between">
                    <h2 className="mb-0">{tokenName}</h2>
                  </Col>
                </Row>
                <Row className="pt-4">
                  <Col className="text-center">
                    <Image
                      priority
                      loading={"eager"}
                      width="0"
                      height="0"
                      style={{
                        height: "auto",
                        width: "auto",
                        maxHeight: "90vh",
                        maxWidth: "100%",
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
                <a
                  href={`/nextgen/collection/${formatNameForUrl(
                    props.collection.name
                  )}`}
                >
                  {props.collection.name}
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
                    display={profile?.handle ?? ownerENS}
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
                        icon="external-link-square"
                      ></FontAwesomeIcon>
                    </a>
                  </span>
                </span>
              </span>
              {capacitor.platform !== "ios" && (
                <span className="pt-1 pb-1 d-flex flex-column">
                  <span className="font-color-h">Marketplaces</span>
                  <span className="d-flex gap-4">
                    <Tippy content={"Opensea"} theme={"light"} delay={250}>
                      <a
                        href={getOpenseaLink(NEXTGEN_CHAIN_ID, props.token_id)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Image
                          className={styles.marketplace}
                          src="/opensea.png"
                          alt="opensea"
                          width={28}
                          height={28}
                        />
                      </a>
                    </Tippy>
                  </span>
                </span>
              )}
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

  if (fetchingMetadata || tokenNotFound || !tokenImage) {
    return (
      <Container className="pt-5">
        <Row>
          <Col className="text-center">
            <h4 className="mb-0">
              {tokenNotFound ? (
                <>Token Not Found</>
              ) : (
                <>
                  Fetching Token <DotLoader />
                </>
              )}
            </h4>
          </Col>
        </Row>
      </Container>
    );
  }

  return printToken();
}
