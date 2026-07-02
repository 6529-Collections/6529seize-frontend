"use client";

import { publicEnv } from "@/config/env";
import { OPENSEA_STORE_FRONT_CONTRACT } from "@/constants/constants";
import type { NFT } from "@/entities/INFT";
import {
  areEqualAddresses,
  formatAddress,
  isValidEthAddress,
} from "@/helpers/Helpers";
import { postData } from "@/services/6529api";
import {
  faCheckCircle,
  faPlusCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Tooltip } from "react-tooltip";
import { useEnsName } from "wagmi";
import type { Nft, NftContract } from "./alchemy-sdk-types";
import styles from "./Rememes.module.scss";

export interface ProcessedRememe {
  valid: boolean;
  contract: NftContract;
  nfts: Nft[];
  error?: string | undefined;
}

interface Props {
  memes: NFT[];
  verifiedRememe(r: ProcessedRememe | undefined, references: number[]): void;
}

const PRIMARY_BUTTON_CLASS =
  "tw-rounded-none tw-border-0 tw-bg-[#267c93] tw-px-5 tw-py-[0.375rem] tw-font-bold tw-leading-6 tw-text-white tw-transition-colors disabled:tw-pointer-events-none disabled:tw-opacity-65 desktop-hover:hover:tw-bg-[#2b8aa3]";
const LINK_BUTTON_CLASS =
  "tw-rounded-none tw-border-0 tw-bg-transparent tw-px-5 tw-py-[0.375rem] tw-font-bold tw-leading-6 tw-text-white tw-underline desktop-hover:hover:tw-text-[#9a9a9a]";

