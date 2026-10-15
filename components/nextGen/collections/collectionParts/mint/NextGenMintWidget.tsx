"use client";

import { isWalletConnectionResolving } from "@/components/auth/authResolution";
import AuthLoadingPlaceholder from "@/components/auth/AuthLoadingPlaceholder";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import DotLoader from "@/components/dotLoader/DotLoader";
import NextGenContractWriteStatus from "@/components/nextGen/NextGenContractWriteStatus";
import NextGenLoadError from "@/components/nextGen/NextGenLoadError";
import Button from "@/components/utils/button/Button";
import {
  NEXTGEN_CHAIN_ID,
  NEXTGEN_MINTER,
} from "@/components/nextGen/nextgen_contracts";
import type {
  ProofResponse,
  TokensPerAddress,
} from "@/components/nextGen/nextgen_entities";
import { Status } from "@/components/nextGen/nextgen_entities";
import {
  getStatusFromDates,
  useMintSharedState,
} from "@/components/nextGen/nextgen_helpers";
import { publicEnv } from "@/config/env";
import { NULL_ADDRESS } from "@/constants/constants";
import type { NextGenCollection } from "@/entities/INextgen";
import {
  areEqualAddresses,
  capitalizeFirstChar,
  createArray,
  getNetworkName,
  isValidEthAddress,
} from "@/helpers/Helpers";
import { fetchUrl } from "@/services/6529api";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useChainId, useEnsAddress, useEnsName, useWriteContract } from "wagmi";
import { Spinner } from "./NextGenMint";
import {
  MINT_INPUT_CLASSNAME,
  MINT_SELECT_CLASSNAME,
  MintInfoTooltip,
  NextGenMintErrors,
  NextGenMintingFor,
} from "./NextGenMintShared";

export function getJsonData(keccak: string, data: unknown) {
  const parsed = JSON.parse(String(data));
  const results: { key: string; value: unknown }[] = [];
  Object.entries(parsed).forEach(([key, value]) => {
    results.push({
      key,
      value,
    });
  });
  return (
    <ul className="tw-mb-0">
      {results.map((r) => (
        <li key={`ul-${keccak}-${r.key}-${r.value}`}>
          {capitalizeFirstChar(r.key)}: {r.value as ReactNode}
        </li>
      ))}
    </ul>
  );
}

interface Props {
  collection: NextGenCollection;
  available_supply: number;
  mint_price: bigint;
  mint_counts: TokensPerAddress;
  delegators: string[];
  mintForAddress: (mintForAddress: string) => void;
  fetchingMintCounts: boolean;
  refreshMintCounts: () => void;
}

// The price is wei as a bigint end to end: it is above Number.MAX_SAFE_INTEGER
// for ordinary prices, so any Number round trip would change the value sent.
function getMintValue(mintCount: number, mintPrice: bigint): bigint {
  if (!Number.isSafeInteger(mintCount) || mintCount <= 0 || mintPrice <= 0n) {
    return 0n;
  }
  return mintPrice * BigInt(mintCount);
}

function toCurrentProof(
  activeProof: { proof: ProofResponse | undefined; index: number } | undefined
) {
  return activeProof?.proof
    ? { index: activeProof.index, proof: activeProof.proof }
    : undefined;
}

