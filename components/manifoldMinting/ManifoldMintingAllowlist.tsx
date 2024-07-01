import styles from "./ManifoldMinting.module.scss";
import { useEffect, useState } from "react";
import { Col, Container, Form, Row, Table } from "react-bootstrap";
import { ManifoldMerkleProof } from "./manifold-types";
import DotLoader from "../dotLoader/DotLoader";
import ManifoldMintingConnect from "./ManifoldMintingConnect";
import { useReadContract, useReadContracts } from "wagmi";
import { fromGWEI } from "../../helpers/Helpers";
import {
  ManifoldClaim,
  ManifoldClaimStatus,
} from "../../hooks/useManifoldClaim";
import { Time } from "../../helpers/time";

export default function ManifoldMintingAllowlist(
  props: Readonly<{
    contract: string;
    proxy: string;
    abi: any;
    claim: ManifoldClaim;
    merkleTreeId: number;
    setFee: (fee: number) => void;
  }>
) {
  const [connectedAddress, setConnectedAddress] = useState<string>("");

  const [isError, setIsError] = useState<boolean>(false);
  const [fetchingMerkle, setFetchingMerkle] = useState<boolean>(false);
  const [merkleProofs, setMerkleProofs] = useState<ManifoldMerkleProof[]>([]);
  const [merkleProofsMints, setMerkleProofsMints] = useState<boolean[]>([]);

  const [mintCount, setMintCount] = useState<number>(0);
  const [fee, setFee] = useState<number>(0);

  useEffect(() => {
    if (connectedAddress && props.merkleTreeId) {
      setFetchingMerkle(true);
      const url = `https://apps.api.manifoldxyz.dev/public/merkleTree/${props.merkleTreeId}/merkleInfo?address=${connectedAddress}`;
      fetch(url)
        .then((response) => {
          response.json().then((data: ManifoldMerkleProof[]) => {
            setMerkleProofs(data);
          });
        })
        .catch((error) => {
          setIsError(true);
        })
        .finally(() => {
          setFetchingMerkle(false);
        });
    }
  }, [connectedAddress, props.merkleTreeId]);

  function getReadContractsParams() {
    const params: any = [];
    merkleProofs.map((mp, i) => {
      params.push({
        address: props.proxy as `0x${string}`,
        abi: props.abi,
        chainId: 1,
        functionName: "checkMintIndex",
        args: [props.contract, props.claim.instanceId, mp.value],
      });
    });
    return params;
  }

  const readContracts = useReadContracts({
    contracts: getReadContractsParams(),
    query: {
      refetchInterval: 10000,
    },
  });

  const getFee = useReadContract({
    address: props.proxy as `0x${string}`,
    abi: props.abi,
    chainId: 1,
    functionName: "MINT_FEE_MERKLE",
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
    setMintCount(hasAvailableMints ? 1 : 0);
  }, [readContracts.data]);

  function mint(value: number, count: number) {
    const availableProofs = merkleProofsMints.filter((m) => !m).slice(0, count);

    if (availableProofs.length === 0) {
      return;
    }
  }

  function getButtonText() {
    if (props.claim.status === ManifoldClaimStatus.ACTIVE) {
      return `SEIZE x${mintCount}`;
    }
    if (props.claim.status === ManifoldClaimStatus.EXPIRED) {
      return "EXPIRED";
    }

    const startDate = Time.seconds(props.claim.startDate);
    const date = startDate.toIsoDateString();
    const time = startDate.toIsoTimeString();
    const today = Time.now().toIsoDateString();
    const dateDisplay = date === today ? "TODAY" : date;
    return `DROPS ${dateDisplay} ${time} UTC`;
  }

  function printMint(available: number) {
    const optionsArray = Array.from({ length: available }, (_, i) => i);
    const value = (props.claim.cost + fee) * mintCount;
    return (
      <Container className="no-padding pt-3">
        <Row>
          <Col className="d-flex gap-3 align-items-center">
            Select Mint Count:
            <Form.Select
              style={{
                width: "fit-content",
                height: "100%",
              }}
              value={mintCount}
              onChange={(e) => setMintCount(parseInt(e.target.value))}>
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
            {mintCount > 0 && <b>{fromGWEI(value)} ETH</b>}
          </Col>
        </Row>
        <Row className="pt-3">
          <Col>
            <button
              disabled={props.claim.status !== ManifoldClaimStatus.ACTIVE}
              className="btn btn-primary btn-block"
              style={{
                padding: "0.6rem",
              }}
              onClick={() => mint(value, mintCount)}>
              <b>{getButtonText()}</b>
            </button>
          </Col>
        </Row>
      </Container>
    );
  }

  function printProofs() {
    if (merkleProofs.length === 0) {
      return;
    }

    const minted = merkleProofsMints.filter((m) => m).length;
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
      <Table className={styles.spotsTable}>
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
    if (!connectedAddress) {
      return <>Connect your wallet to continue</>;
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
        <Row>
          <Col>
            {merkleProofs.length > 0 ? (
              printTable("Allowlist Spots", merkleProofs.length)
            ) : (
              <>No spots in current phase for connected address</>
            )}
          </Col>
        </Row>
        {printProofs()}
      </Container>
    );
  }

  return (
    <Container className="no-padding">
      <Row>
        <Col>
          <ManifoldMintingConnect onConnect={setConnectedAddress} />
        </Col>
      </Row>
      <Row className="pt-4">
        <Col>{printContent()}</Col>
      </Row>
    </Container>
  );
}
