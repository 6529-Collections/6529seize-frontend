"use client";

import { MANIFOLD_NETWORK } from "@/constants/constants";
import {
  areEqualAddresses,
  fromGWEI,
  getTransactionLink,
} from "@/helpers/Helpers";
import { Time } from "@/helpers/time";
import type { ManifoldClaim } from "@/hooks/useManifoldClaim";
import { ManifoldClaimStatus, ManifoldPhase } from "@/hooks/useManifoldClaim";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type JSX } from "react";
import { Col, Container, Form, Row, Table } from "react-bootstrap";
import {
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import DotLoader from "../dotLoader/DotLoader";
import type { ManifoldMerkleProof } from "./manifold-types";
import styles from "./ManifoldMinting.module.scss";
import ManifoldMintingConnect from "./ManifoldMintingConnect";

export default function ManifoldMintingWidget(
  props: Readonly<{
    contract: string;
    proxy: string;
    abi: any;
    claim: ManifoldClaim;
    merkleTreeId: number;
    setFee: (fee: number) => void;
    setMintForAddress: (address: string) => void;
  }>
) {
  const connectedAddress = useSeizeConnectContext();
  const searchParams = useSearchParams();
  const [mintForAddress, setMintForAddress] = useState<string>("");
  const [copyStatus, setCopyStatus] = useState<"" | "copied" | "failed">("");

  const [isError, setIsError] = useState<boolean>(false);
  const [fetchingMerkle, setFetchingMerkle] = useState<boolean>(false);
  const [merkleProofs, setMerkleProofs] = useState<ManifoldMerkleProof[]>([]);
  const [merkleProofsMints, setMerkleProofsMints] = useState<boolean[]>([]);

  const [mintCount, setMintCount] = useState<number>(0);
  const [fee, setFee] = useState<number>(0);

  const [mintStatus, setMintStatus] = useState<JSX.Element>(<></>);
  const [mintError, setMintError] = useState<string>("");

  useEffect(() => {
    mintWrite.reset();
    setMintStatus(<></>);
    setMintError("");

    if (props.claim.phase === ManifoldPhase.PUBLIC) {
      return;
    }

    if (mintForAddress && props.merkleTreeId) {
      setFetchingMerkle(true);
      const url = `https://apps.api.manifoldxyz.dev/public/merkleTree/${props.merkleTreeId}/merkleInfo?address=${mintForAddress}`;
      fetch(url)
        .then((response) => {
          response.json().then((data: ManifoldMerkleProof[]) => {
            setMerkleProofs(data);
          });
        })
        .catch(() => {
          setIsError(true);
        })
        .finally(() => {
          setFetchingMerkle(false);
        });
    }
  }, [mintForAddress, props.merkleTreeId]);

  function getReadContractsParams() {
    const params: any = [];
    merkleProofs.map((mp) => {
      params.push({
        address: props.proxy as `0x${string}`,
        abi: props.abi,
        chainId: MANIFOLD_NETWORK.id,
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
    address: props.proxy as `0x${string}`,
    abi: props.abi,
    chainId: MANIFOLD_NETWORK.id,
    functionName:
      props.claim.phase === ManifoldPhase.ALLOWLIST
        ? "MINT_FEE_MERKLE"
        : "MINT_FEE",
  });

  const mintWrite = useWriteContract();
  const waitMintWrite = useWaitForTransactionReceipt({
    chainId: MANIFOLD_NETWORK.id,
    confirmations: 1,
    hash: mintWrite.data,
  });

  useEffect(() => {
    const f = Number(getFee.data ?? 0);
    setFee(f);
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

  const getSelectedMerkleProofs = () => {
    const selectedMerkleProofs: ManifoldMerkleProof[] = [];
    for (let i = 0; i < merkleProofsMints.length; i++) {
      if (!merkleProofsMints[i]) {
        selectedMerkleProofs.push(merkleProofs[i]!);
      }
      if (selectedMerkleProofs.length === mintCount) {
        break;
      }
    }
    return selectedMerkleProofs;
  };

  const getMintArgs = () => {
    const isProxy = !areEqualAddresses(
      connectedAddress.address,
      mintForAddress
    );
    const args: any[] = [props.contract, props.claim.instanceId];
    const mintArgs = getMintArgsList(isProxy);

    args.push(...mintArgs, mintForAddress);

    const functionName = getMintFunctionName(isProxy);

    return {
      functionName,
      args,
    };
  };

  const getMintArgsList = (isProxy: boolean) => {
    const mintArgs = [];
    const selectedMerkleProofs = getSelectedMerkleProofs();

    if (mintCount > 1 || isProxy) {
      mintArgs.push(mintCount);

      if (props.claim.phase === ManifoldPhase.PUBLIC) {
        mintArgs.push([], []);
      } else {
        mintArgs.push(
          selectedMerkleProofs.map((mp) => mp.value) ?? [],
          selectedMerkleProofs.map((mp) => mp.merkleProof) ?? []
        );
      }
    } else {
      mintArgs.push(
        selectedMerkleProofs[0]?.value ?? 0,
        selectedMerkleProofs[0]?.merkleProof ?? []
      );
    }

    return mintArgs;
  };

  const getMintFunctionName = (isProxy: boolean) => {
    if (isProxy) {
      return "mintProxy";
    } else if (mintCount > 1) {
      return "mintBatch";
    } else {
      return "mint";
    }
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
      recipientWallet && mintCount > 0
        ? getMintArgs()
        : {
            functionName: "n/a",
            args: [],
          };

    return {
      timestamp: new Date().toISOString(),
      chainId: MANIFOLD_NETWORK.id,
      claimStatus: props.claim.status,
      phase: props.claim.phase,
      connectedWallet,
      recipientWallet,
      isProxy,
      mintFunction: argsPreview.functionName,
      mintCount,
      valueWei: getValue().toString(),
      feeWei: fee.toString(),
      claimCostWei: props.claim.cost.toString(),
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
    const value = getValue();
    const args = getMintArgs();
    mintWrite.writeContract({
      address: props.proxy as `0x${string}`,
      abi: props.abi,
      chainId: MANIFOLD_NETWORK.id,
      value: BigInt(value),
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
      setMintError(
        waitMintWrite.error.message
          ?.split("Request Arguments")[0]
          ?.split(".")[0]
          ?.split("Contract Call")[0]!
      );
    }
  }, [waitMintWrite.error]);

  const getViewLink = (hash: string) => {
    return (
      <a
        href={getTransactionLink(MANIFOLD_NETWORK.id, hash)}
        target="_blank"
        rel="noopener noreferrer"
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
        <>
          <span className="font-larger font-bolder">
            Transaction Submitted - SEIZING <DotLoader />
          </span>
          <br />
          <span className="pt-2">{getViewLink(mintWrite.data)}</span>
        </>
      );
      return;
    }

    if (waitMintWriteSuccess) {
      setMintStatus(
        <>
          <span className="text-success font-larger font-bolder">SEIZED!</span>
          <br />
          <span className="pt-2">{getViewLink(mintWrite.data)}</span>
        </>
      );
    }
  }, [mintWrite.data, waitMintWritePending, waitMintWriteSuccess]);

  function getButtonText() {
    if (props.claim.status === ManifoldClaimStatus.ACTIVE) {
      return <>SEIZE {mintCount ? `x${mintCount}` : "-"}</>;
    }

    const startDate = Time.seconds(props.claim.startDate);
    const date = startDate.toIsoDateString();
    const time = startDate.toIsoTimeString();
    const today = Time.now().toIsoDateString();
    const dateDisplay = date === today ? "TODAY" : date;
    return `DROPS ${dateDisplay} ${time} UTC`;
  }

  function printMintCountDropdown(available: number) {
    const optionsArray = Array.from({ length: available }, (_, i) => i);
    return (
      <Form.Select
        style={{
          width: "fit-content",
          height: "100%",
        }}
        value={mintCount}
        onChange={(e) => setMintCount(Number.parseInt(e.target.value))}
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
      </Form.Select>
    );
  }

  function printMintCountInput() {
    return (
      <Form.Control
        style={{
          width: "100px",
        }}
        type="number"
        value={mintCount}
        onChange={(e) => setMintCount(Number.parseInt(e.target.value))}
      />
    );
  }

  const getValue = () => {
    return (props.claim.cost + fee) * mintCount;
  };

  function printMint(available?: number) {
    return (
      <Container className="no-padding pt-3">
        <Row>
          <Col className="d-flex gap-3 align-items-center">
            Select Mint Count:
            {available === undefined
              ? printMintCountInput()
              : printMintCountDropdown(available)}
            {mintCount > 0 && <b>{fromGWEI(getValue())} ETH</b>}
          </Col>
        </Row>
        <Row className="pt-3">
          <Col>
            <button
              disabled={
                mintWrite.isPending ||
                props.claim.status !== ManifoldClaimStatus.ACTIVE ||
                !mintCount
              }
              className="tw-w-full tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-4 tw-py-2.5 tw-font-semibold tw-text-white tw-ring-1 tw-ring-inset tw-ring-primary-500 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-primary-600 hover:tw-ring-primary-600 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
              onClick={onMint}
            >
              <b>{getButtonText()}</b>
            </button>
          </Col>
        </Row>
        {mintError && (
          <Row className="pt-3">
            <Col className="text-danger">{mintError}</Col>
          </Row>
        )}
        {mintWrite.isPending && (
          <Row className="pt-3">
            <Col>
              <span>
                Confirm in your wallet <DotLoader />
              </span>
            </Col>
          </Row>
        )}
        {mintStatus && (
          <Row className="pt-3">
            <Col>{mintStatus}</Col>
          </Row>
        )}
      </Container>
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
        <Row>
          <Col>
            {merkleProofsMints.length == 0 ? (
              <>
                Fetching Mints <DotLoader />
              </>
            ) : (
              <>
                {printTable("Minted", minted)}{" "}
                {printTable("Available Mints", unminted)}
              </>
            )}
          </Col>
        </Row>
        <Row className="pt-3">
          <Col>{printMint(unminted)}</Col>
        </Row>
      </>
    );
  }

  function printTable(title: string, value: string | number) {
    return (
      <Table className={styles["spotsTable"]}>
        <tbody>
          <tr>
            <td>{title}</td>
            <td>
              <b>{value}</b>
            </td>
          </tr>
        </tbody>
      </Table>
    );
  }

  function printContent() {
    if (
      props.claim.status === ManifoldClaimStatus.ENDED ||
      props.claim.isFinalized
    ) {
      return <></>;
    }
    if (!mintForAddress) {
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
      <Container className="no-padding">
        {props.claim.phase === ManifoldPhase.PUBLIC ? (
          <Row>
            <Col>{printMint()}</Col>
          </Row>
        ) : (
          <>
            <Row>
              <Col>
                {merkleProofs.length > 0 ? (
                  printTable("Allowlist Spots", merkleProofs.length)
                ) : (
                  <>No spots in current phase for this address</>
                )}
              </Col>
            </Row>
            {printProofs()}
          </>
        )}
      </Container>
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
      <Row className="pt-3">
        <Col>
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
        </Col>
      </Row>
    );
  }

  useEffect(() => {
    props.setMintForAddress(mintForAddress);
  }, [mintForAddress]);

  return (
    <Container className="no-padding">
      {props.claim.status !== ManifoldClaimStatus.ENDED &&
        !props.claim.isFinalized && (
          <Row>
            <Col>
              <ManifoldMintingConnect onMintFor={setMintForAddress} />
            </Col>
          </Row>
        )}
      <Row>
        <Col>{printContent()}</Col>
      </Row>
      {printMintDebug()}
    </Container>
  );
}
