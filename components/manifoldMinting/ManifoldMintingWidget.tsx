"use client";

import { MANIFOLD_NETWORK } from "@/constants";
import { useEffect, useState, type JSX } from "react";
import { Col, Container, Form, Row, Table } from "react-bootstrap";
import {
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  areEqualAddresses,
  fromGWEI,
  getTransactionLink,
} from "@/helpers/Helpers";
import { Time } from "@/helpers/time";
import type { ManifoldClaim } from "@/hooks/useManifoldClaim";
import { ManifoldClaimStatus, ManifoldPhase } from "@/hooks/useManifoldClaim";
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
  const [mintForAddress, setMintForAddress] = useState<string>("");

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
              className="btn btn-primary btn-block"
              style={{
                padding: "0.6rem",
              }}
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
      return (
        <button
          disabled
          className="btn btn-primary btn-block"
          style={{
            padding: "0.6rem",
          }}
        >
          <b>
            {props.claim.status === ManifoldClaimStatus.ENDED
              ? "ENDED"
              : "SOLD OUT"}
          </b>
        </button>
      );
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
      <Row className="pt-2">
        <Col>{printContent()}</Col>
      </Row>
    </Container>
  );
}
