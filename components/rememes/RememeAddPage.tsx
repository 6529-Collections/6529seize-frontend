import styles from "./Rememes.module.scss";
import { Container, Row, Col, Button } from "react-bootstrap";
import Image from "next/image";
import { useState, useEffect } from "react";
import { MEMES_CONTRACT, OPENSEA_STORE_FRONT_CONTRACT } from "../../constants";
import { NFT } from "../../entities/INFT";
import { fetchAllPages, fetchUrl, postData } from "../../services/6529api";
import RememeAddComponent, { ProcessedRememe } from "./RememeAddComponent";
import { useAccount, useSignMessage } from "wagmi";
import { useWeb3Modal } from "@web3modal/react";
import { DBResponse } from "../../entities/IDBResponse";
import { ConsolidatedTDHMetrics } from "../../entities/ITDH";
import { areEqualAddresses, numberWithCommas } from "../../helpers/Helpers";
import { SeizeSettings } from "../../entities/ISeizeSettings";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface CheckList {
  status: boolean;
  note: string;
}

export default function RememeAddPage() {
  const accountResolution = useAccount();
  const web3modal = useWeb3Modal();

  const [seizeSettings, setSeizeSettings] = useState<SeizeSettings>();

  const signMessage = useSignMessage();
  const [memes, setMemes] = useState<NFT[]>([]);
  const [memesLoaded, setMemesLoaded] = useState(false);
  const [userTDH, setUserTDH] = useState<ConsolidatedTDHMetrics>();

  const [addRememe, setAddRememe] = useState<ProcessedRememe>();
  const [references, setReferences] = useState<number[]>();
  const [checkList, setCheckList] = useState<CheckList[]>([]);
  const [signErrors, setSignErrors] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    errors?: string[];
    contract?: string;
    tokens?: string[];
  }>();

  useEffect(() => {
    const mychecklist: CheckList[] = [];
    if (addRememe) {
      if (!seizeSettings || !seizeSettings.rememes_submission_tdh_threshold) {
        mychecklist.push({
          status: false,
          note: "Something went wrong fetching global settings",
        });
      } else if (!userTDH) {
        mychecklist.push({
          status: false,
          note: "You need to have some TDH before you can add Rememes",
        });
      } else {
        const isDeployer = areEqualAddresses(
          addRememe.contract.contractDeployer,
          accountResolution.address
        );
        const isOpensea = areEqualAddresses(
          addRememe.contract.address,
          OPENSEA_STORE_FRONT_CONTRACT
        );

        if (isDeployer) {
          mychecklist.push({
            status: true,
            note: "Rememe can be added (Rememe Contract Deployer)",
          });
        } else {
          mychecklist.push({
            status:
              userTDH.boosted_tdh >=
              seizeSettings.rememes_submission_tdh_threshold,
            note: `You need ${numberWithCommas(
              seizeSettings.rememes_submission_tdh_threshold
            )} TDH to add ${
              addRememe.nfts.length > 1 ? `these Rememes` : `this Rememe`
            }${
              userTDH
                ? ` (you have ${numberWithCommas(userTDH.boosted_tdh)} TDH)`
                : ``
            }`,
          });
        }
      }
    }
    setCheckList(mychecklist);
  }, [addRememe, userTDH]);

  useEffect(() => {
    if (signMessage.isError) {
      setSignErrors([`Error: ${signMessage.error?.message.split(".")[0]}`]);
    }
  }, [signMessage.isError]);

  useEffect(() => {
    fetchAllPages(
      `${process.env.API_ENDPOINT}/api/nfts?contract=${MEMES_CONTRACT}`
    ).then((responseNfts: NFT[]) => {
      setMemes(responseNfts.sort((a, b) => a.id - b.id));
      setMemesLoaded(true);
    });
  }, []);

  useEffect(() => {
    fetchUrl(`${process.env.API_ENDPOINT}/api/settings`).then(
      (settings: SeizeSettings) => {
        setSeizeSettings(settings);
      }
    );
  }, []);

  useEffect(() => {
    async function fetchTdh() {
      const url = `${process.env.API_ENDPOINT}/api/consolidated_owner_metrics/?wallet=${accountResolution.address}`;
      return fetchUrl(url).then((response: DBResponse) => {
        if (response && response.data.length == 1) {
          setUserTDH(response.data[0]);
        }
      });
    }

    if (accountResolution.isConnected) {
      fetchTdh();
    } else {
      setCheckList([]);
    }
  }, [accountResolution.isConnected]);

  useEffect(() => {
    if (signMessage.isSuccess && signMessage.data) {
      setSubmitting(true);
      postData(`${process.env.API_ENDPOINT}/api/rememes/add`, {
        address: accountResolution.address,
        signature: signMessage.data,
        rememe: buildRememeObject(),
      }).then((response) => {
        const success = response.status == 201;
        const processedRememe: ProcessedRememe = response.response;
        const contract = processedRememe.contract?.address;
        const tokens = processedRememe.nfts?.map((n) => n.tokenId);

        const nftError: string[] = processedRememe.nfts
          ? processedRememe.nfts
              .filter((n) => n.metadataError)
              .map((n) => `#${n.tokenId} - ${n.metadataError}`)
          : [];

        const message = processedRememe.error
          ? [`Error: ${processedRememe.error}`]
          : nftError;

        setSubmitting(false);
        setSubmissionResult({
          success,
          errors: message,
          contract,
          tokens,
        });
      });
    }
  }, [signMessage.data]);

  function buildRememeObject() {
    return {
      contract: addRememe?.contract.address,
      token_ids: addRememe?.nfts.map((n) => n.tokenId),
      references: references,
    };
  }

  return (
    <Container fluid className={styles.mainContainer}>
      <Row className="pb-5">
        <Col>
          <Container className="pt-4">
            <Row className="pt-2 pb-2">
              <Col sm={12} md={4} className="d-flex align-items-center gap-2">
                <Image
                  loading={"eager"}
                  width="0"
                  height="0"
                  style={{ width: "250px", height: "auto" }}
                  src="/re-memes.png"
                  alt="re-memes"
                />
              </Col>
            </Row>
            <Row className="pt-2">
              <Col>
                Please use this page to only add ReMemes{" "}
                <a href="#requirements">view requirements</a>
              </Col>
            </Row>
            <Row className="pt-4">
              <Col>
                <Container>
                  <Row className="pt-2 pb-4">
                    <Col className="no-padding">
                      <RememeAddComponent
                        memes={memes}
                        verifiedRememe={(r, references) => {
                          setAddRememe(r);
                          setReferences(references);
                          setCheckList([]);
                          setSignErrors([]);
                          signMessage.reset();
                        }}
                      />
                    </Col>
                  </Row>
                </Container>
              </Col>
            </Row>
            <Row className="pt-2">
              <Col className="d-flex justify-content-between align-items-center">
                <span className="d-flex flex-column gap-2">
                  {checkList.length > 0 && (
                    <ul className={styles.addRememeChecklist}>
                      {checkList.map((note, index) => (
                        <li
                          key={`ve-${index}`}
                          className={`d-flex align-items-center gap-2`}>
                          {note.status ? (
                            <FontAwesomeIcon
                              icon="check-circle"
                              className={styles.verifiedIcon}
                            />
                          ) : (
                            <FontAwesomeIcon
                              icon="times-circle"
                              className={styles.unverifiedIcon}
                            />
                          )}
                          {note.note}
                        </li>
                      ))}
                    </ul>
                  )}
                  {signErrors.length > 0 && (
                    <ul className={styles.addRememeChecklist}>
                      {signErrors.map((se, index) => (
                        <li
                          key={`se-${index}`}
                          className={`d-flex align-items-center gap-2`}>
                          <FontAwesomeIcon
                            icon="times-circle"
                            className={styles.unverifiedIcon}
                          />
                          {se}
                        </li>
                      ))}
                    </ul>
                  )}
                </span>
                {accountResolution.isConnected ? (
                  <span className="d-flex flex-column gap-2">
                    <Button
                      className="seize-btn"
                      disabled={
                        !addRememe ||
                        !addRememe.valid ||
                        !userTDH ||
                        checkList.some((c) => !c.status) ||
                        submissionResult?.success
                      }
                      onClick={() => {
                        setSignErrors([]);
                        setSubmissionResult(undefined);
                        if (addRememe) {
                          signMessage.signMessage({
                            message: JSON.stringify(buildRememeObject()),
                          });
                        }
                      }}>
                      Add Rememe
                    </Button>
                  </span>
                ) : (
                  <Button
                    className="seize-btn btn-white"
                    disabled={web3modal.isOpen}
                    onClick={() => web3modal.open()}>
                    {web3modal.isOpen ? `Connecting...` : `Connect Wallet`}
                  </Button>
                )}
              </Col>
            </Row>
            {(submitting || signMessage.isLoading) && (
              <Row className="pt-3">
                <Col xs={12}>
                  {signMessage.isLoading && "Signing Message"}
                  {submitting && "Adding Rememe"}
                  <div className="d-inline">
                    <div
                      className={`spinner-border ${styles.loader}`}
                      role="status">
                      <span className="sr-only"></span>
                    </div>
                  </div>
                </Col>
              </Row>
            )}
            {addRememe && submissionResult && (
              <Row className="pt-3">
                <Col xs={12}>
                  <>
                    {submissionResult.success ? (
                      <span className="d-flex align-items-center gap-2">
                        Status: Success
                        <FontAwesomeIcon
                          icon="check-circle"
                          className={styles.verifiedIcon}
                        />
                      </span>
                    ) : (
                      <span className="d-flex align-items-center gap-2">
                        Status: Fail
                        <FontAwesomeIcon
                          icon="times-circle"
                          className={styles.unverifiedIcon}
                        />
                      </span>
                    )}
                  </>
                </Col>
                {submissionResult.errors &&
                  submissionResult.errors.map((e, index) => (
                    <Col
                      xs={12}
                      className="pt-2"
                      key={`submission-result-error-${index}`}>
                      {e}
                    </Col>
                  ))}
                {submissionResult.success && submissionResult.tokens && (
                  <Row className="pt-3">
                    <Col xs={12}>
                      <u>Rememes Added:</u>
                    </Col>
                    {submissionResult.tokens.map((t) => (
                      <Col
                        xs={12}
                        className="pt-1 pb-1"
                        key={`submission-result-token-${t}`}>
                        #{t}
                        &nbsp;&nbsp;
                        <a
                          className="font-color"
                          href={`${
                            process.env.BASE_ENDPOINT
                              ? process.env.BASE_ENDPOINT
                              : "https://seize.io"
                          }/rememes/${submissionResult.contract}/${t}`}
                          target="_blank"
                          rel="noreferrer">
                          view
                        </a>
                      </Col>
                    ))}
                  </Row>
                )}
              </Row>
            )}
            <Row className="pt-5" id="requirements">
              <Col className="pt-5">
                Submission Requirements:
                <ol className="pt-2">
                  <li className="pt-2">
                    This form will allow you to submit ReMemes if you are the
                    contract deployer or if you are not the contract deployer,
                    but have a TDH &gt; 6,942
                  </li>
                  <li className="pt-2">
                    You must connect with your Ethereum wallet (from any of your
                    consolidated addresses)
                  </li>
                  <li className="pt-2">
                    The contracts and tokens added must be a ReMeme of one or
                    more Meme Cards. Please do not submit other contracts or
                    there may be implications (for you!)
                  </li>
                </ol>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
