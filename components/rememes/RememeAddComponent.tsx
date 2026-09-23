"use client";

import Button from "@/components/utils/button/Button";
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
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import {
  faCheckCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { useEnsName } from "wagmi";
import type { Nft, NftContract } from "./alchemy-sdk-types";

export interface ProcessedRememe {
  valid: boolean;
  contract: NftContract;
  nfts: Nft[];
  error?: string | undefined;
}

interface RememeValidationResponse {
  readonly valid?: boolean | undefined;
  readonly contract?: NftContract | null | undefined;
  readonly nfts?: Nft[] | null | undefined;
  readonly error?: string | undefined;
}

interface Props {
  readonly memes: readonly NFT[];
  readonly verifiedRememe: (
    rememe: ProcessedRememe | undefined,
    references: number[]
  ) => void;
  readonly verifiedAction?: ReactNode | undefined;
}

const MAX_REFERENCE_RESULTS = 50;
const MAX_TOKEN_RANGE_SIZE = 1000;

function appendTokenRange(ids: string[], rangeValue: string): void {
  const range = rangeValue.split("-");
  if (range.length !== 2) return;

  const start = Number.parseInt(range[0]?.trim()!);
  const end = Number.parseInt(range[1]?.trim()!);
  if (
    !Number.isNaN(start) &&
    !Number.isNaN(end) &&
    end - start >= MAX_TOKEN_RANGE_SIZE
  ) {
    throw new Error(
      `Range too large: ${start}-${end} (max ${MAX_TOKEN_RANGE_SIZE})`
    );
  }
  if (Number.isNaN(start) || Number.isNaN(end) || start > end) return;

  for (let current = start; current <= end; current++) {
    ids.push(current.toString());
  }
}

function parseTokenIds(tokenIds: string): string[] | undefined {
  const ids: string[] = [];
  try {
    const split = tokenIds.split(",");
    for (const segment of split) {
      const trimmed = segment.trim();
      if (trimmed.includes("-")) {
        appendTokenRange(ids, trimmed);
      } else if (trimmed) {
        ids.push(trimmed);
      }
    }
    return ids.length > 0 ? ids : undefined;
  } catch {
    return undefined;
  }
}

function isCompleteValidResponse(
  response: RememeValidationResponse
): response is ProcessedRememe {
  return (
    response.valid === true &&
    typeof response.contract === "object" &&
    response.contract !== null &&
    Array.isArray(response.nfts)
  );
}

const INPUT_CLASS =
  "tw-form-input tw-block tw-min-h-11 tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-2.5 tw-text-base tw-text-iron-50 tw-ring-1 tw-ring-inset tw-transition placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 sm:tw-text-sm";

export default function RememeAddComponent({
  memes,
  verifiedAction,
  verifiedRememe,
}: Readonly<Props>) {
  const [contract, setContract] = useState("");
  const [tokenIdDisplay, setTokenIdDisplay] = useState("");
  const [tokenIds, setTokenIds] = useState<string[]>([]);
  const [verifying, setVerifying] = useState(false);
  const [contractResponse, setContractResponse] = useState<NftContract>();
  const [nftResponses, setNftResponses] = useState<Nft[]>([]);
  const [references, setReferences] = useState<NFT[]>([]);
  const [referenceSearch, setReferenceSearch] = useState("");
  const referenceSearchRef = useRef<HTMLInputElement>(null);
  const [verificationErrors, setVerificationErrors] = useState<string[]>([]);
  const [verified, setVerified] = useState(false);

  const sortedMemes = useMemo(
    () => [...memes].sort((a, b) => b.id - a.id),
    [memes]
  );
  const availableReferences = useMemo(() => {
    const query = referenceSearch.trim().toLowerCase();
    const normalizedNumberQuery = query.replace(/^#/u, "");
    const isNumberQuery = /^\d+$/u.test(normalizedNumberQuery);
    return sortedMemes
      .filter((meme) => !references.some((item) => item.id === meme.id))
      .filter((meme) => {
        if (!query) return true;
        if (isNumberQuery) {
          return meme.id.toString() === normalizedNumberQuery;
        }
        return meme.name.toLowerCase().includes(query);
      });
  }, [referenceSearch, references, sortedMemes]);
  const displayedReferences = availableReferences.slice(
    0,
    MAX_REFERENCE_RESULTS
  );

  const ensResolution = useEnsName({
    query: {
      enabled:
        !verifying &&
        contractResponse?.contractDeployer !== undefined &&
        isValidEthAddress(contractResponse.contractDeployer),
    },
    address: contractResponse?.contractDeployer as `0x${string}`,
    chainId: 1,
  });

  function getRememe(tokens = tokenIds) {
    return {
      contract,
      token_ids: tokens,
      references: references.map((reference) => reference.id),
    };
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
        const response = validation.response as RememeValidationResponse;
        const contractR = response.contract;
        const responseNfts = Array.isArray(response.nfts) ? response.nfts : [];
        if (contractR) {
          setContractResponse(contractR);
        }
        setNftResponses(responseNfts);
        if (response.error) {
          setVerificationErrors([response.error]);
        }
        if (responseNfts.some((nft) => nft.raw.error !== undefined)) {
          setVerificationErrors(["Some Token IDs are invalid"]);
        }
        const hasCompleteValidResponse = isCompleteValidResponse(response);
        setVerified(hasCompleteValidResponse);
        if (hasCompleteValidResponse) {
          verifiedRememe(
            response,
            references.map((reference) => reference.id)
          );
        }
      } catch (error) {
        const record = error as { message?: unknown } | null;
        setVerificationErrors([String(record?.message)]);
      }
    } else {
      setVerificationErrors(["Invalid token ID(s)"]);
    }
    setVerifying(false);
  }

  function addReference(meme: NFT) {
    setReferences((current) => [...current, meme].sort((a, b) => a.id - b.id));
    setReferenceSearch("");
    requestAnimationFrame(() => referenceSearchRef.current?.focus());
  }

  function editVerifiedDetails() {
    setVerified(false);
    setNftResponses([]);
    setContractResponse(undefined);
    verifiedRememe(undefined, []);
  }

  return (
    <form className="tw-space-y-8">
      <div className="tw-grid tw-grid-cols-1 tw-gap-5 md:tw-grid-cols-2">
        <div>
          <label
            className="tw-mb-1.5 tw-block tw-text-sm tw-font-medium tw-text-iron-100"
            htmlFor="rememe-contract"
          >
            Contract
          </label>
          <input
            id="rememe-contract"
            autoFocus
            className={`${INPUT_CLASS} tw-ring-iron-700 hover:tw-ring-iron-600`}
            type="text"
            placeholder="0x..."
            value={contract}
            disabled={verifying || verified}
            onChange={(event) => setContract(event.target.value)}
          />
        </div>
        <div>
          <label
            className="tw-mb-1.5 tw-block tw-text-sm tw-font-medium tw-text-iron-100"
            htmlFor="rememe-token-ids"
          >
            Token IDs
          </label>
          <input
            id="rememe-token-ids"
            className={`${INPUT_CLASS} tw-ring-iron-700 hover:tw-ring-iron-600`}
            type="text"
            placeholder="1,2,3 or 1-3 or 1,2-5 or 1-3,5"
            value={tokenIdDisplay}
            disabled={verifying || verified}
            onChange={(event) => setTokenIdDisplay(event.target.value)}
          />
        </div>
      </div>

      <div className="tw-space-y-3">
        <label
          className="tw-block tw-text-sm tw-font-medium tw-text-iron-100"
          htmlFor="rememe-reference-search"
        >
          Meme References{references.length > 0 && ` (${references.length})`}
        </label>
        <Combobox<NFT | null>
          value={null}
          onChange={(meme) => meme && addReference(meme)}
          immediate
          disabled={verifying || verified || memes.length === 0}
        >
          <div className="tw-relative tw-max-w-2xl">
            <MagnifyingGlassIcon
              aria-hidden="true"
              className="tw-pointer-events-none tw-absolute tw-left-3 tw-top-3 tw-z-10 tw-size-5 tw-text-iron-400"
            />
            <ComboboxInput
              id="rememe-reference-search"
              ref={referenceSearchRef}
              type="search"
              value={referenceSearch}
              onChange={(event) => setReferenceSearch(event.target.value)}
              placeholder="Meme References"
              autoComplete="off"
              className={`${INPUT_CLASS} tw-pl-10 tw-pr-11 tw-ring-iron-700 hover:tw-ring-iron-600 [&::-webkit-search-cancel-button]:tw-hidden`}
            />
            <ComboboxButton
              aria-label="Meme References"
              className="tw-absolute tw-right-0 tw-top-0 tw-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-iron-100"
            >
              <ChevronUpDownIcon aria-hidden="true" className="tw-size-5" />
            </ComboboxButton>
            <ComboboxOptions className="tw-absolute tw-z-50 tw-mt-2 tw-max-h-80 tw-w-full tw-overflow-y-auto tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-1 tw-shadow-2xl focus:tw-outline-none">
              {displayedReferences.map((meme) => (
                <ComboboxOption
                  key={meme.id}
                  value={meme}
                  className="tw-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-2 tw-rounded-md tw-px-3 tw-py-2 tw-text-sm tw-text-iron-100 data-[focus]:tw-bg-iron-800"
                >
                  <PlusIcon
                    aria-hidden="true"
                    className="tw-size-4 tw-shrink-0 tw-text-iron-400"
                  />
                  <span className="tw-min-w-0 tw-truncate">
                    #{meme.id} - {meme.name}
                  </span>
                </ComboboxOption>
              ))}
            </ComboboxOptions>
          </div>
        </Combobox>
        {references.length > 0 && (
          <ul className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-gap-2 tw-p-0">
            {references.map((meme) => (
              <li key={meme.id}>
                <span className="tw-inline-flex tw-min-h-10 tw-items-center tw-gap-2 tw-rounded-full tw-bg-iron-800 tw-py-1 tw-pl-3 tw-pr-1 tw-text-sm tw-text-iron-100">
                  <span>
                    #{meme.id} - {meme.name}
                  </span>
                  <button
                    type="button"
                    disabled={verifying || verified}
                    onClick={() =>
                      setReferences((current) =>
                        current.filter((item) => item.id !== meme.id)
                      )
                    }
                    className="tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-text-iron-50"
                    aria-label={`Clear reference #${meme.id}`}
                  >
                    <XMarkIcon aria-hidden="true" className="tw-size-4" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="tw-space-y-5">
        {(contractResponse !== undefined || nftResponses.length > 0) &&
          !verifying && (
            <div className="tw-grid tw-grid-cols-1 tw-gap-5 md:tw-grid-cols-2">
              {contractResponse && (
                <div className="tw-rounded-lg tw-bg-iron-900 tw-p-4">
                  <h3 className="tw-mb-3 tw-mt-0 tw-text-sm tw-font-semibold tw-text-iron-100">
                    Contract
                  </h3>
                  {contractResponse.name && (
                    <p className="tw-mb-2 tw-text-sm tw-text-iron-300">
                      Name: {contractResponse.name}
                    </p>
                  )}
                  {contractResponse.contractDeployer && (
                    <p className="tw-mb-2 tw-text-sm tw-text-iron-300">
                      Deployer:{" "}
                      {ensResolution.isSuccess &&
                        ensResolution.data &&
                        `${ensResolution.data} - `}
                      {formatAddress(contractResponse.contractDeployer)}
                    </p>
                  )}
                  {contractResponse.openSeaMetadata?.collectionName && (
                    <p className="tw-m-0 tw-text-sm tw-text-iron-300">
                      Collection Name:{" "}
                      {contractResponse.openSeaMetadata.collectionName}
                    </p>
                  )}
                </div>
              )}
              {nftResponses.length > 0 && (
                <div className="tw-rounded-lg tw-bg-iron-900 tw-p-4">
                  <h3 className="tw-mb-3 tw-mt-0 tw-text-sm tw-font-semibold tw-text-iron-100">
                    Tokens
                  </h3>
                  <ul className="tw-m-0 tw-space-y-2 tw-pl-5 tw-text-sm tw-text-iron-300">
                    {nftResponses.map((nft) => (
                      <li key={nft.tokenId}>
                        {nft.raw.error ? (
                          <>
                            #{nft.tokenId} - {nft.raw.error}
                          </>
                        ) : (
                          <span className="tw-inline-flex tw-items-center tw-gap-2">
                            #{nft.tokenId}
                            {nft.name && ` - ${nft.name}`}
                            <Link
                              className="tw-inline-flex focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
                              href={`https://opensea.io/assets/ethereum/${contract}/${nft.tokenId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Image
                                unoptimized
                                src="/opensea.png"
                                alt="opensea"
                                width={20}
                                height={20}
                              />
                            </Link>
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        {verificationErrors.length > 0 && (
          <div
            role="alert"
            className="tw-rounded-lg tw-bg-error/10 tw-p-4 tw-text-sm tw-text-error"
          >
            <p className="tw-m-0 tw-flex tw-items-center tw-gap-2 tw-font-semibold">
              <FontAwesomeIcon icon={faTimesCircle} className="tw-size-4" />
              Verification Failed - Fix errors and revalidate
            </p>
            <ul className="tw-mb-0 tw-mt-2 tw-space-y-1 tw-pl-5">
              {verificationErrors.map((error) => (
                <li key={error}>- {error}</li>
              ))}
            </ul>
          </div>
        )}

        {!verified ? (
          <Button
            type="button"
            onClick={validate}
            variant="action"
            size="lg"
            loading={verifying}
            disabled={!contract || !tokenIdDisplay || references.length === 0}
          >
            Validate
          </Button>
        ) : (
          <div className="tw-flex tw-flex-col tw-items-start tw-gap-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
              <span className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-emerald-400">
                <FontAwesomeIcon icon={faCheckCircle} className="tw-size-5" />
                Verified
                {areEqualAddresses(contract, OPENSEA_STORE_FRONT_CONTRACT) &&
                  " (OpenSea Shared Storefront Contract)"}
              </span>
              <button
                type="button"
                onClick={editVerifiedDetails}
                className="tw-rounded-md tw-border-0 tw-bg-transparent tw-px-2 tw-py-1 tw-text-sm tw-font-semibold tw-text-iron-200 tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-white"
              >
                Edit
              </button>
            </div>
            {verifiedAction}
          </div>
        )}
      </div>
    </form>
  );
}
