import {
  usePrepareContractWrite,
  useContractWrite,
  useContractRead,
  useAccount,
  useChainId,
  useContractReads,
  useWaitForTransaction,
  useEnsAddress,
  useEnsName,
} from "wagmi";
import { DELEGATION_ABI } from "../../abis";
import {
  DELEGATION_CONTRACT,
  MEMES_CONTRACT,
  NULL_ADDRESS,
} from "../../constants";
import styles from "./NextGen.module.scss";
import { Button, Col, Container, Form, Row, Table } from "react-bootstrap";
import { useEffect, useState } from "react";
import {
  AdditionalData,
  Info,
  PhaseTimes,
  ProofResponse,
  TokensPerAddress,
} from "./entities";
import { fetchUrl } from "../../services/6529api";
import {
  getMintingTimesDisplay,
  isMintingOpen,
  isMintingUpcoming,
} from "./NextGenCollection";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import {
  createArray,
  fromGWEI,
  getNetworkName,
  getTransactionLink,
} from "../../helpers/Helpers";
import { useWeb3Modal } from "@web3modal/react";
import {
  ALL_USE_CASE,
  MINTING_USE_CASE,
} from "../../pages/delegation/[...section]";
import { NEXTGEN_CHAIN_ID, NEXTGEN_CORE, NEXTGEN_MINTER } from "./contracts";

function NextGenDelegatorOption(props: { address: string }) {
  const ens = useEnsName({
    address: props.address as `0x${string}`,
    chainId: 1,
  });

  return (
    <option value={props.address}>
      {ens.data ? `${ens.data} - ${props.address}` : props.address}
    </option>
  );
}

interface Props {
  collection: number;
}

