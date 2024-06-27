import styles from "./ManifoldMinting.module.scss";
import { useEffect, useState } from "react";
import { Col, Container, Form, Row, Table } from "react-bootstrap";
import { ManifoldMerkleProof } from "./manifold-types";
import DotLoader from "../dotLoader/DotLoader";
import ManifoldMintingConnect from "./ManifoldMintingConnect";
import { useReadContract, useReadContracts } from "wagmi";
import { fromGWEI } from "../../helpers/Helpers";

export default function ManifoldMintingAllowlist(
  props: Readonly<{
    contract: string;
    proxy: string;
    abi: any;
    instanceId: number;
    cost: number;
    merkleTreeId: number;
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
    merkleProofs.map((mp) => {
      params.push({
        address: props.proxy as `0x${string}`,
        abi: props.abi,
        chainId: 1,
        functionName: "checkMintIndex",
        args: [props.contract, props.instanceId, mp.value],
      });
    });
    return params;
  }

  const readContracts = useReadContracts({
    contracts: getReadContractsParams(),
  });

  const getFee = useReadContract({
    address: props.proxy as `0x${string}`,
    abi: props.abi,
    chainId: 1,
    functionName: "MINT_FEE_MERKLE",
  });

  useEffect(() => {
    setFee(Number(getFee.data ?? 0));
  }, [getFee.data]);

  useEffect(() => {
    setMerkleProofsMints(
      readContracts.data?.map((d) => d.result as boolean) ?? []
    );
    const hasAvailableMints = readContracts.data?.some((d) => !d.result);
    setMintCount(hasAvailableMints ? 1 : 0);
  }, [readContracts.data]);

  function printMint(available: number) {
    const optionsArray = Array.from({ length: available }, (_, i) => i);
    return (
      <Container className="no-padding pt-3">
        <Row>
          <Col className="d-flex gap-2 align-items-center">
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
            <button
              className="btn btn-primary"
              style={{
                padding: "0.5rem 2rem",
              }}>
              <b>SEIZE x{mintCount}</b>
            </button>
            {mintCount > 0 && (
              <b>{fromGWEI(props.cost + fee) * mintCount} ETH</b>
            )}
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
            {readContracts.isFetching ? (
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
        <Row>
          <Col>{printMint(unminted)}</Col>
        </Row>
        <Row className="pt-5 font-color-h">
          <Col>
            <Table className={styles.feesTable}>
              <tbody>
                <tr className="font-color-h">
                  <td>- Mint Price</td>
                  <td>{fromGWEI(props.cost)}</td>
                </tr>
                <tr>
                  <td>- Manifold Fee</td>
                  <td>{fromGWEI(fee)}</td>
                </tr>
                <tr>
                  <td className="pt-2">Total Price Per Token</td>
                  <td className="pt-2">{fromGWEI(props.cost + fee)}</td>
                </tr>
              </tbody>
            </Table>
          </Col>
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
      <Row className="pt-2">
        <Col>{printContent()}</Col>
      </Row>
    </Container>
  );
}
