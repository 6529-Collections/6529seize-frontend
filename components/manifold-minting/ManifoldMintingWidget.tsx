"use client";

import { useSearchParams } from "next/navigation";
import { type JSX, type ReactNode, useEffect, useId, useState } from "react";
import {
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { MANIFOLD_LAZY_CLAIM_CONTRACT } from "@/constants/constants";
import type { MintingClaimsProofItem } from "@/generated/models/MintingClaimsProofItem";
import {
  areEqualAddresses,
  fromGWEI,
  getTransactionLink,
} from "@/helpers/Helpers";
import { Time } from "@/helpers/time";
import type { ManifoldClaim } from "@/hooks/useManifoldClaim";
import { ManifoldClaimStatus, ManifoldPhase } from "@/hooks/useManifoldClaim";
import { getMemesMintingProofsByAddress } from "@/services/api/memes-minting-claims-api";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import DotLoader from "../dotLoader/DotLoader";
import ManifoldMintingConnect from "./ManifoldMintingConnect";
import { isAddress, type Chain } from "viem";

const MINT_PROXY_FUNCTION_NAME = "mintProxy";

function normalizeMintCount(value: number | string | null | undefined): number {
  const parsed =
    typeof value === "string" ? Number.parseInt(value, 10) : Number(value ?? 0);

  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    return 0;
  }

  return Math.max(0, Math.trunc(parsed));
}

