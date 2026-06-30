"use client";

import { publicEnv } from "@/config/env";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { useSetTitle } from "@/contexts/TitleContext";
import type { DBResponse } from "@/entities/IDBResponse";
import type { NFT } from "@/entities/INFT";
import type { ConsolidatedTDH } from "@/entities/ITDH";
import { getRandomObjectId } from "@/helpers/AllowlistToolHelpers";
import { areEqualAddresses, numberWithCommas } from "@/helpers/Helpers";
import { fetchUrl } from "@/services/6529api";
import { commonApiFetch } from "@/services/api/common-api";
import { getStagingAuth } from "@/services/auth/auth.utils";
import {
  faCheckCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSignMessage } from "wagmi";
import {
  buildRememeSignatureMessage,
  isStructuredSignaturesEnabled,
} from "@/services/wallet-signatures/structured-wallet-signatures";
import { useAuth } from "../auth/Auth";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import type { ProcessedRememe } from "./RememeAddComponent";
import RememeAddComponent from "./RememeAddComponent";
import styles from "./Rememes.module.scss";

interface CheckList {
  status: boolean;
  note: string;
}

const PRIMARY_BUTTON_CLASS =
  "seize-btn tw-bg-[#267c93] tw-py-[0.375rem] tw-leading-6 tw-text-white tw-transition-colors disabled:tw-pointer-events-none disabled:tw-opacity-65 desktop-hover:hover:tw-bg-[#2b8aa3]";
const WHITE_BUTTON_CLASS =
  "seize-btn btn-white tw-py-[0.375rem] tw-leading-6 disabled:tw-pointer-events-none disabled:tw-opacity-65";

function getSubmissionErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return `Error: ${error.message}`;
  }
  return "Error: Failed to add Rememe";
}

async function postRememeSubmission(body: {
  address: string;
  signature: string;
  signature_message?: string | undefined;
  rememe: {
    contract: string | undefined;
    token_ids: string[] | undefined;
    references: number[] | undefined;
  };
}) {
  const headers = new Headers({ "Content-Type": "application/json" });
  const apiAuth = getStagingAuth();
  if (apiAuth) {
    headers.set("x-6529-auth", apiAuth);
  }

  const response = await fetch(`${publicEnv.API_ENDPOINT}/api/rememes/add`, {
    method: "POST",
    body: JSON.stringify(body),
    headers,
  });
  const json = await response.json().catch(() => ({
    error: `HTTP error! status: ${response.status}`,
  }));

  return {
    status: response.status,
    response: json as ProcessedRememe,
  };
}

