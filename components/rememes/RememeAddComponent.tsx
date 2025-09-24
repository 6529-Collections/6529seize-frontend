"use client";

import { publicEnv } from "@/config/env";
import {
  faCheckCircle,
  faPlusCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button, Col, Container, Dropdown, Form, Row } from "react-bootstrap";
import { Tooltip } from "react-tooltip";
import { useEnsName } from "wagmi";
import { OPENSEA_STORE_FRONT_CONTRACT } from "../../constants";
import { NFT } from "../../entities/INFT";
import {
  areEqualAddresses,
  formatAddress,
  isValidEthAddress,
} from "../../helpers/Helpers";
import { postData } from "../../services/6529api";
import { Nft, NftContract } from "./alchemy-sdk-types";
import styles from "./Rememes.module.scss";

interface AddRememe {
  contract: string;
  token_ids: string[];
  references: number[];
}

export interface ProcessedRememe {
  valid: boolean;
  contract: NftContract;
  nfts: Nft[];
  error?: string;
}

interface Props {
  memes: NFT[];
  verifiedRememe(r: ProcessedRememe | undefined, references: number[]): void;
}

export default function RememeAddComponent(props: Readonly<Props>) {
  const [contract, setContract] = useState("");
  const [tokenIdDisplay, setTokenIdDisplay] = useState("");
  const [tokenIds, setTokenIds] = useState<string[]>([]);

  const [verifying, setVerifying] = useState(false);

  const [contractResponse, setContractResponse] = useState<NftContract>();
  const [nftResponses, setNftResponses] = useState<Nft[]>([]);

  const [references, setReferences] = useState<NFT[]>([]);

  const [verificationErrors, setVerificationErrors] = useState<string[]>([]);

  const [verified, setVerified] = useState(false);

  function getRememe(tokens?: string[]) {
    return {
      contract: contract,
      token_ids: tokens ? tokens : tokenIds,
      references: references.map((r) => r.id),
    };
  }

  const ensResolution = useEnsName({
    query: {
      enabled:
        !verifying &&
        contractResponse?.contractDeployer != undefined &&
        isValidEthAddress(contractResponse?.contractDeployer),
    },
    address: contractResponse?.contractDeployer as `0x${string}`,
    chainId: 1,
  });

  function parseTokenIds(tokenIds: string): string[] | undefined {
    const ids: string[] = [];

    try {
      const split = tokenIds.split(",");
      split.map((s) => {
        if (s.includes("-")) {
          const range = s.split("-");
          if (range.length === 2) {
            const start = parseInt(range[0]);
            const end = parseInt(range[1]);
            if (start < end) {
              const rangeArray = [];
              for (let i = start; i <= end; i++) {
                rangeArray.push(i);
              }
              rangeArray.map((i) => {
                ids.push(i.toString());
              });
            }
          }
        } else {
          ids.push(s);
        }
      });
      return ids;
    } catch (e) {
      return undefined;
    }
  }

  async function validate() {
    setVerifying(true);
    setContractResponse(undefined);
    setNftResponses([]);
    setVerificationErrors([]);

    const myTokenIds = parseTokenIds(tokenIdDisplay);
    if (myTokenIds && myTokenIds.length > 0 && !myTokenIds.some((id) => !id)) {
      try {
        setTokenIds(myTokenIds);
        const validation = await postData(
          `${publicEnv.API_ENDPOINT}/api/rememes/validate`,
          getRememe(myTokenIds)
        );
        const response = validation.response;
        const contractR = response.contract;
        const nftResponses: Nft[] = response.nfts;
        if (contractR) {
          setContractResponse(contractR);
        }
        if (nftResponses) {
          setNftResponses(nftResponses);
        }
        if (response.error) {
          setVerificationErrors([response.error]);
        }
        if (
          nftResponses &&
          nftResponses.some((n) => n.raw.error != undefined)
        ) {
          setVerificationErrors(["Some Token IDs are invalid"]);
        }
        setVerified(response.valid);
        if (response.valid) {
          props.verifiedRememe(
            response,
            references.map((r) => r.id)
          );
        }
      } catch (e: any) {
        setVerificationErrors([e.message]);
      }
    } else {
      setVerificationErrors(["Invalid token ID(s)"]);
    }
    setVerifying(false);
  }

  useEffect(() => {}, []);

  function addReference(meme: NFT) {
    setReferences([...references, meme].sort((a, b) => a.id - b.id));
  }

  return (
    <Form className={styles.addRememeContainer}>
      <Container>
        <Row>
          <Col sm={12} md={6}>
            <Form.Group as={Row} className="pb-4">
              <Form.Label className="d-flex align-items-center">
                Contract
              </Form.Label>
              <Col>
                <Form.Control
                  autoFocus
                  className={`${styles.formInput}`}
                  type="text"
                  placeholder="0x..."
                  value={contract}
                  disabled={verifying || verified}
                  onChange={(e) => setContract(e.target.value)}
                />
              </Col>
            </Form.Group>
          </Col>
          <Col sm={12} md={6}>
            <Form.Group as={Row} className="pb-4">
              <Form.Label className="d-flex align-items-center">
                Token IDs
              </Form.Label>
              <Col>
                <Form.Control
                  className={`${styles.formInput}`}
                  type="text"
                  placeholder="1,2,3 or 1-3 or 1,2-5 or 1-3,5"
                  value={tokenIdDisplay}
                  disabled={verifying || verified}
                  onChange={(e) => {
                    setTokenIdDisplay(e.target.value);
                  }}
                />
              </Col>
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col>
            Meme References{references.length > 0 && ` (${references.length})`}
          </Col>
        </Row>
        <Row className="pt-2">
          <Col className="d-flex align-items-center flex-wrap gap-2">
            {references.map((m) => (
              <span className={styles.addMemeReferenceWrapper} key={m.id}>
                <>
                  <span
                    className={`${styles.addMemeReferenceDisplayBtn} ${
                      verifying || verified
                        ? styles.addMemeReferenceDisplayBtnDisabled
                        : ""
                    }`}
                    onClick={() =>
                      setReferences((r) => r.filter((s) => s.id != m.id))
                    }
                    data-tooltip-id={`clear-reference-${m.id}`}>
                    x
                  </span>
                  <Tooltip
                    id={`clear-reference-${m.id}`}
                    place="top"
                    delayShow={250}
                    style={{
                      backgroundColor: "#1F2937",
                      color: "white",
                      padding: "4px 8px",
                    }}>
                    Clear
                  </Tooltip>
                </>
                <span className={styles.addMemeReferenceDisplay}>
                  #{m.id} - {m.name}
                </span>
              </span>
            ))}
            <Dropdown className={styles.addMemeReferencesDropdown}>
              <Dropdown.Toggle disabled={verifying || verified}>
                <FontAwesomeIcon icon={faPlusCircle} />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {props.memes
                  .filter((m) => !references.some((r) => r.id === m.id))
                  .map((m) => (
                    <Dropdown.Item
                      key={`add-rememe-meme-red-${m.id}`}
                      onClick={() => addReference(m)}>
                      #{m.id} - {m.name}
                    </Dropdown.Item>
                  ))}
              </Dropdown.Menu>
            </Dropdown>
          </Col>
        </Row>
        {(contractResponse || nftResponses.length > 0) && !verifying && (
          <Row>
            {contractResponse && !verifying && (
              <Col className="pt-4">
                <Container className="no-padding">
                  <Row>
                    <Col>
                      <b>
                        <u>Contract</u>
                      </b>
                    </Col>
                  </Row>
                  {contractResponse.name && (
                    <Row className="pt-1 pb-1">
                      <Col>Name: {contractResponse.name}</Col>
                    </Row>
                  )}
                  {contractResponse.contractDeployer && (
                    <Row className="pt-1 pb-1">
                      <Col>
                        Deployer:{" "}
                        {ensResolution.isSuccess &&
                          ensResolution.data &&
                          `${ensResolution.data} - `}
                        {formatAddress(contractResponse.contractDeployer)}
                      </Col>
                    </Row>
                  )}
                  {contractResponse.openSeaMetadata?.collectionName && (
                    <Row className="pt-1 pb-1">
                      <Col>
                        Collection Name:{" "}
                        {contractResponse.openSeaMetadata.collectionName}
                      </Col>
                    </Row>
                  )}
                </Container>
              </Col>
            )}
            {nftResponses.length > 0 && !verifying && (
              <Col className="pt-4">
                <Container className="no-padding">
                  <Row>
                    <Col>
                      <b>
                        <u>Tokens</u>
                      </b>
                    </Col>
                  </Row>
                  <ul className={styles.addRememeTokenList}>
                    {nftResponses.map((nftR) => (
                      <li key={`nftr-${nftR.tokenId}`}>
                        {nftR.raw.error ? (
                          <>
                            #{nftR.tokenId} - {nftR.raw.error}
                          </>
                        ) : (
                          <>
                            #{nftR.tokenId}
                            {nftR.name && ` - ${nftR.name}`}&nbsp;&nbsp;
                            <a
                              className="decoration-hover-underline"
                              href={`https://opensea.io/assets/ethereum/${contract}/${nftR.tokenId}`}
                              target="_blank"
                              rel="noreferrer">
                              <Image
                                unoptimized
                                src="/opensea.png"
                                alt="opensea"
                                width={22}
                                height={22}
                              />
                            </a>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </Container>
              </Col>
            )}
          </Row>
        )}
        {verificationErrors.length > 0 && (
          <>
            <Row className="pt-4">
              <Col xs={12}>
                <span className="d-flex align-items-center justify-content-start gap-2">
                  <FontAwesomeIcon
                    icon={faTimesCircle}
                    className={styles.unverifiedIcon}
                  />
                  Verification Failed - Fix errors and revalidate
                </span>
              </Col>
            </Row>
            <Row className="pt-2">
              {verificationErrors.map((ve) => (
                <Col key={ve} xs={12}>
                  - {ve}
                </Col>
              ))}
            </Row>
          </>
        )}
        <Row className="pt-4">
          <Col>
            {!verified ? (
              <Button
                onClick={() => validate()}
                className="seize-btn"
                disabled={
                  !contract || !tokenIdDisplay || references.length === 0
                }>
                Validate
                {verifying && (
                  <div className="d-inline">
                    <div
                      className={`spinner-border ${styles.loader}`}
                      role="status">
                      <span className="sr-only"></span>
                    </div>
                  </div>
                )}
              </Button>
            ) : (
              <div className="d-flex align-items-center justify-content-start gap-2">
                <span className="d-flex align-items-center justify-content-start gap-2">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className={styles.verifiedIcon}
                  />
                  Verified
                  {areEqualAddresses(contract, OPENSEA_STORE_FRONT_CONTRACT) &&
                    " (OpenSea Shared Storefront Contract)"}
                </span>
                <Button
                  onClick={() => {
                    setVerified(false);
                    setNftResponses([]);
                    setContractResponse(undefined);
                    props.verifiedRememe(undefined, []);
                  }}
                  className="seize-btn-link">
                  Edit
                </Button>
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </Form>
  );
}