export default function RememeAddComponent(props: Readonly<Props>) {
  const [contract, setContract] = useState("");
  const [tokenIdDisplay, setTokenIdDisplay] = useState("");
  const [tokenIds, setTokenIds] = useState<string[]>([]);

  const [verifying, setVerifying] = useState(false);

  const [contractResponse, setContractResponse] = useState<NftContract>();
  const [nftResponses, setNftResponses] = useState<Nft[]>([]);

  const [references, setReferences] = useState<NFT[]>([]);
  const [referencesDropdownOpen, setReferencesDropdownOpen] = useState(false);
  const referencesDropdownRef = useRef<HTMLDivElement>(null);

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
      for (const s of split) {
        const trimmed = s.trim();
        if (trimmed.includes("-")) {
          const range = trimmed.split("-");
          if (range.length === 2) {
            const start = Number.parseInt(range[0]?.trim()!);
            const end = Number.parseInt(range[1]?.trim()!);
            const MAX_RANGE_SIZE = 1000;
            if (
              !Number.isNaN(start) &&
              !Number.isNaN(end) &&
              start <= end &&
              end - start < MAX_RANGE_SIZE
            ) {
              for (let i = start; i <= end; i++) {
                ids.push(i.toString());
              }
            } else if (
              !Number.isNaN(start) &&
              !Number.isNaN(end) &&
              end - start >= MAX_RANGE_SIZE
            ) {
              throw new Error(
                `Range too large: ${start}-${end} (max ${MAX_RANGE_SIZE})`
              );
            }
          }
        } else if (trimmed) {
          ids.push(trimmed);
        }
      }
      return ids.length > 0 ? ids : undefined;
    } catch {
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

  useEffect(() => {
    function closeDropdown(event: MouseEvent) {
      if (
        referencesDropdownRef.current &&
        !referencesDropdownRef.current.contains(event.target as Node)
      ) {
        setReferencesDropdownOpen(false);
      }
    }

    function closeDropdownOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setReferencesDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", closeDropdown);
    document.addEventListener("keydown", closeDropdownOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeDropdown);
      document.removeEventListener("keydown", closeDropdownOnEscape);
    };
  }, []);

  function addReference(meme: NFT) {
    setReferences([...references, meme].sort((a, b) => a.id - b.id));
    setReferencesDropdownOpen(false);
  }

  return (
    <form className={styles["addRememeContainer"]}>
      <div className="tw-container tw-mx-auto tw-px-3">
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2">
          <div>
            <div className="tw-pb-4">
              <label
                className="tw-flex tw-items-center"
                htmlFor="rememe-contract"
              >
                Contract
              </label>
              <input
                id="rememe-contract"
                autoFocus
                className={`${styles["formInput"]}`}
                type="text"
                placeholder="0x..."
                value={contract}
                disabled={verifying || verified}
                onChange={(e) => setContract(e.target.value)}
              />
            </div>
          </div>
          <div>
            <div className="tw-pb-4">
              <label
                className="tw-flex tw-items-center"
                htmlFor="rememe-token-ids"
              >
                Token IDs
              </label>
              <input
                id="rememe-token-ids"
                className={`${styles["formInput"]}`}
                type="text"
                placeholder="1,2,3 or 1-3 or 1,2-5 or 1-3,5"
                value={tokenIdDisplay}
                disabled={verifying || verified}
                onChange={(e) => {
                  setTokenIdDisplay(e.target.value);
                }}
              />
            </div>
          </div>
        </div>
        <div>
          <div>
            Meme References{references.length > 0 && ` (${references.length})`}
          </div>
        </div>
        <div className="tw-pt-2">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
            {references.map((m) => (
              <span className={styles["addMemeReferenceWrapper"]} key={m.id}>
                <button
                  type="button"
                  className={`${styles["addMemeReferenceDisplayBtn"]} ${
                    verifying || verified
                      ? styles["addMemeReferenceDisplayBtnDisabled"]
                      : ""
                  }`}
                  onClick={() =>
                    setReferences((r) => r.filter((s) => s.id != m.id))
                  }
                  disabled={verifying || verified}
                  aria-label={`Clear reference #${m.id}`}
                  data-tooltip-id={`clear-reference-${m.id}`}
                >
                  x
                </button>
                <Tooltip
                  id={`clear-reference-${m.id}`}
                  place="top"
                  delayShow={250}
                  style={{
                    backgroundColor: "#1F2937",
                    color: "white",
                    padding: "4px 8px",
                  }}
                >
                  Clear
                </Tooltip>
                <span className={styles["addMemeReferenceDisplay"]}>
                  #{m.id} - {m.name}
                </span>
              </span>
            ))}
            <div
              className={`${styles["addMemeReferencesDropdown"]} tw-relative`}
              ref={referencesDropdownRef}
            >
              <button
                type="button"
                disabled={verifying || verified}
                onClick={() => {
                  setReferencesDropdownOpen((open) => !open);
                }}
                aria-expanded={referencesDropdownOpen}
              >
                <FontAwesomeIcon icon={faPlusCircle} />
              </button>
              {referencesDropdownOpen && (
                <div className="tw-absolute tw-left-0 tw-top-full tw-z-50 tw-mt-0 tw-max-h-[50vh] tw-min-w-[12rem] tw-overflow-y-auto tw-border-0 tw-border-t-[3px] tw-border-solid tw-border-t-white tw-bg-iron-950 tw-py-2 tw-shadow-md">
                  {props.memes
                    .filter((m) => !references.some((r) => r.id === m.id))
                    .map((m) => (
                      <button
                        type="button"
                        key={`add-rememe-meme-red-${m.id}`}
                        className="tw-block tw-w-[98%] tw-border-0 tw-bg-transparent tw-px-4 tw-py-2 tw-text-left tw-text-iron-100 focus:tw-bg-transparent desktop-hover:hover:tw-bg-iron-800"
                        onClick={() => addReference(m)}
                      >
                        #{m.id} - {m.name}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {(contractResponse || nftResponses.length > 0) && !verifying && (
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2">
            {contractResponse && !verifying && (
              <div className="tw-pt-4">
                <div>
                  <div>
                    <div>
                      <b>
                        <u>Contract</u>
                      </b>
                    </div>
                  </div>
                  {contractResponse.name && (
                    <div className="tw-pb-1 tw-pt-1">
                      <div>Name: {contractResponse.name}</div>
                    </div>
                  )}
                  {contractResponse.contractDeployer && (
                    <div className="tw-pb-1 tw-pt-1">
                      <div>
                        Deployer:{" "}
                        {ensResolution.isSuccess &&
                          ensResolution.data &&
                          `${ensResolution.data} - `}
                        {formatAddress(contractResponse.contractDeployer)}
                      </div>
                    </div>
                  )}
                  {contractResponse.openSeaMetadata?.collectionName && (
                    <div className="tw-pb-1 tw-pt-1">
                      <div>
                        Collection Name:{" "}
                        {contractResponse.openSeaMetadata.collectionName}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {nftResponses.length > 0 && !verifying && (
              <div className="tw-pt-4">
                <div>
                  <div>
                    <div>
                      <b>
                        <u>Tokens</u>
                      </b>
                    </div>
                  </div>
                  <ul className={styles["addRememeTokenList"]}>
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
                            <Link
                              className="decoration-hover-underline"
                              href={`https://opensea.io/assets/ethereum/${contract}/${nftR.tokenId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Image
                                unoptimized
                                src="/opensea.png"
                                alt="opensea"
                                width={22}
                                height={22}
                              />
                            </Link>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
        {verificationErrors.length > 0 && (
          <>
            <div className="tw-pt-4">
              <div className="tw-w-full">
                <span className="tw-flex tw-items-center tw-justify-start tw-gap-2">
                  <FontAwesomeIcon
                    icon={faTimesCircle}
                    className={styles["unverifiedIcon"]}
                  />
                  Verification Failed - Fix errors and revalidate
                </span>
              </div>
            </div>
            <div className="tw-pt-2">
              {verificationErrors.map((ve) => (
                <div key={ve} className="tw-w-full">
                  - {ve}
                </div>
              ))}
            </div>
          </>
        )}
        <div className="tw-pt-4">
          <div>
            {!verified ? (
              <button
                type="button"
                onClick={() => validate()}
                className={`${PRIMARY_BUTTON_CLASS} ${styles["validateButton"]}`}
                disabled={
                  !contract || !tokenIdDisplay || references.length === 0
                }
              >
                Validate
                {verifying && (
                  <span className={styles["loaderSlot"]}>
                    <span
                      className={`${styles["loader"]} tw-inline-block tw-animate-spin tw-rounded-full tw-border-solid tw-border-current tw-border-r-transparent`}
                      role="status"
                    >
                      <span className="tw-sr-only"></span>
                    </span>
                  </span>
                )}
              </button>
            ) : (
              <div className="tw-flex tw-items-center tw-justify-start tw-gap-2">
                <span className="tw-flex tw-items-center tw-justify-start tw-gap-2">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className={styles["verifiedIcon"]}
                  />
                  Verified
                  {areEqualAddresses(contract, OPENSEA_STORE_FRONT_CONTRACT) &&
                    " (OpenSea Shared Storefront Contract)"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setVerified(false);
                    setNftResponses([]);
                    setContractResponse(undefined);
                    props.verifiedRememe(undefined, []);
                  }}
                  className={LINK_BUTTON_CLASS}
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