export default function RememeAddPage() {
  useSetTitle("Add ReMemes | Collections");
  const { connectedProfile } = useAuth();
  const { address, isConnected, seizeConnect, seizeConnectOpen } =
    useSeizeConnectContext();

  const { seizeSettings } = useSeizeSettings();

  const signMessage = useSignMessage();
  const signatureMessageRef = useRef<string | null>(null);
  const signedRememeRef = useRef<ReturnType<typeof buildRememeObject> | null>(
    null
  );
  const signerAddressRef = useRef<string | null>(null);
  const [memes, setMemes] = useState<NFT[]>([]);
  const [userTDH, setUserTDH] = useState<ConsolidatedTDH>();

  const [addRememe, setAddRememe] = useState<ProcessedRememe>();
  const [references, setReferences] = useState<number[]>();
  const [checkList, setCheckList] = useState<CheckList[]>([]);
  const [signErrors, setSignErrors] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    errors?: string[] | undefined;
    contract?: string | undefined;
    tokens?:
      | {
          id: string;
          name: string;
        }[]
      | undefined;
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
        } else if (!userTDH) {
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
    setCheckList(mychecklist);
  }, [addRememe, userTDH]);

  useEffect(() => {
    if (signMessage.isError) {
      setSignErrors([`Error: ${signMessage.error?.message.split(".")[0]}`]);
    }
  }, [signMessage.isError]);

  useEffect(() => {
    fetchUrl(`${publicEnv.API_ENDPOINT}/api/memes_lite`).then(
      (response: DBResponse) => {
        setMemes(response.data);
      }
    );
  }, []);

  useEffect(() => {
    async function fetchTdh() {
      commonApiFetch<ConsolidatedTDH>({
        endpoint: `tdh/consolidation/${connectedProfile?.consolidation_key}`,
      })
        .then((response) => {
          setUserTDH(response);
        })
        .catch(() => {
          setUserTDH(undefined);
        });
    }
    if (connectedProfile?.consolidation_key) {
      fetchTdh();
    } else {
      setCheckList([]);
    }
  }, [connectedProfile]);

  useEffect(() => {
    if (signMessage.isSuccess && signMessage.data && addRememe) {
      const signerAddress = signerAddressRef.current;
      if (!signerAddress) {
        setSignErrors(["Error: Connect a wallet before signing"]);
        return;
      }
      setSubmitting(true);
      postRememeSubmission({
        address: signerAddress,
        signature: signMessage.data,
        ...(signatureMessageRef.current
          ? { signature_message: signatureMessageRef.current }
          : {}),
        rememe: signedRememeRef.current ?? buildRememeObject(),
      })
        .then((response) => {
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
          const errors =
            !success && message.length === 0
              ? ["Error: Failed to add Rememe"]
              : message;

          setSubmissionResult({
            success,
            errors,
            contract,
            tokens,
          });
        })
        .catch((error) => {
          setSubmissionResult({
            success: false,
            errors: [getSubmissionErrorMessage(error)],
          });
        })
        .finally(() => {
          setSubmitting(false);
        });
    }
  }, [signMessage.data, addRememe]);

  function buildRememeObject() {
    return {
      contract: addRememe?.contract.address,
      token_ids: addRememe?.nfts.map((n) => n.tokenId),
      references: references,
    };
  }

  return (
    <div className={`${styles["mainContainer"]} tw-w-full`}>
      <div className="tw-pb-5">
        <div>
          <div className="tw-container tw-mx-auto tw-px-3 tw-pt-4">
            <div className="tw-grid tw-grid-cols-1 tw-pb-2 tw-pt-2">
              <div className="tw-flex tw-items-center tw-gap-2 md:tw-col-span-4">
                <Image
                  unoptimized
                  loading={"eager"}
                  width="0"
                  height="0"
                  style={{ width: "250px", height: "auto" }}
                  src="/re-memes.png"
                  alt="re-memes"
                />
              </div>
            </div>
            <div className="tw-pt-2">
              <div>
                Please use this page to only add ReMemes{" "}
                <Link href="#requirements">view requirements</Link>
              </div>
            </div>
            <div className="tw-pt-4">
              <div>
                <div className="tw-container tw-mx-auto">
                  <div className="tw-pb-4 tw-pt-2">
                    <div>
                      <RememeAddComponent
                        memes={memes}
                        verifiedRememe={(r, references) => {
                          setAddRememe(r);
                          setReferences(references);
                          setCheckList([]);
                          setSignErrors([]);
                          signatureMessageRef.current = null;
                          signedRememeRef.current = null;
                          signerAddressRef.current = null;
                          signMessage.reset();
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="tw-pt-2">
              <div className="tw-flex tw-items-center tw-justify-between">
                <span className="tw-flex tw-flex-col tw-gap-2">
                  {checkList.length > 0 && (
                    <ul className={styles["addRememeChecklist"]}>
                      {checkList.map((note, index) => (
                        <li
                          key={`ve-${index}`}
                          className="tw-flex tw-items-center tw-gap-2"
                        >
                          {note.status ? (
                            <FontAwesomeIcon
                              icon={faCheckCircle}
                              className={styles["verifiedIcon"]}
                              data-testid="check-circle"
                            />
                          ) : (
                            <FontAwesomeIcon
                              icon={faTimesCircle}
                              className={styles["unverifiedIcon"]}
                            />
                          )}
                          {note.note}
                        </li>
                      ))}
                    </ul>
                  )}
                  {signErrors.length > 0 && (
                    <ul className={styles["addRememeChecklist"]}>
                      {signErrors.map((se, index) => (
                        <li
                          key={`se-${index}`}
                          className="tw-flex tw-items-center tw-gap-2"
                        >
                          <FontAwesomeIcon
                            icon={faTimesCircle}
                            className={styles["unverifiedIcon"]}
                          />
                          {se}
                        </li>
                      ))}
                    </ul>
                  )}
                </span>
                {isConnected ? (
                  <span className="tw-flex tw-flex-col tw-gap-2">
                    <button
                      type="button"
                      className={PRIMARY_BUTTON_CLASS}
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
                          if (!address) {
                            signerAddressRef.current = null;
                            signedRememeRef.current = null;
                            setSignErrors([
                              "Error: Connect a wallet before signing",
                            ]);
                            return;
                          }
                          const signingAddress = address;
                          const rememe = buildRememeObject();
                          signedRememeRef.current = rememe;
                          signerAddressRef.current = signingAddress;
                          if (isStructuredSignaturesEnabled()) {
                            const { message } = buildRememeSignatureMessage({
                              address: signingAddress,
                              rememe,
                            });
                            signatureMessageRef.current = message;
                            signMessage.signMessage({ message });
                            return;
                          }
                          signatureMessageRef.current = null;
                          signMessage.signMessage({
                            message: JSON.stringify(rememe),
                          });
                        }
                      }}
                    >
                      Add Rememe
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className={WHITE_BUTTON_CLASS}
                    disabled={seizeConnectOpen}
                    onClick={() => seizeConnect()}
                  >
                    {seizeConnectOpen ? `Connecting...` : `Connect Wallet`}
                  </button>
                )}
              </div>
            </div>
            {(submitting || signMessage.isPending) && (
              <div className="tw-pt-3">
                <div className="tw-w-full">
                  <span className="tw-inline-flex tw-items-center tw-gap-2">
                    {signMessage.isPending && "Signing Message"}
                    {submitting && "Adding Rememe"}
                    <div
                      className={`${styles["loader"]} tw-inline-block tw-animate-spin tw-rounded-full tw-border-solid tw-border-current tw-border-r-transparent`}
                      role="status"
                    >
                      <span className="tw-sr-only"></span>
                    </div>
                  </span>
                </div>
              </div>
            )}
            {addRememe && submissionResult && (
              <div className="tw-pt-3">
                <div className="tw-w-full">
                  {submissionResult.success ? (
                    <span className="tw-flex tw-items-center tw-gap-2">
                      Status: Success
                      <FontAwesomeIcon
                        icon={faCheckCircle}
                        className={styles["verifiedIcon"]}
                      />
                    </span>
                  ) : (
                    <span className="tw-flex tw-items-center tw-gap-2">
                      Status: Fail
                      <FontAwesomeIcon
                        icon={faTimesCircle}
                        className={styles["unverifiedIcon"]}
                      />
                    </span>
                  )}
                </div>
                {submissionResult.errors &&
                  submissionResult.errors.map((e) => (
                    <div
                      className="tw-w-full tw-pt-2"
                      key={getRandomObjectId()}
                    >
                      {e}
                    </div>
                  ))}
                {submissionResult.success && submissionResult.tokens && (
                  <>
                    <div className="tw-pt-3">
                      <div className="tw-w-full">
                        <u>Rememes Added:</u>
                      </div>
                      {submissionResult.tokens.map((t) => (
                        <div
                          className="tw-w-full tw-pb-1 tw-pt-1"
                          key={`submission-result-token-${t.id}`}
                        >
                          #{t.id} - {t.name}
                          &nbsp;&nbsp;
                          <a
                            className="font-color"
                            href={`${publicEnv.BASE_ENDPOINT}/rememes/${submissionResult.contract}/${t.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            view
                          </a>
                        </div>
                      ))}
                    </div>
                    <div className="tw-pt-4">
                      <div>
                        <button
                          type="button"
                          className={WHITE_BUTTON_CLASS}
                          onClick={() => {
                            location.reload();
                          }}
                        >
                          Add Another
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            <div className="tw-pt-5" id="requirements">
              <div className="tw-pt-5">
                Submission Requirements:
                <ol className="tw-pt-2">
                  <li className="tw-pt-2">
                    This form will allow you to submit ReMemes if you are the
                    contract deployer or if you are not the contract deployer,
                    but have a TDH &gt; 6,942
                  </li>
                  <li className="tw-pt-2">
                    You must connect with your Ethereum wallet (from any of your
                    consolidated addresses)
                  </li>
                  <li className="tw-pt-2">
                    The contracts and tokens added must be a ReMeme of one or
                    more Meme Cards. Please do not submit other contracts or
                    there may be implications (for you!)
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
