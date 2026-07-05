"use client";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import DotLoader from "@/components/dotLoader/DotLoader";
import NextGenContractWriteStatus from "@/components/nextGen/NextGenContractWriteStatus";
import styles from "@/components/nextGen/collections/NextGen.module.css";
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
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import { useChainId, useEnsAddress, useEnsName, useWriteContract } from "wagmi";
import { Spinner } from "./NextGenMint";
import { NextGenMintErrors, NextGenMintingFor } from "./NextGenMintShared";

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
  mint_price: number;
  mint_counts: TokensPerAddress;
  delegators: string[];
  mintForAddress: (mintForAddress: string) => void;
  fetchingMintCounts: boolean;
  refreshMintCounts: () => void;
}

function getMintValue(mintCount: number, mintPrice: number) {
  if (!mintCount || !mintPrice) {
    return BigInt(0);
  }
  return BigInt(mintPrice * mintCount);
}

export default function NextGenMintWidget(props: Readonly<Props>) {
  const chainId = useChainId();
  const { address, isConnected, seizeConnect } = useSeizeConnectContext();

  const [currentProof, setCurrentProof] = useState<
    | {
        index: number;
        proof: ProofResponse;
      }
    | undefined
  >();
  const [originalProofs, setOriginalProofs] = useState<ProofResponse[]>([]);
  const [fetchingProofs, setFetchingProofs] = useState<boolean>(false);

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

  useEffect(() => {
    if (address && props.collection.allowlist_end > 0) {
      if (mintForAddress) {
        setFetchingProofs(true);
        const merkleRoot = props.collection.merkle_root;
        const url = `${publicEnv.API_ENDPOINT}/api/nextgen/proofs/${merkleRoot}/${mintForAddress}`;
        fetchUrl<ProofResponse[]>(url).then((response: ProofResponse[]) => {
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
          const activeProof = findActiveProof(proofResponses);
          setProofResponse(proofResponses);
          setCurrentProof({
            ...activeProof!,
            proof: activeProof!.proof!,
          });
          setOriginalProofs(response);
          setFetchingProofs(false);
        });
      }
    }
  }, [props.collection, address, mintForAddress]);

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

  function renderAllowlistStatus() {
    if (proofResponse && alStatus === Status.LIVE) {
      const maxSpots = proofResponse.reduce(
        (acc, response) => acc + response.spots,
        0
      );
      if (maxSpots > 0) {
        const spotsRemaining =
          maxSpots > props.mint_counts.allowlist
            ? ` (${maxSpots - props.mint_counts.allowlist} remaining)`
            : "";
        return `${props.mint_counts.allowlist} / ${maxSpots}${spotsRemaining}`;
      } else {
        return "You don't have any spots in the allowlist";
      }
    }
    return null;
  }

  function renderPublicStatus() {
    if (publicStatus == Status.LIVE) {
      const publicRemaining =
        props.collection.max_purchases > props.mint_counts.public
          ? ` (${
              props.collection.max_purchases - props.mint_counts.public
            } remaining)`
          : "";
      return `${props.mint_counts.public} / ${props.collection.max_purchases}${publicRemaining}`;
    }
    return null;
  }

  function renderAllowlistOptions() {
    if (alStatus == Status.LIVE && proofResponse && proofResponse.length > 0) {
      return createArray(
        1,
        currentProof
          ? currentProof.proof.spots - props.mint_counts.allowlist
          : 0
      ).map((i) => (
        <option selected key={`allowlist-mint-count-${i}`} value={i}>
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

  function getWalletMintsLabel() {
    let label = "";
    if (alStatus === Status.LIVE) {
      label = "Allowlist";
    }
    if (publicStatus === Status.LIVE) {
      label = "Public Phase";
    }
    return <>Wallet Mints {label}</>;
  }

  return (
    <div>
      <form
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
        <div className="tw-pb-2">
          <label className="tw-flex tw-items-center">
            Mint To
            <FontAwesomeIcon
              className={styles["infoIcon"]}
              icon={faInfoCircle}
              data-tooltip-id={`mint-to-info-${props.collection.id}`}
            ></FontAwesomeIcon>
            <Tooltip
              id={`mint-to-info-${props.collection.id}`}
              style={{
                backgroundColor: "#1F2937",
                color: "white",
                padding: "4px 8px",
              }}
            >
              Address to receive the minted tokens
            </Tooltip>
          </label>
          <input
            className={`${styles["formInput"]} ${styles["formInputDisabled"]} tw-form-input tw-block tw-w-full`}
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
        <div className="tw-pt-2">
          <label className="tw-flex tw-items-center">
            {getWalletMintsLabel()}
            :&nbsp;
            {props.fetchingMintCounts ? (
              <DotLoader />
            ) : (
              <b>
                {renderAllowlistStatus()}
                {renderPublicStatus()}
              </b>
            )}
          </label>
        </div>
        {alStatus === Status.LIVE &&
          (fetchingProofs ? (
            <DotLoader />
          ) : (
            proofResponse.map((response, index) => (
              <div key={response.keccak} className="tw-pl-2 tw-pt-2">
                <label className="tw-flex tw-gap-2 tw-py-1">
                  <input
                    className="tw-form-checkbox"
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
        <div className="tw-flex tw-items-center tw-py-2">
          <label className="tw-flex tw-items-center">
            Mint Count
            <FontAwesomeIcon
              className={styles["infoIcon"]}
              icon={faInfoCircle}
              data-tooltip-id={`mint-count-info-${props.collection.id}`}
            ></FontAwesomeIcon>
            <Tooltip
              id={`mint-count-info-${props.collection.id}`}
              style={{
                backgroundColor: "#1F2937",
                color: "white",
                padding: "4px 8px",
              }}
            >
              How many tokens to mint
            </Tooltip>
          </label>
          <div className="tw-w-1/4 tw-px-3">
            <select
              className={`${styles["mintSelect"]} tw-form-select tw-block tw-w-full tw-rounded-none`}
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
          <div className="tw-w-3/4 tw-px-3">
            <button
              type="button"
              className={styles["mintBtn"]}
              disabled={disableMint()}
              onClick={handleMintClick}
            >
              {renderButtonText()}
              {isMinting && <Spinner />}
            </button>
          </div>
        </div>
        {errors.length > 0 && <NextGenMintErrors errors={errors} />}
        <NextGenContractWriteStatus
          isLoading={mintWrite.isPending}
          hash={mintWrite.data}
          error={mintWrite.error}
          onSuccess={() => {
            const currentProof = findActiveProof(originalProofs);
            setCurrentProof({
              ...currentProof!,
              proof: currentProof!.proof!,
            });
            props.refreshMintCounts();
          }}
        />
      </form>
    </div>
  );
}
