import {
  usePrepareContractWrite,
  useContractWrite,
  useContractRead,
  useAccount,
  useChainId,
  useContractReads,
} from "wagmi";
import { DELEGATION_ABI, NEXT_GEN_ABI } from "../../abis";
import {
  DELEGATION_CONTRACT,
  MEMES_CONTRACT,
  NEXT_GEN_CONTRACT,
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
import { fromGWEI, getNetworkName } from "../../helpers/Helpers";
import { useWeb3Modal } from "@web3modal/react";
import {
  ALL_USE_CASE,
  MINTING_USE_CASE,
} from "../../pages/delegation/[...section]";

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

  const [mintToAddress, setMintToAddress] = useState<string>("");
  const [mintingForDelegator, setMintingForDelegator] = useState(false);
  const [mintForAddress, setMintForAddress] = useState<string>("");
  const [mintCount, setMintCount] = useState<number>(1);

  const [isMinting, setIsMinting] = useState(false);
  const [burnAmount, setBurnAmount] = useState<number>(-1);

  const [availableSupply, setAvailableSupply] = useState<number>(0);
  const [errors, setErrors] = useState<string[]>([]);

  const [delegators, setDelegators] = useState<string[]>([]);

  useContractRead({
    address: NEXT_GEN_CONTRACT.contract,
    abi: NEXT_GEN_ABI,
    chainId: NEXT_GEN_CONTRACT.chain_id,
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
    address: NEXT_GEN_CONTRACT.contract,
    abi: NEXT_GEN_ABI,
    chainId: NEXT_GEN_CONTRACT.chain_id,
    functionName: "retrieveCollectionAdditionalData",
    watch: true,
    args: [props.collection],
    onSettled(data: any, error: any) {
      if (data) {
        const d = data as any[];
        const ad: AdditionalData = {
          artist_address: d[0],
          mint_cost: Math.round(parseInt(d[1]) * 100000) / 100000,
          max_purchases: parseInt(d[2]),
          circulation_supply: parseInt(d[3]),
          total_supply: parseInt(d[4]),
          sales_percentage: parseInt(d[5]),
          is_collection_active: d[6] as boolean,
        };
        setAdditionalData(ad);
      }
    },
  });

  const mintWriteConfig = usePrepareContractWrite({
    address: NEXT_GEN_CONTRACT.contract,
    abi: NEXT_GEN_ABI,
    chainId: NEXT_GEN_CONTRACT.chain_id,
    value: BigInt(additionalData ? additionalData.mint_cost * mintCount : 0),
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
      0, //tdh
      phaseTimes ? phaseTimes.ids : [],
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
      setErrors(["Something went wrong during contract call"]);
    },
  });
  const mintWrite = useContractWrite(mintWriteConfig.config);

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
    setErrors([]);
    if (account.isConnected) {
      if (chainId == NEXT_GEN_CONTRACT.chain_id) {
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
          del.concat(r);
        });
        del.push("0x3558C942EeA9e9Bb9b1a6A02d272756EDD3A1Fe4");
        del.push("0x7f3774EAdae4beB01919deC7f32A72e417Ab5DE3");
        del.push("0xc03e57b6ace9dd62c84a095e11e494e3c8fd4d42");
        setMintForAddress(del[0]);
        setDelegators(del);
      }
    },
  });

  const addressMintCountRead = useContractRead({
    address: NEXT_GEN_CONTRACT.contract,
    abi: NEXT_GEN_ABI,
    chainId: NEXT_GEN_CONTRACT.chain_id,
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
          `${process.env.API_ENDPOINT}/api/gen_memes/${phaseTimes.merkle_root}/${wallet}`
        ).then((response: ProofResponse) => {
          setProofResponse(response);
        });
      }
    }
  }, [phaseTimes, account.address, mintingForDelegator]);

  useEffect(() => {
    setMintToAddress("");
    setProofResponse(undefined);
    if (account.address) {
      setMintToAddress(account.address);
    }
  }, [account.address]);

  useContractRead({
    address: NEXT_GEN_CONTRACT.contract,
    abi: NEXT_GEN_ABI,
    chainId: NEXT_GEN_CONTRACT.chain_id,
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
          ids: d[5],
        };
        setPhaseTimes(phases);
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
      setBurnAmount(parseInt(data));
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
    <Container className="no-padding pt-4 pb-5">
      <Row>
        <Col xs={12}>
          <h1>
            {info
              ? `${info.name.toUpperCase()}`
              : `COLLECTION #${props.collection}`}{" "}
            MINTING PAGE
          </h1>
        </Col>
        {info && (
          <Col xs={12} className="lead">
            by {info.artist.toUpperCase()}
          </Col>
        )}
      </Row>
      <Row className="pt-4">
        <Col sm={12} md={10} className="d-flex gap-4">
          <span className="d-inline-flex align-items-center gap-2">
            <span
              className={`traffic-light ${
                additionalData
                  ? additionalData.is_collection_active
                    ? `green`
                    : `red`
                  : ``
              }`}></span>
            Active
          </span>
          {phaseTimes && phaseTimes.allowlist_end_time > 0 && (
            <span className="d-inline-flex align-items-center gap-2">
              <span
                className={`traffic-light ${
                  isMintingOpen(
                    phaseTimes.allowlist_start_time,
                    phaseTimes.allowlist_end_time
                  )
                    ? `green`
                    : isMintingUpcoming(phaseTimes.allowlist_start_time)
                    ? `orange`
                    : `red`
                }`}></span>
              Allowlist Minting{" "}
              {getMintingTimesDisplay(
                phaseTimes.allowlist_start_time,
                phaseTimes.allowlist_end_time
              )}
            </span>
          )}
          {phaseTimes && phaseTimes.public_end_time > 0 && (
            <span className="d-inline-flex align-items-center gap-2">
              <span
                className={`traffic-light ${
                  isMintingOpen(
                    phaseTimes.public_start_time,
                    phaseTimes.public_end_time
                  )
                    ? `green`
                    : isMintingUpcoming(phaseTimes.public_start_time)
                    ? `orange`
                    : `red`
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
        <Row className="pt-5">
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
                      {additionalData.mint_cost > 0
                        ? fromGWEI(additionalData.mint_cost)
                        : `Free`}{" "}
                      {additionalData.mint_cost > 0 ? `ETH` : ``}
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
                      <Col sm={12} className="d-flex align-items-center gap-3">
                        Minting For{" "}
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
                                ? ` - you have no delegators currently`
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
                              <option
                                value={delegator}
                                key={`delegator-${delegator}`}>
                                {delegator}
                              </option>
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
                          {phaseTimes ? (
                            isMintingOpen(
                              phaseTimes.allowlist_start_time,
                              phaseTimes.allowlist_end_time
                            ) &&
                            addressMintCounts &&
                            proofResponse &&
                            proofResponse.spots > 0 ? (
                              Array.from(
                                {
                                  length:
                                    proofResponse.spots -
                                    addressMintCounts.allowlist,
                                },
                                (_, index) =>
                                  addressMintCounts.allowlist + index
                              ).map((i) => (
                                <option
                                  key={`allowlist-mint-count-${i}`}
                                  value={i + 1}>
                                  {i + 1}
                                </option>
                              ))
                            ) : isMintingOpen(
                                phaseTimes.public_start_time,
                                phaseTimes.public_end_time
                              ) && addressMintCounts ? (
                              Array.from(
                                {
                                  length:
                                    additionalData.max_purchases -
                                    addressMintCounts.public,
                                },
                                (_, index) => addressMintCounts.public + index
                              ).map((i) => (
                                <option
                                  key={`public-mint-count-${i}`}
                                  value={i + 1}>
                                  {i + 1}
                                </option>
                              ))
                            ) : (
                              <option value={0}>0</option>
                            )
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
                          disabled={
                            !phaseTimes ||
                            !additionalData.is_collection_active ||
                            (!isMintingOpen(
                              phaseTimes.allowlist_start_time,
                              phaseTimes.allowlist_end_time
                            ) &&
                              !isMintingOpen(
                                phaseTimes.public_start_time,
                                phaseTimes.public_end_time
                              )) ||
                            0 >= availableSupply
                          }
                          onClick={handleMintClick}>
                          {account.isConnected
                            ? chainId == NEXT_GEN_CONTRACT.chain_id
                              ? `Mint Now`
                              : `Switch to ${getNetworkName(
                                  NEXT_GEN_CONTRACT.chain_id
                                )}`
                            : `Connect Wallet`}
                        </Button>
                      </Col>
                    </Form.Group>
                    {(errors.length > 0 || mintWrite.isError) && (
                      <Form.Group
                        as={Row}
                        className={`pt-2 pb-2 ${styles.newDelegationError}`}>
                        <Form.Label
                          column
                          sm={12}
                          className="d-flex align-items-center">
                          Errors
                        </Form.Label>
                        <Col sm={12} className="d-flex align-items-center">
                          <ul className="mb-0">
                            {mintWrite.error && (
                              <li>{mintWrite.error.message}</li>
                            )}
                            {errors.map((e, index) => (
                              <li key={`new-delegation-error-${index}`}>{e}</li>
                            ))}
                          </ul>
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