export default function NextGenMint(props: Props) {
  const account = useAccount();
  const chainId = useChainId();
  const web3Modal = useWeb3Modal();

  const [nowTime, setNowTime] = useState(
    Math.round(new Date().getTime() / 1000)
  );

  const [phaseTimes, setPhaseTimes] = useState<PhaseTimes>();

  const [addressMintCounts, setAddressMintCounts] =
    useState<TokensPerAddress>();
  const [proofResponse, setProofResponse] = useState<ProofResponse>();
  const [info, setInfo] = useState<Info>();
  const [additionalData, setAdditionalData] = useState<AdditionalData>();

  const [mintToInput, setMintToInput] = useState("");
  const [mintToAddress, setMintToAddress] = useState("");

  const [mintingForDelegator, setMintingForDelegator] = useState(false);
  const [mintForAddress, setMintForAddress] = useState<string>("");
  const [mintCount, setMintCount] = useState<number>(1);

  const [isMinting, setIsMinting] = useState(false);
  const [burnAmount, setBurnAmount] = useState<number>(-1);
  const [mintPrice, setMintPrice] = useState<number>(0);

  const [availableSupply, setAvailableSupply] = useState<number>(0);
  const [errors, setErrors] = useState<string[]>([]);

  const [delegators, setDelegators] = useState<string[]>([]);

  useContractRead({
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "retrieveCollectionInfo",
    watch: true,
    args: [props.collection],
    onSettled(data: any, error: any) {
      if (data) {
        const d = data as any[];
        const i1: Info = {
          name: d[0],
          artist: d[1],
          description: d[2],
          website: d[3],
          licence: d[4],
          base_uri: d[5],
        };
        setInfo(i1);
      }
    },
  });

  useContractRead({
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "retrieveCollectionAdditionalData",
    watch: true,
    args: [props.collection],
    onSettled(data: any, error: any) {
      if (data) {
        const d = data as any[];
        const ad: AdditionalData = {
          artist_address: d[0],
          max_purchases: parseInt(d[1]),
          circulation_supply: parseInt(d[2]),
          total_supply: parseInt(d[3]),
          final_supply_after_mint: parseInt(d[4]),
          randomizer: d[5],
        };
        setAdditionalData(ad);
      }
    },
  });

  const mintWriteConfig = usePrepareContractWrite({
    address: NEXTGEN_MINTER.contract as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
    value: mintCount
      ? BigInt(mintPrice ? mintPrice * mintCount : 0)
      : BigInt(0),
    functionName: "mint",
    args: [
      props.collection,
      mintCount,
      phaseTimes &&
      proofResponse &&
      proofResponse.spots > 0 &&
      isMintingOpen(
        phaseTimes.allowlist_start_time,
        phaseTimes.allowlist_end_time
      )
        ? proofResponse.spots
        : 0,
      proofResponse ? proofResponse.info : "",
      mintToAddress,
      phaseTimes &&
      proofResponse &&
      isMintingOpen(
        phaseTimes.allowlist_start_time,
        phaseTimes.allowlist_end_time
      )
        ? proofResponse.proof
        : [],
      mintingForDelegator ? mintForAddress : NULL_ADDRESS,
    ],
    enabled: isMinting,
    onError(error: any) {
      mintWrite.reset();
      const e = error.message.split("\n");
      const message = [e[0], e[1]].join(" ");
      setErrors([message]);
      setIsMinting(false);
    },
  });
  const mintWrite = useContractWrite(mintWriteConfig.config);

  const waitMintWrite = useWaitForTransaction({
    confirmations: 1,
    hash: mintWrite.data?.hash,
  });

  function validate() {
    let e: string[] = [];
    if (
      phaseTimes &&
      proofResponse &&
      isMintingOpen(
        phaseTimes.allowlist_start_time,
        phaseTimes.allowlist_end_time
      ) &&
      0 >= proofResponse.spots
    ) {
      e.push("Not in Allowlist");
    }
    return e;
  }

  const handleMintClick = () => {
    if (account.isConnected) {
      if (chainId === NEXTGEN_CHAIN_ID) {
        const e = validate();
        if (e.length > 0) {
          setErrors(e);
        } else {
          setIsMinting(true);
        }
      } else {
        web3Modal.open({ route: "SelectNetwork" });
      }
    } else {
      web3Modal.open();
    }
  };

  useEffect(() => {
    if (mintWrite.isError || waitMintWrite.isSuccess) {
      setIsMinting(false);
    }
  }, [mintWrite.isError, waitMintWrite.isSuccess]);

  useEffect(() => {
    if (isMinting) {
      mintWrite.write?.();
    }
  }, [isMinting]);

  useEffect(() => {
    if (additionalData && burnAmount > -1) {
      setAvailableSupply(
        additionalData.total_supply -
          burnAmount -
          additionalData.circulation_supply
      );
    }
  }, [additionalData, burnAmount]);

  useContractReads({
    contracts: [
      {
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI as any,
        chainId: DELEGATION_CONTRACT.chain_id,
        functionName: "retrieveActiveDelegators",
        args: [
          account.address ? account.address : "",
          NULL_ADDRESS,
          nowTime,
          ALL_USE_CASE.use_case,
        ],
      },
      {
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI as any,
        chainId: DELEGATION_CONTRACT.chain_id,
        functionName: "retrieveActiveDelegators",
        args: [
          account.address ? account.address : "",
          NULL_ADDRESS,
          nowTime,
          MINTING_USE_CASE.use_case,
        ],
      },
      {
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI as any,
        chainId: DELEGATION_CONTRACT.chain_id,
        functionName: "retrieveActiveDelegators",
        args: [
          account.address ? account.address : "",
          MEMES_CONTRACT,
          nowTime,
          ALL_USE_CASE.use_case,
        ],
      },
      {
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI as any,
        chainId: DELEGATION_CONTRACT.chain_id,
        functionName: "retrieveActiveDelegators",
        args: [
          account.address ? account.address : "",
          MEMES_CONTRACT,
          nowTime,
          MINTING_USE_CASE.use_case,
        ],
      },
    ],
    watch: true,
    enabled: account.isConnected,
    onSettled(data: any, error: any) {
      if (data) {
        const del: string[] = [];
        const d = data as any[];
        d.map((r) => {
          r.result.map((a: string) => del.push(a));
        });
        setMintForAddress(del[0]);
        setDelegators(del);
      }
    },
  });

  const addressMintCountRead = useContractRead({
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "retrieveTokensPerAddress",
    watch: true,
    enabled: mintingForDelegator
      ? account.isConnected && mintForAddress != ""
      : account.isConnected,
    args: [
      props.collection,
      mintingForDelegator ? mintForAddress : account.address,
    ],
    onSettled(data: any, error: any) {
      if (data) {
        const d = data as any[];
        const air = parseInt(d[0]);
        const allow = parseInt(d[1]);
        const pub = parseInt(d[2]);
        const tpa: TokensPerAddress = {
          airdrop: air,
          allowlist: allow,
          public: pub,
          total: air + allow + pub,
        };
        setAddressMintCounts(tpa);
      }
    },
  });

  useEffect(() => {
    if (phaseTimes && account.address && phaseTimes.allowlist_end_time > 0) {
      const wallet = mintingForDelegator ? mintForAddress : account.address;
      if (wallet) {
        fetchUrl(
          `${process.env.API_ENDPOINT}/api/nextgen/${phaseTimes.merkle_root}/${wallet}`
        ).then((response: ProofResponse) => {
          setProofResponse(response);
        });
      }
    }
  }, [phaseTimes, account.address, mintingForDelegator]);

  const mintToAddressEns = useEnsName({
    address:
      mintToInput && mintToInput.startsWith("0x")
        ? (mintToInput as `0x${string}`)
        : undefined,
    chainId: 1,
  });

  const delegatorsEns = useEnsName({
    address:
      mintToInput && mintToInput.startsWith("0x")
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
    name: mintToInput && mintToInput.endsWith(".eth") ? mintToInput : undefined,
    chainId: 1,
  });

  useEffect(() => {
    if (mintToAddressFromEns.data) {
      setMintToAddress(mintToAddressFromEns.data);
      setMintToInput(`${mintToInput} - ${mintToAddressFromEns.data}`);
    }
  }, [mintToAddressFromEns.data]);

  useEffect(() => {
    setProofResponse(undefined);
    if (account.address) {
      setMintToAddress(account.address);
      setMintToInput(account.address);
    } else {
      setMintToInput("");
      setMintToAddress("");
    }
  }, [account.address]);

  useContractRead({
    address: NEXTGEN_MINTER.contract as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "retrieveCollectionPhases",
    watch: true,
    args: [props.collection],
    onSettled(data: any, error: any) {
      if (data) {
        const d = data as any[];
        const phases: PhaseTimes = {
          allowlist_start_time: parseInt(d[0]) * 1000,
          allowlist_end_time: parseInt(d[1]) * 1000,
          merkle_root: d[2],
          public_start_time: parseInt(d[3]) * 1000,
          public_end_time: parseInt(d[4]) * 1000,
        };
        setPhaseTimes(phases);
      }
    },
  });

  function disableMint() {
    if (!account.isConnected || chainId !== NEXTGEN_CHAIN_ID) {
      return false;
    }
    return (
      !phaseTimes ||
      !additionalData ||
      !phaseTimes ||
      !addressMintCounts ||
      (isMintingOpen(
        phaseTimes.allowlist_start_time,
        phaseTimes.allowlist_end_time
      ) &&
        !proofResponse) ||
      (!isMintingOpen(
        phaseTimes.allowlist_start_time,
        phaseTimes.allowlist_end_time
      ) &&
        !isMintingOpen(
          phaseTimes.public_start_time,
          phaseTimes.public_end_time
        )) ||
      (isMintingOpen(
        phaseTimes.allowlist_start_time,
        phaseTimes.allowlist_end_time
      ) &&
        proofResponse &&
        0 >= proofResponse.spots - addressMintCounts.allowlist) ||
      (isMintingOpen(
        phaseTimes.public_start_time,
        phaseTimes.public_end_time
      ) &&
        0 >= additionalData.max_purchases - addressMintCounts.public) ||
      0 >= availableSupply ||
      isMinting
    );
  }

  useContractRead({
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "burnAmount",
    watch: true,
    args: [props.collection],
    onSettled(data: any, error: any) {
      setBurnAmount(parseInt(data));
    },
  });

  useContractRead({
    address: NEXTGEN_MINTER.contract as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "getPrice",
    watch: true,
    args: [props.collection],
    onSettled(data: any, error: any) {
      if (!isNaN(parseInt(data))) {
        setMintPrice(parseInt(data));
      }
    },
  });

  useEffect(() => {
    setAddressMintCounts({
      airdrop: 0,
      allowlist: 0,
      public: 0,
      total: 0,
    });
    if (!mintingForDelegator) {
      addressMintCountRead.refetch();
    }
  }, [mintingForDelegator]);

  return (
    <Container className="pt-4 pb-5">
      <Row>
        <Col xs={12}>
          <h1 className="mb-0">
            {info
              ? `${info.name.toUpperCase()}`
              : `COLLECTION #${props.collection}`}{" "}
            MINTING PAGE
          </h1>
        </Col>
        {info && <Col xs={12}>by {info.artist.toUpperCase()}</Col>}
      </Row>
      <Row className="pt-4">
        <Col className="d-flex gap-4 flex-wrap">
          {phaseTimes && (
            <span className="d-inline-flex align-items-center gap-2">
              <span
                className={`${styles.trafficLight} ${
                  isMintingOpen(
                    phaseTimes.allowlist_start_time,
                    phaseTimes.allowlist_end_time
                  )
                    ? styles.trafficLightGreen
                    : isMintingUpcoming(phaseTimes.allowlist_start_time)
                    ? styles.trafficLightOrange
                    : styles.trafficLightRed
                }`}></span>
              Allowlist Minting{" "}
              {getMintingTimesDisplay(
                phaseTimes.allowlist_start_time,
                phaseTimes.allowlist_end_time
              )}
            </span>
          )}
          {phaseTimes && (
            <span className="d-inline-flex align-items-center gap-2">
              <span
                className={`${styles.trafficLight} ${
                  isMintingOpen(
                    phaseTimes.public_start_time,
                    phaseTimes.public_end_time
                  )
                    ? styles.trafficLightGreen
                    : isMintingUpcoming(phaseTimes.public_start_time)
                    ? styles.trafficLightOrange
                    : styles.trafficLightRed
                }`}></span>
              Public Minting{" "}
              {getMintingTimesDisplay(
                phaseTimes.public_start_time,
                phaseTimes.public_end_time
              )}
            </span>
          )}
        </Col>
      </Row>
      {additionalData && (
        <Row className="pt-4">
          <Col sm={12} md={6}>
            <Table>
              <tbody>
                <tr>
                  <td>Total Supply</td>
                  <td className="text-right">
                    <b>x{additionalData.total_supply}</b>
                  </td>
                </tr>
                <tr>
                  <td>Minted</td>
                  <td className="text-right">
                    <b>x{additionalData.circulation_supply}</b>
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
                    <b>{availableSupply > 0 ? `x${availableSupply}` : `-`}</b>
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
                      {mintPrice > 0 ? fromGWEI(mintPrice) : `Free`}{" "}
                      {mintPrice > 0 ? `ETH` : ``}
                    </b>
                  </td>
                </tr>
                {phaseTimes && phaseTimes.public_end_time > 0 && (
                  <tr>
                    <td>Max Purchases (Public Phase)</td>
                    <td className="text-right">
                      <b>x{additionalData.max_purchases}</b>
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan={2}>
                    <hr />
                  </td>
                </tr>
                {account.isConnected && addressMintCounts && (
                  <>
                    <tr>
                      <td>
                        {mintingForDelegator ? `Delegator's` : `Your`} Cards
                      </td>
                      <td className="text-right">
                        <b>
                          {addressMintCounts.total > 0
                            ? `x${addressMintCounts.total}`
                            : `-`}
                        </b>
                      </td>
                    </tr>
                    {addressMintCounts.airdrop > 0 && (
                      <tr>
                        <td className="indented">Airdrop</td>
                        <td className="text-right">
                          <b>x{addressMintCounts.airdrop}</b>
                        </td>
                      </tr>
                    )}
                    {addressMintCounts.allowlist > 0 && (
                      <tr>
                        <td className="indented">Allowlist</td>
                        <td className="text-right">
                          <b>x{addressMintCounts.allowlist}</b>
                        </td>
                      </tr>
                    )}
                    {addressMintCounts.public > 0 && (
                      <tr>
                        <td className="indented">Public Phase</td>
                        <td className="text-right">
                          <b>x{addressMintCounts.public}</b>
                        </td>
                      </tr>
                    )}
                  </>
                )}
                {proofResponse && (
                  <tr>
                    <td>
                      {mintingForDelegator ? `Delegator's` : `Your`} Max
                      Allowance
                    </td>
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
                  <Form
                    onChange={() => {
                      setErrors([]);
                      setIsMinting(false);
                    }}>
                    <Form.Group as={Row} className="pb-2">
                      <Form.Label
                        column
                        sm={12}
                        className="d-flex align-items-center">
                        Minting For
                      </Form.Label>
                      <Col
                        sm={12}
                        className="d-flex align-items-center gap-3 flex-wrap">
                        <span className="d-flex align-items-center">
                          <Form.Check
                            checked={!mintingForDelegator}
                            className={styles.mintingForRadio}
                            type="radio"
                            label="Connected Wallet"
                            name="expiryRadio"
                            disabled={!account.isConnected}
                            onChange={() => {
                              setMintingForDelegator(false);
                            }}
                          />
                          <Tippy
                            content={`Mint for your connected wallet ${account.address}`}
                            placement={"top"}
                            theme={"light"}>
                            <FontAwesomeIcon
                              className={styles.infoIcon}
                              icon="info-circle"></FontAwesomeIcon>
                          </Tippy>
                        </span>
                        <span className="d-flex align-items-center">
                          <Form.Check
                            checked={mintingForDelegator}
                            className={styles.mintingForRadio}
                            type="radio"
                            label="Delegator"
                            name="expiryRadio"
                            disabled={delegators.length === 0}
                            onChange={() => {
                              setMintingForDelegator(true);
                            }}
                          />
                          <Tippy
                            content={`Mint for an address that has delegated to you${
                              delegators.length === 0
                                ? ` - you currently have no delegators`
                                : ``
                            }`}
                            placement={"top"}
                            theme={"light"}>
                            <FontAwesomeIcon
                              className={styles.infoIcon}
                              icon="info-circle"></FontAwesomeIcon>
                          </Tippy>
                        </span>
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
                          <Form.Select
                            className={styles.mintSelect}
                            value={mintForAddress}
                            onChange={(e: any) =>
                              setMintForAddress(e.currentTarget.value)
                            }>
                            {delegators.map((delegator) => (
                              <NextGenDelegatorOption
                                address={delegator}
                                key={`delegator-${delegator}`}
                              />
                            ))}
                          </Form.Select>
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
                          className={styles.mintSelect}
                          value={mintCount}
                          disabled={!account.isConnected}
                          onChange={(e: any) =>
                            setMintCount(parseInt(e.currentTarget.value))
                          }>
                          {phaseTimes && addressMintCounts ? (
                            isMintingOpen(
                              phaseTimes.allowlist_start_time,
                              phaseTimes.allowlist_end_time
                            ) &&
                            proofResponse &&
                            proofResponse.spots > 0 ? (
                              createArray(
                                1,
                                proofResponse.spots -
                                  addressMintCounts.allowlist
                              ).map((i) => (
                                <option
                                  selected
                                  key={`allowlist-mint-count-${i}`}
                                  value={i}>
                                  {i > 0 ? i : `n/a`}
                                </option>
                              ))
                            ) : isMintingOpen(
                                phaseTimes.public_start_time,
                                phaseTimes.public_end_time
                              ) ? (
                              createArray(
                                1,
                                additionalData.max_purchases -
                                  addressMintCounts.public
                              ).map((i) => (
                                <option
                                  key={`public-mint-count-${i}`}
                                  value={i}>
                                  {i > 0 ? i : `n/a`}
                                </option>
                              ))
                            ) : (
                              <option value={0}>n/a</option>
                            )
                          ) : (
                            <option value={0}>n/a</option>
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
                          placeholder="0x..."
                          disabled={!account.isConnected}
                          value={mintToInput}
                          onChange={(e) => {
                            setMintToInput(e.target.value);
                            setMintToAddress(e.target.value);
                          }}
                        />
                      </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="pt-4">
                      <Col sm={12}>
                        <Button
                          className={`${styles.mintBtn} btn-block`}
                          disabled={disableMint()}
                          onClick={handleMintClick}>
                          {account.isConnected
                            ? chainId === NEXTGEN_CHAIN_ID
                              ? isMinting
                                ? `Processing...`
                                : `Mint Now`
                              : `Switch to ${getNetworkName(NEXTGEN_CHAIN_ID)}`
                            : `Connect Wallet`}
                          {isMinting && (
                            <div className="d-inline">
                              <div
                                className={`spinner-border ${styles.loader}`}
                                role="status">
                                <span className="sr-only"></span>
                              </div>
                            </div>
                          )}
                        </Button>
                      </Col>
                    </Form.Group>
                    {(errors.length > 0 || mintWrite.isError) && (
                      <Form.Group as={Row} className={`pt-2 pb-2`}>
                        <Form.Label
                          column
                          sm={12}
                          className="d-flex align-items-center">
                          Errors
                        </Form.Label>
                        <Col sm={12} className="d-flex align-items-center">
                          <ul className="mb-0">
                            {mintWrite.error && (
                              <li>
                                {mintWrite.error.name}:{" "}
                                {mintWrite.error.message.split("\n")[0]}
                              </li>
                            )}
                            {errors.map((e, index) => (
                              <li key={`mint-error-${index}`}>{e}</li>
                            ))}
                          </ul>
                        </Col>
                      </Form.Group>
                    )}
                    {mintWrite.isLoading && (
                      <Form.Group as={Row} className={`pt-3`}>
                        <Col sm={12} className="d-flex align-items-center">
                          Confirm in your wallet...
                        </Col>
                      </Form.Group>
                    )}
                    {mintWrite.data && (
                      <Form.Group as={Row} className={`pt-3`}>
                        <Col sm={12} className="d-flex align-items-center">
                          Transaction{" "}
                          {waitMintWrite.isSuccess
                            ? `Successful!`
                            : `Submitted.`}
                          &nbsp;&nbsp;
                          <a
                            href={getTransactionLink(
                              NEXTGEN_CHAIN_ID,
                              mintWrite.data.hash
                            )}
                            target="_blank"
                            rel="noreferrer">
                            view
                          </a>
                        </Col>
                      </Form.Group>
                    )}
                    {waitMintWrite.isLoading && (
                      <Form.Group as={Row} className={`pt-1`}>
                        <Col sm={12} className="d-flex align-items-center">
                          Waiting for confirmation...
                        </Col>
                      </Form.Group>
                    )}
                    {phaseTimes &&
                      proofResponse &&
                      addressMintCounts &&
                      proofResponse.spots > 0 &&
                      0 >=
                        proofResponse.spots - addressMintCounts.allowlist && (
                        <Form.Group as={Row} className={`pt-3`}>
                          <Col sm={12} className="d-flex align-items-center">
                            Max allowlist spots reached (x
                            {addressMintCounts.allowlist})
                          </Col>
                        </Form.Group>
                      )}
                    {phaseTimes &&
                      proofResponse &&
                      addressMintCounts &&
                      0 >=
                        additionalData.max_purchases -
                          addressMintCounts.public && (
                        <Form.Group as={Row} className={`pt-3`}>
                          <Col sm={12} className="d-flex align-items-center">
                            Max public spots reached (x
                            {addressMintCounts.public})
                          </Col>
                        </Form.Group>
                      )}
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