function MintSummaryRow({
  title,
  value,
}: {
  readonly title: string;
  readonly value: ReactNode;
}) {
  return (
    <table className="tw-w-full tw-border-separate tw-border-spacing-0">
      <thead className="tw-sr-only">
        <tr>
          <th scope="col">Label</th>
          <th scope="col">Value</th>
        </tr>
      </thead>
      <tbody>
        <tr className="tw-border-b tw-border-white/5 last:tw-border-b-0">
          <td className="tw-h-[46px] tw-w-[45%] tw-py-2 tw-pr-4 tw-align-middle">
            {title}
          </td>
          <td className="tw-h-[46px] tw-w-[55%] tw-py-2 tw-align-middle">
            <b>{value}</b>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export default function ManifoldMintingWidget(
  props: Readonly<{
    contract: string;
    chain: Chain;
    abi: any;
    claim: ManifoldClaim;
    local_timezone: boolean;
    hideConnect?: boolean;
    setFee: (fee: number) => void;
    setMintForAddress: (address: string | null) => void;
  }>
) {
  const connectedAddress = useSeizeConnectContext();
  const searchParams = useSearchParams();
  const [mintForAddress, setMintForAddress] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"" | "copied" | "failed">("");

  const [isError, setIsError] = useState<boolean>(false);
  const [fetchingMerkle, setFetchingMerkle] = useState<boolean>(false);
  const [merkleProofs, setMerkleProofs] = useState<MintingClaimsProofItem[]>(
    []
  );
  const [merkleProofsMints, setMerkleProofsMints] = useState<boolean[]>([]);

  const [mintCount, setMintCount] = useState<number>(0);
  const [feeWei, setFeeWei] = useState<bigint>(0n);
  const mintCountControlId = useId();

  const [mintStatus, setMintStatus] = useState<JSX.Element>(<></>);
  const [mintError, setMintError] = useState<string>("");
  const mintWrite = useWriteContract();
  const waitMintWrite = useWaitForTransactionReceipt({
    chainId: props.chain.id,
    confirmations: 1,
    hash: mintWrite.data,
  });
  const hasValidMintForAddress = Boolean(
    mintForAddress && isAddress(mintForAddress)
  );

  useEffect(() => {
    if (
      props.claim.phase === ManifoldPhase.PUBLIC ||
      !props.claim.merkleRoot ||
      !mintForAddress ||
      !hasValidMintForAddress
    ) {
      setMerkleProofs([]);
      setFetchingMerkle(false);
      setIsError(false);
      return;
    }

    mintWrite.reset();
    setMintStatus(<></>);
    setMintError("");
    setIsError(false);
    setFetchingMerkle(true);
    getMemesMintingProofsByAddress(
      props.claim.instanceId,
      props.claim.merkleRoot,
      mintForAddress
    )
      .then((response) => {
        const mappedProofs: MintingClaimsProofItem[] = (
          response.proofs ?? []
        ).map((proof) => ({
          merkle_proof: proof.merkle_proof ?? [],
          value: Number(proof.value ?? 0),
        }));
        setMerkleProofs(mappedProofs);
      })
      .catch((err) => {
        setMerkleProofs([]);
        const msg =
          typeof err === "string" ? err : ((err as Error)?.message ?? "");
        const isNotFound =
          /404|not found|no proof/i.test(msg) || msg.includes("404");
        setIsError(!isNotFound);
      })
      .finally(() => {
        setFetchingMerkle(false);
      });
  }, [
    hasValidMintForAddress,
    mintForAddress,
    props.claim.merkleRoot,
    props.contract,
    props.claim.instanceId,
    props.claim.phase,
  ]);

  function getReadContractsParams() {
    const params: any = [];
    merkleProofs.forEach((mp) => {
      params.push({
        address: MANIFOLD_LAZY_CLAIM_CONTRACT as `0x${string}`,
        abi: props.abi,
        chainId: props.chain.id,
        functionName: "checkMintIndex",
        args: [props.contract, props.claim.instanceId, mp.value],
      });
    });
    return params;
  }

  const readContracts = useReadContracts({
    contracts: getReadContractsParams(),
    query: {
      refetchInterval: 5000,
    },
  });

  const getFee = useReadContract({
    address: MANIFOLD_LAZY_CLAIM_CONTRACT as `0x${string}`,
    abi: props.abi,
    chainId: props.chain.id,
    functionName:
      props.claim.phase === ManifoldPhase.ALLOWLIST
        ? "MINT_FEE_MERKLE"
        : "MINT_FEE",
  });

  useEffect(() => {
    const nextFeeWei = (getFee.data as bigint | undefined) ?? 0n;
    const f = Number(nextFeeWei);
    setFeeWei(nextFeeWei);
    props.setFee(f);
  }, [getFee.data]);

  useEffect(() => {
    setMerkleProofsMints(
      readContracts.data?.map((d) => d.result as boolean) ?? []
    );
    const hasAvailableMints = readContracts.data?.some((d) => !d.result);
    setMintCount(
      hasAvailableMints || props.claim.phase === ManifoldPhase.PUBLIC ? 1 : 0
    );
  }, [readContracts.data]);

  const safeMintCount = normalizeMintCount(mintCount);

  const getSelectedMerkleProofs = () => {
    const selectedMerkleProofs: MintingClaimsProofItem[] = [];
    for (let i = 0; i < merkleProofsMints.length; i++) {
      const proof = merkleProofs[i];
      if (!proof) {
        continue;
      }
      if (!merkleProofsMints[i]) {
        selectedMerkleProofs.push(proof);
      }
      if (selectedMerkleProofs.length === safeMintCount) {
        break;
      }
    }
    return selectedMerkleProofs;
  };

  const getMintArgs = () => {
    if (!mintForAddress || !isAddress(mintForAddress)) {
      return null;
    }

    const isProxy = !areEqualAddresses(
      connectedAddress.address,
      mintForAddress
    );
    const args: any[] = [props.contract, props.claim.instanceId];
    const mintArgs = getMintArgsList(isProxy);

    args.push(...mintArgs, mintForAddress);

    const functionName = isProxy
      ? MINT_PROXY_FUNCTION_NAME
      : getDirectMintFunctionName();

    return {
      functionName,
      args,
    };
  };

  const getMintArgsList = (isProxy: boolean) => {
    const mintArgs = [];
    const selectedMerkleProofs = getSelectedMerkleProofs();

    if (safeMintCount > 1 || isProxy) {
      mintArgs.push(safeMintCount);

      if (props.claim.phase === ManifoldPhase.PUBLIC) {
        mintArgs.push([], []);
      } else {
        mintArgs.push(
          selectedMerkleProofs.map((mp) => mp.value) ?? [],
          selectedMerkleProofs.map((mp) => mp.merkle_proof) ?? []
        );
      }
    } else {
      mintArgs.push(
        selectedMerkleProofs[0]?.value ?? 0,
        selectedMerkleProofs[0]?.merkle_proof ?? []
      );
    }

    return mintArgs;
  };

  const getDirectMintFunctionName = () => {
    if (safeMintCount > 1) {
      return "mintBatch";
    }
    return "mint";
  };

  const isMintDebugEnabled = searchParams?.get("mintdebug") === "1";

  const buildMintDiagnostics = () => {
    const connectedWallet = connectedAddress.address ?? "";
    const recipientWallet = mintForAddress;
    const isProxy =
      !!connectedWallet &&
      !!recipientWallet &&
      !areEqualAddresses(connectedWallet, recipientWallet);
    const selectedProofs = getSelectedMerkleProofs();
    const argsPreview =
      hasValidMintForAddress && safeMintCount > 0
        ? (getMintArgs() ?? {
            functionName: "n/a",
            args: [],
          })
        : {
            functionName: "n/a",
            args: [],
          };

    return {
      timestamp: new Date().toISOString(),
      chainId: props.chain.id,
      claimStatus: props.claim.status,
      phase: props.claim.phase,
      connectedWallet,
      recipientWallet,
      isProxy,
      mintFunction: argsPreview.functionName,
      mintCount: safeMintCount,
      valueWei: getValue().toString(),
      feeWei: feeWei.toString(),
      claimCostWei: (props.claim.costWei ?? 0n).toString(),
      availableMerkleProofs: merkleProofs.length,
      selectedMerkleProofs: selectedProofs.length,
      mintedProofs: merkleProofsMints.filter(Boolean).length,
      mintError: mintError || null,
      txHash: mintWrite.data ?? null,
      txPending: waitMintWritePending,
      txSuccess: waitMintWriteSuccess,
    };
  };

  const onCopyMintDiagnostics = async () => {
    try {
      const diagnostics = buildMintDiagnostics();
      await navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2));
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    } finally {
      setTimeout(() => setCopyStatus(""), 2000);
    }
  };

  const onMint = () => {
    setMintError("");
    setMintStatus(<></>);

    if (safeMintCount <= 0) {
      setMintError("Enter a valid mint count");
      return;
    }

    if (!mintForAddress || !hasValidMintForAddress) {
      setMintError("Select a valid recipient wallet");
      return;
    }

    if (props.claim.phase === ManifoldPhase.ALLOWLIST) {
      const selectedProofs = getSelectedMerkleProofs();
      if (selectedProofs.length < safeMintCount) {
        setMintError("No allowlist spots in current phase for this address");
        return;
      }
    }

    const value = getValue();
    const args = getMintArgs();
    if (!args) {
      setMintError("Select a valid recipient wallet");
      return;
    }
    mintWrite.writeContract({
      address: MANIFOLD_LAZY_CLAIM_CONTRACT as `0x${string}`,
      abi: props.abi,
      chainId: props.chain.id,
      value,
      functionName: args.functionName,
      args: args.args,
    });
  };

  useEffect(() => {
    if (mintWrite.error) {
      setMintStatus(<></>);
      const fullError = mintWrite.error.message;
      const resolvedError = fullError
        .split("Request Arguments")[0]
        ?.split(".")[0]
        ?.split("Contract Call")[0];
      if (!resolvedError || resolvedError.length < 5) {
        setMintError(fullError);
      } else {
        setMintError(resolvedError);
      }
    }
  }, [mintWrite.error]);

  useEffect(() => {
    if (waitMintWrite.error) {
      setMintStatus(<></>);
      const resolvedError =
        waitMintWrite.error.message
          ?.split("Request Arguments")[0]
          ?.split(".")[0]
          ?.split("Contract Call")[0] ?? waitMintWrite.error.message;
      setMintError(resolvedError);
    }
  }, [waitMintWrite.error]);

  const getViewLink = (hash: string) => {
    return (
      <a
        href={getTransactionLink(props.chain.id, hash)}
        target="_blank"
        rel="noopener noreferrer"
        className="tw-text-iron-200 hover:tw-text-white"
      >
        view trx
      </a>
    );
  };

  const waitMintWritePending = waitMintWrite.isPending;
  const waitMintWriteSuccess = waitMintWrite.isSuccess;

  useEffect(() => {
    if (!mintWrite.data) {
      return;
    }

    if (waitMintWritePending) {
      setMintStatus(
        <div className="tw-flex tw-flex-col tw-gap-2">
          <span className="tw-text-lg tw-font-semibold tw-text-white">
            Transaction Submitted - SEIZING <DotLoader />
          </span>
          <span>{getViewLink(mintWrite.data)}</span>
        </div>
      );
      return;
    }

    if (waitMintWriteSuccess) {
      setMintStatus(
        <div className="tw-flex tw-flex-col tw-gap-2">
          <span className="tw-text-lg tw-font-semibold tw-text-success">
            SEIZED!
          </span>
          <span>{getViewLink(mintWrite.data)}</span>
        </div>
      );
    }
  }, [mintWrite.data, waitMintWritePending, waitMintWriteSuccess]);

  function getButtonText() {
    if (props.claim.status === ManifoldClaimStatus.ACTIVE) {
      return <>SEIZE {safeMintCount ? `x${safeMintCount}` : "-"}</>;
    }

    const startDate = Time.seconds(props.claim.startDate);
    let dateDisplay = startDate.toIsoDateString();
    if (props.local_timezone) {
      dateDisplay = startDate.toLocaleDropDateString().toUpperCase();
    } else if (startDate.toIsoDateString() === Time.now().toIsoDateString()) {
      dateDisplay = "TODAY";
    }
    const timeDisplay = props.local_timezone
      ? startDate.toLocaleHMString()
      : startDate.toIsoTimeStringWithoutSeconds();
    return `DROPS ${dateDisplay} ${timeDisplay ?? ""}`.trim();
  }

  function printMintCountDropdown(available: number) {
    const optionsArray = Array.from({ length: available }, (_, i) => i);
    return (
      <select
        id={mintCountControlId}
        className="tw-h-11 tw-rounded-xl tw-border tw-border-white/10 tw-bg-iron-950 tw-px-3 tw-text-sm tw-text-white focus:tw-border-primary-500 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-500/30"
        value={safeMintCount}
        onChange={(e) => setMintCount(normalizeMintCount(e.target.value))}
      >
        <option value="" disabled>
          Select
        </option>
        {optionsArray.map((i) => {
          const count = i + 1;
          return (
            <option key={count} value={count}>
              {count}
            </option>
          );
        })}
      </select>
    );
  }

  function printMintCountInput() {
    return (
      <input
        id={mintCountControlId}
        className="tw-h-11 tw-w-[100px] tw-rounded-xl tw-border tw-border-white/10 tw-bg-iron-950 tw-px-3 tw-text-sm tw-text-white focus:tw-border-primary-500 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-500/30"
        type="number"
        min={0}
        step={1}
        value={safeMintCount}
        onChange={(e) => setMintCount(normalizeMintCount(e.target.value))}
      />
    );
  }

  const getValue = () => {
    return ((props.claim.costWei ?? 0n) + feeWei) * BigInt(safeMintCount);
  };

  function printMint(available?: number) {
    return (
      <div className="tw-pt-3">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2">
          <label
            htmlFor={mintCountControlId}
            className="tw-text-base tw-font-medium tw-text-white"
          >
            Mint count
          </label>
          <div className="tw-flex tw-items-center tw-gap-3">
            {available === undefined
              ? printMintCountInput()
              : printMintCountDropdown(available)}
            {safeMintCount > 0 && (
              <b className="tw-text-white">
                {fromGWEI(Number(getValue()))} ETH
              </b>
            )}
          </div>
        </div>
        <div className="tw-pt-3">
          <button
            disabled={
              mintWrite.isPending ||
              props.claim.status !== ManifoldClaimStatus.ACTIVE ||
              safeMintCount <= 0 ||
              !hasValidMintForAddress
            }
            className="tw-w-full tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-4 tw-py-2.5 tw-font-semibold tw-text-white tw-ring-1 tw-ring-inset tw-ring-primary-500 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-primary-600 hover:tw-ring-primary-600 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
            onClick={onMint}
          >
            <b>{getButtonText()}</b>
          </button>
        </div>
        {mintError && (
          <div className="tw-pt-3 tw-text-base tw-text-red">{mintError}</div>
        )}
        {mintWrite.isPending && (
          <div className="tw-pt-3">
            <span className="tw-text-iron-100">
              Confirm in your wallet <DotLoader />
            </span>
          </div>
        )}
        {mintStatus && <div className="tw-pt-3">{mintStatus}</div>}
      </div>
    );
  }

  function printProofs() {
    if (merkleProofs.length === 0) {
      return;
    }

    const minted = merkleProofsMints.filter(Boolean).length;
    const unminted = merkleProofsMints.filter((m) => !m).length;

    return (
      <>
        <div>
          {merkleProofsMints.length == 0 ? (
            <>
              Fetching Mints <DotLoader />
            </>
          ) : (
            <div>
              {printTable("Minted", minted)}
              {printTable("Available Mints", unminted)}
            </div>
          )}
        </div>
        <div className="tw-pt-3">{printMint(unminted)}</div>
      </>
    );
  }

  function printTable(title: string, value: string | number) {
    return <MintSummaryRow title={title} value={value} />;
  }

  function printContent() {
    if (
      props.claim.status === ManifoldClaimStatus.ENDED ||
      props.claim.isFinalized
    ) {
      return <></>;
    }
    if (!hasValidMintForAddress) {
      return <></>;
    }

    if (isError) {
      return <>Error fetching allowlist data</>;
    }

    if (fetchingMerkle) {
      return (
        <>
          Fetching allowlist data <DotLoader />
        </>
      );
    }

    return (
      <div>
        {props.claim.phase === ManifoldPhase.PUBLIC ? (
          <div>{printMint()}</div>
        ) : (
          <>
            <div className="tw-mt-2">
              {merkleProofs.length > 0 ? (
                printTable("Allowlist Spots", merkleProofs.length)
              ) : (
                <>No spots in current phase for this address</>
              )}
            </div>
            {printProofs()}
          </>
        )}
      </div>
    );
  }

  function printMintDebug() {
    if (!isMintDebugEnabled) {
      return <></>;
    }

    const diagnostics = buildMintDiagnostics();
    const getCopyButtonStyle = () => {
      if (copyStatus === "copied") {
        return "tw-border-emerald-400/60 tw-bg-emerald-500/20";
      }
      if (copyStatus === "failed") {
        return "tw-border-red-400/60 tw-bg-red-500/20";
      }
      return "tw-border-white/20 tw-bg-white/10 hover:tw-bg-white/15";
    };
    const getCopyButtonText = () => {
      if (copyStatus === "copied") {
        return "Copied!";
      }
      if (copyStatus === "failed") {
        return "Copy Failed";
      }
      return "Copy";
    };

    return (
      <div className="tw-pt-3">
        <div className="tw-rounded-lg tw-border tw-border-white/15 tw-bg-white/5 tw-p-3 tw-text-xs tw-text-white/80">
          <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
            <b className="tw-text-sm tw-text-white">Mint diagnostics</b>
            <button
              type="button"
              onClick={onCopyMintDiagnostics}
              disabled={copyStatus === "copied" || copyStatus === "failed"}
              className={`tw-w-[170px] tw-rounded-md tw-border tw-px-2 tw-py-1 !tw-text-sm tw-font-medium tw-text-white disabled:tw-cursor-default ${getCopyButtonStyle()}`}
            >
              {getCopyButtonText()}
            </button>
          </div>
          <pre className="tw-mb-0 tw-mt-2 tw-max-h-36 tw-overflow-auto tw-whitespace-pre-wrap tw-break-all tw-rounded-md tw-bg-black/40 tw-p-2 tw-text-[10px] tw-text-white/80">
            {JSON.stringify(diagnostics, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  useEffect(() => {
    props.setMintForAddress(mintForAddress);
  }, [mintForAddress, props.setMintForAddress]);

  return (
    <div>
      {props.claim.status !== ManifoldClaimStatus.ENDED &&
        !props.claim.isFinalized && (
          <div>
            <ManifoldMintingConnect
              onMintFor={setMintForAddress}
              hideConnect={props.hideConnect ?? false}
            />
          </div>
        )}
      <div>{printContent()}</div>
      {printMintDebug()}
    </div>
  );
}
