import { NFT } from "../../entities/INFT";
import MultiSelectDropdown from "../multiSelectDropdown/MultiSelectDropdown";
import styles from "./Rememes.module.scss";
import { Row, Col, Form, Container, Button, Dropdown } from "react-bootstrap";
import { Alchemy, BigNumberish, Nft, NftContract } from "alchemy-sdk";
import { ALCHEMY_CONFIG, MEMES_CONTRACT } from "../../constants";
import { useEffect, useState } from "react";
import { formatAddress, isValidEthAddress } from "../../helpers/Helpers";
import { useEnsName } from "wagmi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import { AddRememe } from "./RememeAddPage";

interface Props {
  memes: NFT[];
  verifiedRememe(r: AddRememe | undefined): void;
}

export default function RememeAddComponent(props: Props) {
  const alchemy = new Alchemy(ALCHEMY_CONFIG);

  const [contract, setContract] = useState("");
  const [nftId, setNftId] = useState("");
  const [verifying, setVerifying] = useState(false);

  const [contractResponse, setContractResponse] = useState<NftContract>();
  const [nftResponse, setNftResponse] = useState<Nft>();

  const [references, setReferences] = useState<NFT[]>([]);

  const [verificationErrors, setVerificationErrors] = useState<string[]>([]);

  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (verified) {
      props.verifiedRememe({
        contract: contract,
        nftId: nftId,
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

  async function verify() {
    setVerifying(true);
    setContractResponse(undefined);
    setNftResponse(undefined);
    setVerificationErrors([]);
    try {
      const contractR = await alchemy.nft.getContractMetadata(contract);
      const nftR = await alchemy.nft.getNftMetadata(contract, nftId, {});
      console.log("contract", contractR);
      console.log("nft", nftR);
      setContractResponse(contractR);
      setNftResponse(nftR);
      setVerified(true);
    } catch (e: any) {
      setVerificationErrors([e.message]);
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
                  disabled={verifying}
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
                  value={nftId}
                  disabled={verifying}
                  onChange={(e) => setNftId(e.target.value)}
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
                    className={styles.addMemeReferenceDisplayBtn}
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
              <Dropdown.Toggle>
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
        {(verificationErrors.length > 0 || contractResponse || nftResponse) &&
          !verifying && (
            <Row className="pt-4">
              {verificationErrors.length > 0 &&
                verificationErrors.map((ve) => <Col key={ve}>- {ve}</Col>)}
              {contractResponse && !verifying && (
                <Col>
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
              {nftResponse && !verifying && (
                <Col>
                  <Container className="no-padding">
                    <Row>
                      <Col>
                        <b>
                          <u>Tokens</u>
                        </b>
                      </Col>
                    </Row>
                    <ul>
                      <li>
                        {nftResponse.tokenId}
                        {nftResponse.title && ` - ${nftResponse.title}`}
                      </li>
                    </ul>
                  </Container>
                </Col>
              )}
            </Row>
          )}
        <Row className="pt-4">
          <Col>
            {!verified ? (
              <Button
                onClick={() => verify()}
                className="seize-btn"
                disabled={!contract || !nftId || references.length == 0}>
                Verify
              </Button>
            ) : (
              <div className="d-flex align-items-center justify-content-start gap-2">
                <span className="d-flex align-items-center justify-content-start gap-1">
                  <FontAwesomeIcon
                    icon="check-circle"
                    className={styles.verifiedIcon}
                  />
                  Verified
                </span>
                <Button
                  onClick={() => {
                    setVerified(false);
                    setNftResponse(undefined);
                    setContractResponse(undefined);
                  }}
                  className="seize-btn btn-link">
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