export default function NextGenMintWidget(props: Readonly<Props>) {
  const chainId = useChainId();
  const connection = useSeizeConnectContext();
  const { address, isConnected, seizeConnect } = connection;

  const [currentProof, setCurrentProof] = useState<
    | {
        index: number;
        proof: ProofResponse;
      }
    | undefined
  >();
  const [originalProofs, setOriginalProofs] = useState<ProofResponse[]>([]);
  const [fetchingProofs, setFetchingProofs] = useState<boolean>(false);
  const [proofsFailed, setProofsFailed] = useState<boolean>(false);
  const [proofsAttempt, setProofsAttempt] = useState(0);

  const alStatus = getStatusFromDates(
    props.collection.allowlist_start,
    props.collection.allowlist_end
  );

  const publicStatus = getStatusFromDates(
    props.collection.public_start,
    props.collection.public_end
  );

  const {
    proofResponse,
    setProofResponse,
    mintForAddress,
    setMintForAddress,
    salt,
    mintCount,
    setMintCount,
    mintToInput,
    setMintToInput,
    mintToAddress,
    setMintToAddress,
    isMinting,
    setIsMinting,
    errors,
    setErrors,
  } = useMintSharedState();

  useEffect(() => {
    props.mintForAddress(mintForAddress);
  }, [mintForAddress]);

  function findActiveProof(proofs: ProofResponse[]) {
    if (publicStatus == Status.LIVE) {
      return undefined;
    }

    let runningTotal = 0;

    for (let index = 0; index < proofs.length; index++) {
      const response = proofs[index];
      runningTotal += response?.spots!;
      if (index > 0) {
        runningTotal -= proofs[index - 1]?.spots!;
      }
      if (props.mint_counts.allowlist < runningTotal) {
        return { proof: response, index };
      }
    }
    return {
      proof: proofs[proofs.length - 1],
      index: proofs.length - 1,
    };
  }

  // Proofs belong to one (collection, mint-for address). Anything held for a
  // previous key is dropped immediately, and the in-flight request is aborted
  // when the key changes, so a late response can never be applied to (or used
  // for) a different address.
  useEffect(() => {
    setProofResponse([]);
    setCurrentProof(undefined);
    setOriginalProofs([]);
    setProofsFailed(false);
    if (!address || props.collection.allowlist_end <= 0 || !mintForAddress) {
      setFetchingProofs(false);
      return;
    }
    const controller = new AbortController();
    const merkleRoot = props.collection.merkle_root;
    const url = `${publicEnv.API_ENDPOINT}/api/nextgen/proofs/${merkleRoot}/${mintForAddress}`;
    setFetchingProofs(true);
    fetchUrl<ProofResponse[]>(url, { signal: controller.signal }).then(
      (response: ProofResponse[]) => {
        if (controller.signal.aborted) {
          return;
        }
        const proofResponses: ProofResponse[] = [];
        if (response.length > 0) {
          proofResponses.push({
            keccak: response[0]?.keccak!,
            spots: response[0]?.spots!,
            info: response[0]?.info!,
            proof: response[0]?.proof!,
          });
          for (let i = 1; i < response.length; i++) {
            const spots = response[i]?.spots! - response[i - 1]?.spots!;
            proofResponses.push({
              keccak: response[i]?.keccak!,
              spots: spots,
              info: response[i]?.info,
              proof: response[i]?.proof!,
            });
          }
        }
        setProofResponse(proofResponses);
        setCurrentProof(toCurrentProof(findActiveProof(proofResponses)));
        setOriginalProofs(response);
        setFetchingProofs(false);
      },
      () => {
        if (!controller.signal.aborted) {
          setProofsFailed(true);
          setFetchingProofs(false);
        }
      }
    );
    return () => controller.abort();
  }, [props.collection, address, mintForAddress, proofsAttempt]);

  const mintWrite = useWriteContract();

  useEffect(() => {
    setIsMinting(false);
  }, [mintWrite.isSuccess || mintWrite.isError]);

  function isAllowlistError() {
    return (
      proofResponse && alStatus == Status.LIVE && 0 >= proofResponse.length
    );
  }

  function validate() {
    let e: string[] = [];
    if (isAllowlistError()) {
      e.push("Not in Allowlist");
    }
    return e;
  }

  const handleMintClick = () => {
    if (isConnected) {
      if (chainId === NEXTGEN_CHAIN_ID) {
        const e = validate();
        if (e.length > 0) {
          setErrors(e);
        } else {
          setIsMinting(true);
        }
      } else {
        seizeConnect();
      }
    } else {
      seizeConnect();
    }
  };

  function disableMint() {
    if (!isConnected || chainId !== NEXTGEN_CHAIN_ID) {
      return false;
    }
    if (props.available_supply <= 0) {
      return true;
    }
    if (isAllowlistError()) {
      return true;
    }
    return (
      !props.mint_counts ||
      props.fetchingMintCounts ||
      (alStatus == Status.LIVE && !proofResponse) ||
      (alStatus != Status.LIVE && publicStatus != Status.LIVE) ||
      (alStatus == Status.LIVE &&
        currentProof &&
        0 >= currentProof.proof.spots - props.mint_counts.allowlist) ||
      (publicStatus == Status.LIVE &&
        0 >= props.collection.max_purchases - props.mint_counts.public) ||
      0 >= props.available_supply ||
      isMinting
    );
  }

  useEffect(() => {
    if (isMinting) {
      mintWrite.writeContract({
        address: NEXTGEN_MINTER[NEXTGEN_CHAIN_ID] as `0x${string}`,
        abi: NEXTGEN_MINTER.abi,
        chainId: NEXTGEN_CHAIN_ID,
        value: getMintValue(mintCount, props.mint_price),
        functionName: "mint",
        args: [
          props.collection.id,
          mintCount,
          currentProof &&
          currentProof.proof.spots > 0 &&
          alStatus == Status.LIVE
            ? currentProof.proof.spots
            : 0,
          currentProof ? currentProof.proof.info : "",
          mintToAddress,
          currentProof && alStatus == Status.LIVE
            ? currentProof.proof.proof
            : [],
          areEqualAddresses(mintForAddress, address)
            ? NULL_ADDRESS
            : mintForAddress,
          salt,
        ],
      });
    }
  }, [isMinting]);

  useEffect(() => {
    setProofResponse([]);
    if (address) {
      setMintToAddress(address);
      setMintToInput(address);
    } else {
      setMintToInput("");
      setMintToAddress("");
    }
    setMintCount(0);
    mintWrite.reset();
    props.refreshMintCounts();
    props.mintForAddress((address as string) ?? "");
  }, [address]);

  const mintToAddressEns = useEnsName({
    address:
      mintToInput && isValidEthAddress(mintToInput)
        ? (mintToInput as `0x${string}`)
        : undefined,
    chainId: 1,
  });

  useEnsName({
    address:
      mintToInput && isValidEthAddress(mintToInput)
        ? (mintToInput as `0x${string}`)
        : undefined,
    chainId: 1,
  });

  useEffect(() => {
    if (mintToAddressEns.data) {
      setMintToAddress(mintToInput);
      setMintToInput(`${mintToAddressEns.data} - ${mintToInput}`);
    }
  }, [mintToAddressEns.data]);

  const mintToAddressFromEns = useEnsAddress({
    name: mintToInput?.endsWith(".eth") ? mintToInput : undefined,
    chainId: 1,
  });

  useEffect(() => {
    if (mintToAddressFromEns.data) {
      setMintToAddress(mintToAddressFromEns.data);
      setMintToInput(`${mintToInput} - ${mintToAddressFromEns.data}`);
    }
  }, [mintToAddressFromEns.data]);

  useEffect(() => {
    if (props.mint_counts) {
      setMintCount(1);
    }
  }, [props.mint_counts]);

  useEffect(() => {
    const activeProof = findActiveProof(originalProofs);
    if (activeProof?.proof) {
      setCurrentProof({
        ...activeProof,
        proof: activeProof.proof,
      });
    }
  }, [props.fetchingMintCounts]);

  function renderAllowlistOptions() {
    if (alStatus == Status.LIVE && proofResponse && proofResponse.length > 0) {
      return createArray(
        1,
        currentProof
          ? currentProof.proof.spots - props.mint_counts.allowlist
          : 0
      ).map((i) => (
        <option key={`allowlist-mint-count-${i}`} value={i}>
          {i > 0 ? i : `n/a`}
        </option>
      ));
    }
    return null;
  }

  function renderPublicOptions() {
    if (publicStatus == Status.LIVE) {
      return createArray(
        1,
        props.collection.max_purchases - props.mint_counts.public
      ).map((i) => (
        <option key={`public-mint-count-${i}`} value={i}>
          {i > 0 ? i : `n/a`}
        </option>
      ));
    }
    return <option value={0}>n/a</option>;
  }

  function renderButtonText() {
    if (!isConnected) {
      return "Connect Wallet";
    }
    if (chainId !== NEXTGEN_CHAIN_ID) {
      return `Switch to ${getNetworkName(NEXTGEN_CHAIN_ID)}`;
    }
    if (isMinting) {
      return "Processing...";
    }
    return "Mint";
  }

  if (isWalletConnectionResolving(connection))
    return <AuthLoadingPlaceholder compact />;

  return (
    <div>
      <form
        className="tw-grid tw-gap-4"
        onChange={() => {
          setErrors([]);
          setIsMinting(false);
        }}
      >
        <NextGenMintingFor
          title="Mint For"
          delegators={props.delegators}
          mintForAddress={mintForAddress}
          setMintForAddress={setMintForAddress}
        />
        <div className="tw-grid tw-gap-2">
          <div className="tw-flex tw-items-center">
            <label
              htmlFor={`mint-to-${props.collection.id}`}
              className="tw-text-sm tw-font-medium tw-text-iron-300"
            >
              Mint To
            </label>
            <MintInfoTooltip
              id={`mint-to-info-${props.collection.id}`}
              label="Mint recipient help"
              content="Address to receive the minted tokens"
            />
          </div>
          <input
            id={`mint-to-${props.collection.id}`}
            className={MINT_INPUT_CLASSNAME}
            type="text"
            placeholder="0x..."
            disabled={!isConnected || disableMint()}
            value={mintToInput}
            onChange={(e) => {
              setMintToInput(e.target.value);
              setMintToAddress(e.target.value);
            }}
          />
        </div>
        {alStatus === Status.LIVE && proofsFailed && (
          <NextGenLoadError
            message="nextgen.loadError.allowlistProofs"
            onRetry={() => setProofsAttempt((current) => current + 1)}
          />
        )}
        {alStatus === Status.LIVE &&
          !proofsFailed &&
          (fetchingProofs ? (
            <output
              aria-label="Loading allowlist proofs"
              className="tw-text-sm tw-text-iron-400"
            >
              Loading allowlist proofs <DotLoader />
            </output>
          ) : (
            proofResponse.map((response, index) => (
              <div
                key={response.keccak}
                className="tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-black/20 tw-p-3"
              >
                <label className="tw-flex tw-gap-3">
                  <input
                    className="tw-mt-1 tw-h-4 tw-w-4 tw-flex-none tw-cursor-pointer tw-rounded tw-border-white/20 tw-bg-black/20 tw-text-primary-500 focus:tw-ring-2 focus:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
                    type="checkbox"
                    id={`${response.keccak}`}
                    checked={!!(currentProof && currentProof.index >= index)}
                    readOnly
                    disabled={
                      (currentProof && index != currentProof.index) ||
                      disableMint()
                    }
                  />
                  <span>
                    Spots: {response.spots}
                    <br />
                    <span className="tw-flex tw-gap-1">
                      Data: {getJsonData(response.keccak, response.info)}
                    </span>
                  </span>
                </label>
              </div>
            ))
          ))}
        <fieldset className="tw-m-0 tw-grid tw-gap-3 tw-border-0 tw-p-0">
          <legend className="tw-sr-only">Mint options</legend>
          <div className="tw-grid tw-gap-3 sm:tw-grid-cols-[minmax(8rem,0.35fr)_minmax(0,0.65fr)] sm:tw-items-end">
            <div className="tw-grid tw-gap-2">
              <div className="tw-flex tw-items-center">
                <label
                  htmlFor={`mint-count-${props.collection.id}`}
                  className="tw-text-sm tw-font-medium tw-text-iron-300"
                >
                  Mint Count
                </label>
                <MintInfoTooltip
                  id={`mint-count-info-${props.collection.id}`}
                  label="Mint count help"
                  content="How many tokens to mint"
                />
              </div>
              <select
                id={`mint-count-${props.collection.id}`}
                className={MINT_SELECT_CLASSNAME}
                value={mintCount}
                disabled={
                  !isConnected ||
                  (publicStatus !== Status.LIVE &&
                    currentProof?.proof &&
                    currentProof.proof.spots <= 0) ||
                  disableMint()
                }
                onChange={(e) => {
                  setMintCount(parseInt(e.currentTarget.value));
                }}
              >
                {props.mint_counts ? (
                  (renderAllowlistOptions() ?? renderPublicOptions())
                ) : (
                  <option value={0}>n/a</option>
                )}
              </select>
            </div>
            <div>
              <Button
                type="button"
                variant="success"
                size="lg"
                fullWidth
                disabled={disableMint()}
                onClick={handleMintClick}
              >
                {renderButtonText()}
                {isMinting && <Spinner />}
              </Button>
            </div>
          </div>
        </fieldset>
        {errors.length > 0 && <NextGenMintErrors errors={errors} />}
        <NextGenContractWriteStatus
          isLoading={mintWrite.isPending}
          hash={mintWrite.data}
          error={mintWrite.error}
          onSuccess={() => {
            setCurrentProof(toCurrentProof(findActiveProof(originalProofs)));
            props.refreshMintCounts();
          }}
        />
      </form>
    </div>
  );
}
