import {
  usePrepareContractWrite,
  useContractWrite,
  useContractRead,
  useAccount,
} from "wagmi";
import { NEXT_GEN_ABI } from "../../abis";
import {
  DELEGATION_ALL_ADDRESS,
  NEXT_GEN_CONTRACT,
  NULL_ADDRESS,
} from "../../constants";
import styles from "./NextGen.module.scss";
import { Button, Col, Container, Form, Row, Table } from "react-bootstrap";
import { useEffect, useState } from "react";
import { AdditionalData1, AdditionalData2, ProofResponse } from "./entities";
import { fetchUrl } from "../../services/6529api";
import { getMintingTimesDisplay, isMintingOpen } from "./NextGenCollection";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import { areEqualAddresses, fromGWEI } from "../../helpers/Helpers";
import { SUPPORTED_COLLECTIONS } from "../../pages/delegation/[...section]";

interface Props {
  collection: number;
}

export default function NextGenMint(props: Props) {
  const account = useAccount();

  const [allowlistStartTime, setAllowlistStartTime] = useState<number>(0);
  const [allowlistEndTime, setAllowlistEndTime] = useState<number>(0);
  const [publicStartTime, setPublicStartTime] = useState<number>(0);
  const [publicEndTime, setPublicEndTime] = useState<number>(0);

  const [addressMintCount, setAddressMintCount] = useState<number>();
  const [proofResponse, setProofResponse] = useState<ProofResponse>();
  const [additionalData1, setAdditionalData1] = useState<AdditionalData1>();
  const [additionalData2, setAdditionalData2] = useState<AdditionalData2>();

  const [mintToAddress, setMintToAddress] = useState<string>("");
  const [mintingForDelegator, setMintingForDelegator] = useState(false);
  const [mintForAddress, setMintForAddress] = useState<string>("");
  const [mintCount, setMintCount] = useState<number>(1);

  const [isMinting, setIsMinting] = useState(false);
  const [burnAmount, setBurnAmount] = useState<number>(0);

  useContractRead({
    address: NEXT_GEN_CONTRACT.contract,
    abi: NEXT_GEN_ABI,
    chainId: NEXT_GEN_CONTRACT.chain_id,
    functionName: "retrieveCollectionAdditionalData1",
    watch: true,
    args: [props.collection],
    onSettled(data: any, error: any) {
      if (data) {
        const d = data as any[];
        const ad1: AdditionalData1 = {
          artist_address: d[0],
          mint_cost: Math.round(parseInt(d[1]) * 100000) / 100000,
          max_purchases: parseInt(d[2]),
          circulation_supply: parseInt(d[3]),
          total_supply: parseInt(d[4]),
        };
        setAdditionalData1(ad1);
      }
    },
  });

  useContractRead({
    address: NEXT_GEN_CONTRACT.contract,
    abi: NEXT_GEN_ABI,
    chainId: NEXT_GEN_CONTRACT.chain_id,
    functionName: "retrieveCollectionAdditionalData2",
    watch: true,
    args: [props.collection],
    onSettled(data: any, error: any) {
      if (data) {
        const d = data as any[];
        const ad2: AdditionalData2 = {
          sales_percentage: parseInt(d[0]),
          is_collection_active: d[1] as boolean,
          merkle_root: d[2],
        };
        setAdditionalData2(ad2);
      }
    },
  });

  const mintWriteConfig = usePrepareContractWrite({
    address: NEXT_GEN_CONTRACT.contract,
    abi: NEXT_GEN_ABI,
    chainId: NEXT_GEN_CONTRACT.chain_id,
    value: (additionalData1
      ? additionalData1.mint_cost * mintCount
      : 0
    ).toString(),
    functionName: "mint",
    args: [
      props.collection,
      mintCount,
      isMintingOpen(allowlistStartTime, allowlistEndTime)
        ? proofResponse?.spots
        : 1,
      mintToAddress,
      isMintingOpen(allowlistStartTime, allowlistEndTime)
        ? proofResponse?.proof
        : [],
      mintingForDelegator ? mintForAddress : NULL_ADDRESS,
    ],
    enabled: isMinting,
  });
  const mintWrite = useContractWrite(mintWriteConfig.config);

  useEffect(() => {
    if (isMinting) {
      mintWrite.write();
    }
  }, [isMinting]);

  const addressMintCountRead = useContractRead({
    address: NEXT_GEN_CONTRACT.contract,
    abi: NEXT_GEN_ABI,
    chainId: NEXT_GEN_CONTRACT.chain_id,
    functionName: "tokensMintedAllowlistAddress",
    watch: true,
    enabled: mintingForDelegator
      ? account.isConnected && mintForAddress != null
      : account.isConnected,
    args: [
      props.collection,
      mintingForDelegator ? mintForAddress : account.address,
    ],
    onSettled(data: any, error: any) {
      if (!isNaN(Number(data))) {
        setAddressMintCount(parseInt(data));
      }
    },
  });

  useEffect(() => {
    if (additionalData2 && account.address) {
      const wallet = mintingForDelegator ? mintForAddress : account.address;
      fetchUrl(
        `${process.env.API_ENDPOINT}/api/gen_memes/${additionalData2.merkle_root}/${wallet}`
      ).then((response: ProofResponse) => {
        setProofResponse(response);
      });
    }
  }, [additionalData2, account.address, mintingForDelegator]);

  useEffect(() => {
    setMintToAddress(undefined);
    setProofResponse(undefined);
    if (account.address) {
      setMintToAddress(account.address);
    }
  }, [account.address]);

  useContractRead({
    address: NEXT_GEN_CONTRACT.contract,
    abi: NEXT_GEN_ABI,
    chainId: NEXT_GEN_CONTRACT.chain_id,
    functionName: "retrieveCollectionPhasesTimes",
    watch: true,
    args: [props.collection],
    onSettled(data: any, error: any) {
      if (data) {
        const times = data as any[];
        setAllowlistStartTime(parseInt(times[0]) * 1000);
        setAllowlistEndTime(parseInt(times[1]) * 1000);
        setPublicStartTime(parseInt(times[2]) * 1000);
        setPublicEndTime(parseInt(times[3]) * 1000);
      }
    },
  });

  useContractRead({
    address: NEXT_GEN_CONTRACT.contract,
    abi: NEXT_GEN_ABI,
    chainId: NEXT_GEN_CONTRACT.chain_id,
    functionName: "burnAmount",
    watch: true,
    args: [props.collection],
    onSettled(data: any, error: any) {
      if (data) {
        setBurnAmount(parseInt(data));
      }
    },
  });

  useEffect(() => {
    setAddressMintCount(0);
    if (!mintingForDelegator) {
      addressMintCountRead.refetch();
    }
  }, [mintingForDelegator]);

  return (
    <Container className="no-padding pt-4 pb-5">
      <Row>
        <Col>
          <h1>MINT COLLECTION #{props.collection}</h1>
        </Col>
      </Row>
      <Row className="pt-4">
        <Col sm={12} md={10} className="d-flex gap-4">
          <span className="d-inline-flex align-items-center gap-2">
            <span
              className={`traffic-light ${
                additionalData2 && additionalData2.is_collection_active
                  ? `green`
                  : `red`
              }`}></span>
            Active
          </span>
          <span className="d-inline-flex align-items-center gap-2">
            <span
              className={`traffic-light ${
                isMintingOpen(allowlistStartTime, allowlistEndTime)
                  ? `green`
                  : `red`
              }`}></span>
            Allowlist Minting{" "}
            {getMintingTimesDisplay(allowlistStartTime, allowlistEndTime)}
          </span>
          <span className="d-inline-flex align-items-center gap-2">
            <span
              className={`traffic-light ${
                isMintingOpen(publicStartTime, publicEndTime) ? `green` : `red`
              }`}></span>
            Public Minting{" "}
            {getMintingTimesDisplay(publicStartTime, publicEndTime)}
          </span>
        </Col>
      </Row>
      {additionalData1 && (
        <Row className="pt-5">
          <Col sm={12} md={6}>
            <Table>
              <tbody>
                <tr>
                  <td>Total Supply</td>
                  <td className="text-right">
                    <b>x{additionalData1.total_supply}</b>
                  </td>
                </tr>
                <tr>
                  <td>Minted</td>
                  <td className="text-right">
                    <b>x{additionalData1.circulation_supply}</b>
                  </td>
                </tr>
                {burnAmount > 0 && (
                  <tr>
                    <td>Burnt</td>
                    <td className="text-right">
                      <b>x{burnAmount}</b>
                    </td>
                  </tr>
                )}
                <tr>
                  <td>Available</td>
                  <td className="text-right">
                    <b>
                      {additionalData1.total_supply -
                        additionalData1.circulation_supply -
                        burnAmount >
                      0
                        ? `x${
                            additionalData1.total_supply -
                            additionalData1.circulation_supply -
                            burnAmount
                          }`
                        : `-`}
                    </b>
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}>
                    <hr />
                  </td>
                </tr>
                <tr>
                  <td>Mint Cost</td>
                  <td className="text-right">
                    <b>
                      {additionalData1.mint_cost > 0
                        ? fromGWEI(additionalData1.mint_cost)
                        : `Free`}{" "}
                      {additionalData1.mint_cost > 0 ? `ETH` : ``}
                    </b>
                  </td>
                </tr>
                <tr>
                  <td>Max Purchase Count</td>
                  <td className="text-right">
                    <b>x{additionalData1.max_purchases}</b>
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}>
                    <hr />
                  </td>
                </tr>
                {account.isConnected && addressMintCount != undefined && (
                  <tr>
                    <td>You Own</td>
                    <td className="text-right">
                      <b>
                        {addressMintCount > 0 ? `x${addressMintCount}` : `-`}
                      </b>
                    </td>
                  </tr>
                )}
                {proofResponse && (
                  <tr>
                    <td>Your Max Allowance</td>
                    <td className="text-right">
                      <b>
                        {proofResponse.spots > 0
                          ? `x${proofResponse.spots}`
                          : `-`}
                      </b>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Col>
          <Col sm={12} md={6}>
            <Container className={styles.mintArea}>
              <Row>
                <Col>
                  <Form>
                    <Form.Group as={Row} className="pb-2">
                      <Col sm={12} className="d-flex align-items-center gap-3">
                        Minting For{" "}
                        <Form.Check
                          checked={!mintingForDelegator}
                          className={styles.mintingForRadio}
                          type="radio"
                          label="Connected Wallet"
                          name="expiryRadio"
                          onChange={() => {
                            setMintingForDelegator(false);
                          }}
                        />
                        <Form.Check
                          checked={mintingForDelegator}
                          className={styles.mintingForRadio}
                          type="radio"
                          label="Delegator"
                          name="expiryRadio"
                          onChange={() => {
                            setMintingForDelegator(true);
                          }}
                        />
                      </Col>
                    </Form.Group>
                    {mintingForDelegator && (
                      <Form.Group as={Row} className="pb-2">
                        <Form.Label
                          column
                          sm={12}
                          className="d-flex align-items-center">
                          Delegator
                          <Tippy
                            content={`The address you are minting for`}
                            placement={"top"}
                            theme={"light"}>
                            <FontAwesomeIcon
                              className={styles.infoIcon}
                              icon="info-circle"></FontAwesomeIcon>
                          </Tippy>
                        </Form.Label>
                        <Col sm={12}>
                          <Form.Control
                            className={`${styles.formInput} ${styles.formInputDisabled}`}
                            type="text"
                            value={mintForAddress}
                            placeholder="0x..."
                            disabled={!account.isConnected}
                            onChange={(e) => {
                              setMintForAddress(e.target.value);
                              addressMintCountRead.refetch();
                            }}
                          />
                        </Col>
                      </Form.Group>
                    )}
                    <Form.Group as={Row} className="pb-2">
                      <Form.Label
                        column
                        sm={12}
                        className="d-flex align-items-center">
                        Mint Count
                        <Tippy
                          content={`How many tokens to mint`}
                          placement={"top"}
                          theme={"light"}>
                          <FontAwesomeIcon
                            className={styles.infoIcon}
                            icon="info-circle"></FontAwesomeIcon>
                        </Tippy>
                      </Form.Label>
                      <Col sm={12}>
                        <Form.Select
                          className={styles.mintCountSelect}
                          value={mintCount}
                          onChange={(e: any) =>
                            setMintCount(parseInt(e.currentTarget.value))
                          }>
                          {isMintingOpen(
                            allowlistStartTime,
                            allowlistEndTime
                          ) && addressMintCount ? (
                            Array.from(
                              {
                                length:
                                  additionalData1.max_purchases -
                                  addressMintCount,
                              },
                              (_, index) => addressMintCount + index
                            ).map((i) => (
                              <option
                                key={`allowlist-mint-count-${i}`}
                                value={i}>
                                {i}
                              </option>
                            ))
                          ) : isMintingOpen(publicStartTime, publicEndTime) &&
                            addressMintCount ? (
                            Array.from(
                              {
                                length:
                                  additionalData1.max_purchases -
                                  addressMintCount,
                              },
                              (_, index) => addressMintCount + index
                            ).map((i) => (
                              <option key={`public-mint-count-${i}`} value={i}>
                                {i}
                              </option>
                            ))
                          ) : (
                            <option value={0}>0</option>
                          )}
                        </Form.Select>
                      </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="pb-2">
                      <Form.Label
                        column
                        sm={12}
                        className="d-flex align-items-center">
                        Mint To
                        <Tippy
                          content={`Address to receive the minted tokens`}
                          placement={"top"}
                          theme={"light"}>
                          <FontAwesomeIcon
                            className={styles.infoIcon}
                            icon="info-circle"></FontAwesomeIcon>
                        </Tippy>
                      </Form.Label>
                      <Col sm={12}>
                        <Form.Control
                          className={`${styles.formInput} ${styles.formInputDisabled}`}
                          type="text"
                          value={mintToAddress}
                          placeholder="0x..."
                          disabled={!account.isConnected}
                          onChange={(e) => setMintToAddress(e.target.value)}
                        />
                      </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="pt-4">
                      <Col sm={12}>
                        <Button
                          className={styles.mintBtn}
                          onClick={() => setIsMinting(true)}>
                          Mint Now
                        </Button>
                      </Col>
                    </Form.Group>
                    {/* {(errors.length > 0 || gasError) && (
                      <Form.Group
                        as={Row}
                        className={`pt-2 pb-2 ${styles.newDelegationError}`}>
                        <Form.Label
                          column
                          sm={3}
                          className="d-flex align-items-center">
                          Errors
                        </Form.Label>
                        <Col sm={9} className="d-flex align-items-center">
                          <ul className="mb-0">
                            {errors.map((e, index) => (
                              <li key={`new-delegation-error-${index}`}>{e}</li>
                            ))}
                            {gasError && <li>{gasError}</li>}
                          </ul>
                        </Col>
                      </Form.Group>
                    )} */}
                  </Form>
                </Col>
              </Row>
            </Container>
          </Col>
        </Row>
      )}
    </Container>
  );
}
