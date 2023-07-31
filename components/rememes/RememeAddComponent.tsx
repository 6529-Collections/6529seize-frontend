import { NFT } from "../../entities/INFT";
import styles from "./Rememes.module.scss";
import { Row, Col, Form, Container, Button, Dropdown } from "react-bootstrap";
import { Alchemy, Nft, NftContract } from "alchemy-sdk";
import {
  ALCHEMY_CONFIG,
  OPENSEA_STORE_FRONT_CONTRACT,
  OPENSEA_STORE_FRONT_CONTRACT_DEPLOYER,
} from "../../constants";
import { useEffect, useState } from "react";
import {
  areEqualAddresses,
  formatAddress,
  isValidEthAddress,
} from "../../helpers/Helpers";
import { useAccount, useEnsName } from "wagmi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import { AddRememe } from "./RememeAddPage";
import Image from "next/image";

interface Props {
  memes: NFT[];
  verifiedRememe(r: AddRememe | undefined): void;
}

export default function RememeAddComponent(props: Props) {
  const alchemy = new Alchemy(ALCHEMY_CONFIG);

  // const accountResolution = useAccount();
  const accountResolution = {
    isConnected: true,
    address: "0x44f301b1de6c3fec0f8a8aea53311f5cca499904",
  };

  const [contract, setContract] = useState("");
  const [tokenIdDisplay, setTokenIdDisplay] = useState("");
  const [tokenIds, setTokenIds] = useState<string[]>([]);

  const [verifying, setVerifying] = useState(false);

  const [contractResponse, setContractResponse] = useState<NftContract>();
  const [nftResponses, setNftResponses] = useState<Nft[]>([]);

  const [references, setReferences] = useState<NFT[]>([]);

  const [verificationErrors, setVerificationErrors] = useState<string[]>([]);

  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (verified) {
      props.verifiedRememe({
        contract: contract,
        token_ids: tokenIds,
        references: references.map((r) => r.id),
      });
    } else {
      props.verifiedRememe(undefined);
    }
  }, [verified]);

  const ensResolution = useEnsName({
    enabled:
      !verifying &&
      contractResponse?.contractDeployer != undefined &&
      isValidEthAddress(contractResponse?.contractDeployer),
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

  async function verify() {
    setVerifying(true);
    setContractResponse(undefined);
    setNftResponses([]);
    setVerificationErrors([]);

    const myTokenIds = parseTokenIds(tokenIdDisplay);
    if (myTokenIds && myTokenIds.length > 0 && !myTokenIds.some((id) => !id)) {
      try {
        const contractR = await alchemy.nft.getContractMetadata(contract);
        const nftResponses = await Promise.all(
          myTokenIds.map((id) => alchemy.nft.getNftMetadata(contract, id, {}))
        );
        console.log("contract", contractR);
        console.log("nft", nftResponses);
        setContractResponse(contractR);
        setNftResponses(nftResponses);
        setTokenIds(myTokenIds);
        if (nftResponses.some((n) => n.metadataError != undefined)) {
          setVerificationErrors(["Some Token IDs are invalid or do not exist"]);
        } else if (!accountResolution.isConnected) {
          setVerificationErrors(["Please connect your wallet to continue."]);
        } else {
          if (
            areEqualAddresses(
              contractR.contractDeployer,
              accountResolution.address
            )
          ) {
            setVerified(true);
          } else if (
            areEqualAddresses(
              contractR.contractDeployer,
              OPENSEA_STORE_FRONT_CONTRACT_DEPLOYER
            ) &&
            areEqualAddresses(contract, OPENSEA_STORE_FRONT_CONTRACT)
          ) {
            setVerified(true);
          } else {
            setVerificationErrors([
              "Your connected wallet is not the ReMeme contract deployer",
            ]);
          }
        }
      } catch (e: any) {
        setVerificationErrors([e.message]);
      }
    } else {
      setVerificationErrors(["Invalid token ID(s)"]);
    }
    setVerifying(false);
  }

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
                Token ID
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
                <Tippy
                  delay={250}
                  content={"Clear"}
                  placement={"top"}
                  theme={"dark"}>
                  <span
                    className={`${styles.addMemeReferenceDisplayBtn} ${
                      verifying || verified
                        ? styles.addMemeReferenceDisplayBtnDisabled
                        : ""
                    }`}
                    onClick={() =>
                      setReferences((r) => r.filter((s) => s.id != m.id))
                    }>
                    x
                  </span>
                </Tippy>
                <span className={styles.addMemeReferenceDisplay}>
                  #{m.id} - {m.name}
                </span>
              </span>
            ))}
            <Dropdown className={styles.addMemeReferencesDropdown}>
              <Dropdown.Toggle disabled={verifying || verified}>
                <FontAwesomeIcon icon="plus-circle" />
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
                  {contractResponse.openSea?.collectionName && (
                    <Row className="pt-1 pb-1">
                      <Col>
                        Collection Name:{" "}
                        {contractResponse.openSea.collectionName}
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
                      <li>
                        {nftR.metadataError ? (
                          <>
                            {nftR.tokenId} - {nftR.metadataError}
                          </>
                        ) : (
                          <a
                            className="decoration-hover-underline"
                            href={`https://opensea.io/assets/ethereum/${nftR.contract.address}/${nftR.tokenId}`}
                            target="_blank"
                            rel="noreferrer">
                            {nftR.tokenId}
                            {nftR.title && ` - ${nftR.title}`}
                            &nbsp;&nbsp;
                            <Image
                              src="/opensea.png"
                              alt="opensea"
                              width={22}
                              height={22}
                            />
                          </a>
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
                    icon="times-circle"
                    className={styles.unverifiedIcon}
                  />
                  Verification Failed
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
                onClick={() => verify()}
                className="seize-btn"
                disabled={
                  !contract || !tokenIdDisplay || references.length == 0
                }>
                Verify
              </Button>
            ) : (
              <div className="d-flex align-items-center justify-content-start gap-2">
                <span className="d-flex align-items-center justify-content-start gap-2">
                  <FontAwesomeIcon
                    icon="check-circle"
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
