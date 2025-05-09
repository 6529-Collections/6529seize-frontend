import styles from "./Rememes.module.scss";
import { Container, Row, Col, Button } from "react-bootstrap";
import Image from "next/image";
import { useState, useEffect } from "react";
import { NFT } from "../../entities/INFT";
import { fetchUrl, postData } from "../../services/6529api";
import RememeAddComponent, { ProcessedRememe } from "./RememeAddComponent";
import { useSignMessage } from "wagmi";
import { DBResponse } from "../../entities/IDBResponse";
import { ConsolidatedTDH } from "../../entities/ITDH";
import { areEqualAddresses, numberWithCommas } from "../../helpers/Helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "../auth/Auth";
import { commonApiFetch } from "../../services/api/common-api";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import { useSeizeSettings } from "../../contexts/SeizeSettingsContext";
import {
  faCheckCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";

interface CheckList {
  status: boolean;
  note: string;
}

export default function RememeAddPage() {
  const { connectedProfile } = useAuth();
  const { address, isConnected, seizeConnect, seizeConnectOpen } =
    useSeizeConnectContext();

  const { seizeSettings } = useSeizeSettings();

  const signMessage = useSignMessage();
  const [memes, setMemes] = useState<NFT[]>([]);
  const [memesLoaded, setMemesLoaded] = useState(false);
  const [userTDH, setUserTDH] = useState<ConsolidatedTDH>();

  const [addRememe, setAddRememe] = useState<ProcessedRememe>();
  const [references, setReferences] = useState<number[]>();
  const [checkList, setCheckList] = useState<CheckList[]>([]);
  const [signErrors, setSignErrors] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    errors?: string[];
    contract?: string;
    tokens?: {
      id: string;
      name: string;
    }[];
  }>();

  useEffect(() => {
    const mychecklist: CheckList[] = [];
    if (addRememe) {
      if (!seizeSettings?.rememes_submission_tdh_threshold) {
        mychecklist.push({
          status: false,
          note: "Something went wrong fetching global settings",
        });
      } else {
        const isDeployer = areEqualAddresses(
          addRememe.contract.contractDeployer,
          address
        );

        if (isDeployer) {
          mychecklist.push({
            status: true,
            note: "Rememe can be added (Rememe Contract Deployer)",
          });
        } else {
          if (!userTDH) {
            mychecklist.push({
              status: false,
              note: "You need to have some TDH before you can add Rememes",
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
    }
    setCheckList(mychecklist);
  }, [addRememe, userTDH]);

  useEffect(() => {
    if (signMessage.isError) {
      setSignErrors([`Error: ${signMessage.error?.message.split(".")[0]}`]);
    }
  }, [signMessage.isError]);

  useEffect(() => {
    fetchUrl(`${process.env.API_ENDPOINT}/api/memes_lite`).then(
      (response: DBResponse) => {
        setMemes(response.data);
        setMemesLoaded(true);
      }
    );
  }, []);

  useEffect(() => {
    async function fetchTdh() {
      commonApiFetch<ConsolidatedTDH>({
        endpoint: `tdh/consolidation/${connectedProfile?.consolidation_key}`,
      }).then((response) => {
        setUserTDH(response);
      });
    }
    if (connectedProfile?.consolidation_key) {
      fetchTdh();
    } else {
      setCheckList([]);
    }
  }, [connectedProfile]);

  useEffect(() => {
    if (signMessage.isSuccess && signMessage.data) {
      setSubmitting(true);
      postData(`${process.env.API_ENDPOINT}/api/rememes/add`, {
        address: address,
        signature: signMessage.data,
        rememe: buildRememeObject(),
      }).then((response) => {
        const success = response.status === 201;
        const processedRememe: ProcessedRememe = response.response;
        const contract = processedRememe.contract?.address;
        const tokens = processedRememe.nfts?.map((n) => {
          return {
            id: n.tokenId,
            name: n.name ? n.name : `#${n.tokenId}`,
          };
        });

        const nftError: string[] = processedRememe.nfts
          ? processedRememe.nfts
              .filter((n) => n.raw.error)
              .map((n) => `#${n.tokenId} - ${n.raw.error}`)
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
                              icon={faCheckCircle}
                              className={styles.verifiedIcon}
                            />
                          ) : (
                            <FontAwesomeIcon
                              icon={faTimesCircle}
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
                            icon={faTimesCircle}
                            className={styles.unverifiedIcon}
                          />
                          {se}
                        </li>
                      ))}
                    </ul>
                  )}
                </span>
                {isConnected ? (
                  <span className="d-flex flex-column gap-2">
                    <Button
                      className="seize-btn"
                      disabled={
                        !addRememe ||
                        !addRememe.valid ||
                        (!userTDH &&
                          !areEqualAddresses(
                            address,
                            addRememe.contract.contractDeployer
                          )) ||
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
                    disabled={seizeConnectOpen}
                    onClick={() => seizeConnect()}>
                    {seizeConnectOpen ? `Connecting...` : `Connect Wallet`}
                  </Button>
                )}
              </Col>
            </Row>
            {(submitting || signMessage.isPending) && (
              <Row className="pt-3">
                <Col xs={12}>
                  {signMessage.isPending && "Signing Message"}
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
                          icon={faCheckCircle}
                          className={styles.verifiedIcon}
                        />
                      </span>
                    ) : (
                      <span className="d-flex align-items-center gap-2">
                        Status: Fail
                        <FontAwesomeIcon
                          icon={faTimesCircle}
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
                  <>
                    <Row className="pt-3">
                      <Col xs={12}>
                        <u>Rememes Added:</u>
                      </Col>
                      {submissionResult.tokens.map((t) => (
                        <Col
                          xs={12}
                          className="pt-1 pb-1"
                          key={`submission-result-token-${t.id}`}>
                          #{t.id} - {t.name}
                          &nbsp;&nbsp;
                          <a
                            className="font-color"
                            href={`${
                              process.env.BASE_ENDPOINT
                                ? process.env.BASE_ENDPOINT
                                : "https://6529.io"
                            }/rememes/${submissionResult.contract}/${t.id}`}
                            target="_blank"
                            rel="noreferrer">
                            view
                          </a>
                        </Col>
                      ))}
                    </Row>
                    <Row className="pt-4">
                      <Col>
                        <Button
                          className="seize-btn btn-white"
                          onClick={() => {
                            location.reload();
                          }}>
                          Add Another
                        </Button>
                      </Col>
                    </Row>
                  </>
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
