import {
  useContractWrite,
  useContractRead,
  useAccount,
  useChainId,
  useContractReads,
  useEnsAddress,
  useEnsName,
} from "wagmi";
import { DELEGATION_ABI } from "../../../../abis";
import {
  DELEGATION_CONTRACT,
  MEMES_CONTRACT,
  NULL_ADDRESS,
} from "../../../../constants";
import styles from "../NextGen.module.scss";
import { Button, Col, Container, Form, Row, Table } from "react-bootstrap";
import { useEffect, useState } from "react";
import {
  AdditionalData,
  PhaseTimes,
  ProofResponse,
  TokensPerAddress,
  MintingDetails,
  Status,
  TokenURI,
} from "../../nextgen_entities";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import {
  createArray,
  fromGWEI,
  getNetworkName,
} from "../../../../helpers/Helpers";
import { useWeb3Modal } from "@web3modal/react";
import {
  ALL_USE_CASE,
  MINTING_USE_CASE,
} from "../../../../pages/delegation/[...section]";
import {
  NEXTGEN_CHAIN_ID,
  NEXTGEN_CORE,
  NEXTGEN_MINTER,
} from "../../nextgen_contracts";
import DateCountdown from "../../../date-countdown/DateCountdown";
import { fetchUrl } from "../../../../services/6529api";
import NextGenContractWriteStatus from "../../NextGenContractWriteStatus";
import { NextGenTokenImageContent } from "../NextGenTokenImage";
import { retrieveCollectionCosts } from "../../nextgen_helpers";

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
  collection_preview?: TokenURI;
  phase_times: PhaseTimes;
  mint_price: number;
  additional_data: AdditionalData;
  burn_amount: number;
}

export default function NextGenCollectionMint(props: Props) {
  const account = useAccount();
  const chainId = useChainId();
  const web3Modal = useWeb3Modal();

  const nowTime = Math.round(new Date().getTime() / 1000);

  const [addressMintCounts, setAddressMintCounts] = useState<TokensPerAddress>({
    airdrop: 0,
    allowlist: 0,
    public: 0,
    total: 0,
  });
  const [proofResponse, setProofResponse] = useState<ProofResponse>();

  const [mintToInput, setMintToInput] = useState("");
  const [mintToAddress, setMintToAddress] = useState("");

  const [mintingForDelegator, setMintingForDelegator] = useState(false);
  const [mintForAddress, setMintForAddress] = useState<string>("");
  const [mintCount, setMintCount] = useState<number>(1);

  const [salt, setSalt] = useState<number>(0);

  const [isMinting, setIsMinting] = useState(false);

  const [availableSupply, setAvailableSupply] = useState<number>(0);
  const [errors, setErrors] = useState<string[]>([]);

  const [delegators, setDelegators] = useState<string[]>([]);
  const [mintingDetails, setMintingDetails] = useState<MintingDetails>();

  const mintWrite = useContractWrite({
    address: NEXTGEN_MINTER.contract as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
    value: mintCount
      ? BigInt(props.mint_price ? props.mint_price * mintCount : 0)
      : BigInt(0),
    functionName: "mint",
    onError() {
      setIsMinting(false);
    },
  });

  useEffect(() => {
    setIsMinting(false);
  }, [mintWrite.isSuccess || mintWrite.isError]);

  function validate() {
    let e: string[] = [];
    if (
      props.phase_times &&
      proofResponse &&
      props.phase_times.al_status == Status.LIVE &&
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
    if (isMinting) {
      mintWrite.write({
        args: [
          props.collection,
          mintCount,
          props.phase_times &&
          proofResponse &&
          proofResponse.spots > 0 &&
          props.phase_times.al_status == Status.LIVE
            ? proofResponse.spots
            : 0,
          proofResponse ? proofResponse.info : "",
          mintToAddress,
          props.phase_times &&
          proofResponse &&
          props.phase_times.al_status == Status.LIVE
            ? proofResponse.proof
            : [],
          mintingForDelegator ? mintForAddress : NULL_ADDRESS,
          salt,
        ],
      });
    }
  }, [isMinting]);

  useEffect(() => {
    if (props.additional_data && props.burn_amount > -1) {
      setAvailableSupply(
        props.additional_data.total_supply -
          props.burn_amount -
          props.additional_data.circulation_supply
      );
    }
  }, [props.additional_data, props.burn_amount]);

  useContractReads({
    contracts: [
      {
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI as any,
        chainId: DELEGATION_CONTRACT.chain_id,
        functionName: "retrieveDelegators",
        args: [
          account.address ? account.address : "",
          NULL_ADDRESS,
          ALL_USE_CASE.use_case,
        ],
      },
      {
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI as any,
        chainId: DELEGATION_CONTRACT.chain_id,
        functionName: "retrieveDelegators",
        args: [
          account.address ? account.address : "",
          NULL_ADDRESS,
          MINTING_USE_CASE.use_case,
        ],
      },
      {
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI as any,
        chainId: DELEGATION_CONTRACT.chain_id,
        functionName: "retrieveDelegators",
        args: [
          account.address ? account.address : "",
          mintingDetails ? mintingDetails.del_address : "",
          ALL_USE_CASE.use_case,
        ],
      },
      {
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI as any,
        chainId: DELEGATION_CONTRACT.chain_id,
        functionName: "retrieveDelegators",
        args: [
          account.address ? account.address : "",
          mintingDetails ? mintingDetails.del_address : "",
          MINTING_USE_CASE.use_case,
        ],
      },
    ],
    watch: true,
    enabled: account.isConnected && mintingDetails != undefined,
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

  retrieveCollectionCosts(props.collection, (data: MintingDetails) => {
    setMintingDetails(data);
  });

  function retrievePerAddressParams() {
    return {
      address: NEXTGEN_CORE.contract as `0x${string}`,
      abi: NEXTGEN_CORE.abi,
      chainId: NEXTGEN_CHAIN_ID,
      watch: true,
      enabled: mintingForDelegator
        ? account.isConnected && mintForAddress != ""
        : account.isConnected,
      args: [
        props.collection,
        mintingForDelegator ? mintForAddress : account.address,
      ],
    };
  }

  const addressMintCountAirdropRead = useContractRead({
    functionName: "retrieveTokensAirdroppedPerAddress",
    ...retrievePerAddressParams(),
    onSettled(data: any, error: any) {
      if (data) {
        const air = parseInt(data);
        setAddressMintCounts((amc) => {
          amc.airdrop = air;
          amc.total = amc.airdrop + amc.allowlist + amc.public;
          return amc;
        });
      }
    },
  });

  const addressMintCountMintedALRead = useContractRead({
    functionName: "retrieveTokensMintedALPerAddress",
    ...retrievePerAddressParams(),
    onSettled(data: any, error: any) {
      if (data) {
        const allow = parseInt(data);
        setAddressMintCounts((amc) => {
          amc.allowlist = allow;
          amc.total = amc.airdrop + amc.allowlist + amc.public;
          return amc;
        });
      }
    },
  });

  const addressMintCountMintedPublicRead = useContractRead({
    functionName: "retrieveTokensMintedPublicPerAddress",
    ...retrievePerAddressParams(),
    onSettled(data: any, error: any) {
      if (data) {
        const pub = parseInt(data);
        setAddressMintCounts((amc) => {
          amc.public = pub;
          amc.total = amc.airdrop + amc.allowlist + amc.public;
          return amc;
        });
      }
    },
  });

  useEffect(() => {
    if (
      props.phase_times &&
      account.address &&
      props.phase_times.allowlist_end_time > 0
    ) {
      const wallet = mintingForDelegator ? mintForAddress : account.address;
      if (wallet) {
        const url = `${process.env.API_ENDPOINT}/api/nextgen/${props.phase_times.merkle_root}/${wallet}`;
        fetchUrl(url).then((response: ProofResponse) => {
          setProofResponse(response);
        });
      }
    }
  }, [props.phase_times, account.address, mintingForDelegator]);

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

  function disableMint() {
    if (!account.isConnected || chainId !== NEXTGEN_CHAIN_ID) {
      return false;
    }
    return (
      !props.phase_times ||
      !props.additional_data ||
      !props.phase_times ||
      !addressMintCounts ||
      (props.phase_times.al_status == Status.LIVE && !proofResponse) ||
      (props.phase_times.al_status != Status.LIVE &&
        props.phase_times.public_status != Status.LIVE) ||
      (props.phase_times.al_status == Status.LIVE &&
        proofResponse &&
        0 >= proofResponse.spots - addressMintCounts.allowlist) ||
      (props.phase_times.public_status == Status.LIVE &&
        0 >= props.additional_data.max_purchases - addressMintCounts.public) ||
      0 >= availableSupply ||
      isMinting
    );
  }

  function getSalesModel() {
    if (!mintingDetails) {
      return "-";
    }

    switch (mintingDetails.sales_option) {
      case 1:
        return "Fixed Price";
      case 2:
        return "Exponential/Linear decrease";
      case 3:
        return "Periodic Sale";
      default:
        return `${mintingDetails.sales_option}`;
    }
  }

  useEffect(() => {
    setAddressMintCounts({
      airdrop: 0,
      allowlist: 0,
      public: 0,
      total: 0,
    });
    if (!mintingForDelegator) {
      addressMintCountAirdropRead.refetch();
      addressMintCountMintedALRead.refetch();
      addressMintCountMintedPublicRead.refetch();
    }
  }, [mintingForDelegator]);

  function printMintWidget() {
    return (
      <Container className="no-padding">
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
              <Form.Group as={Row} className="pt-2">
                <Form.Label
                  column
                  sm={12}
                  className="d-flex align-items-center">
                  Wallet Mints:&nbsp;
                  <b>
                    {proofResponse && proofResponse.spots > 0
                      ? props.phase_times.al_status == Status.LIVE &&
                        (proofResponse
                          ? `${addressMintCounts.allowlist} / ${
                              proofResponse.spots
                            }${
                              proofResponse.spots > addressMintCounts.allowlist
                                ? ` (${
                                    proofResponse.spots -
                                    addressMintCounts.allowlist
                                  } remaining)`
                                : ""
                            }`
                          : `-`)
                      : `You don't have any spots in the allowlist`}
                    {props.phase_times.public_status == Status.LIVE &&
                      (proofResponse
                        ? `${addressMintCounts.public} / ${
                            props.additional_data.max_purchases
                          }${
                            props.additional_data.max_purchases >
                            addressMintCounts.public
                              ? ` (${
                                  props.additional_data.max_purchases -
                                  addressMintCounts.public
                                } remaining)`
                              : ""
                          }`
                        : `-`)}
                    {props.phase_times.public_status == Status.LIVE &&
                      `${
                        props.additional_data.max_purchases -
                        addressMintCounts.public
                      }`}
                  </b>
                </Form.Label>
              </Form.Group>
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
                    disabled={
                      !account.isConnected ||
                      (proofResponse && proofResponse.spots <= 0)
                    }
                    onChange={(e: any) =>
                      setMintCount(parseInt(e.currentTarget.value))
                    }>
                    {props.phase_times && addressMintCounts ? (
                      props.phase_times.al_status == Status.LIVE &&
                      proofResponse &&
                      proofResponse.spots > 0 ? (
                        createArray(
                          1,
                          proofResponse.spots - addressMintCounts.allowlist
                        ).map((i) => (
                          <option
                            selected
                            key={`allowlist-mint-count-${i}`}
                            value={i}>
                            {i > 0 ? i : `n/a`}
                          </option>
                        ))
                      ) : props.phase_times.public_status == Status.LIVE ? (
                        createArray(
                          1,
                          props.additional_data.max_purchases -
                            addressMintCounts.public
                        ).map((i) => (
                          <option key={`public-mint-count-${i}`} value={i}>
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
              <Form.Group as={Row} className="pt-4 mb-3">
                <Col sm={12}>
                  <Button
                    className={styles.mintBtn}
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
              {errors.length > 0 && (
                <Form.Group as={Row} className={`pt-2 pb-2`}>
                  <Form.Label
                    column
                    sm={12}
                    className="d-flex align-items-center">
                    Errors
                  </Form.Label>
                  <Col sm={12} className="d-flex align-items-center">
                    <ul className="mb-0">
                      {errors.map((e, index) => (
                        <li key={`mint-error-${index}`}>{e}</li>
                      ))}
                    </ul>
                  </Col>
                </Form.Group>
              )}
              <NextGenContractWriteStatus
                isLoading={mintWrite.isLoading}
                hash={mintWrite.data?.hash}
                error={mintWrite.error}
              />
              {props.phase_times &&
                proofResponse &&
                addressMintCounts &&
                proofResponse.spots > 0 &&
                0 >= proofResponse.spots - addressMintCounts.allowlist && (
                  <Form.Group as={Row} className={`pt-3`}>
                    <Col sm={12} className="d-flex align-items-center">
                      Max allowlist spots reached (x
                      {addressMintCounts.allowlist})
                    </Col>
                  </Form.Group>
                )}
              {props.phase_times &&
                proofResponse &&
                addressMintCounts &&
                0 >=
                  props.additional_data.max_purchases -
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
    );
  }

  return (
    <Container className="no-padding pb-4">
      <Row className="pb-2">
        <Col>
          <div
            className={`pt-2 pb-2 d-flex flex-wrap align-items-center gap-2 justify-content-center ${styles.mintDetails}`}>
            <span className={`d-flex flex-column ${styles.mintDetailsSpan}`}>
              <span>Mint Cost</span>
              <span className="font-larger font-bolder">
                {props.mint_price > 0 ? fromGWEI(props.mint_price) : `Free`}{" "}
                {props.mint_price > 0 ? `ETH` : ``}
              </span>
            </span>
            <span className={`d-flex flex-column ${styles.mintDetailsSpan}`}>
              <span>Sales Model</span>
              <span className="font-larger font-bolder">{getSalesModel()}</span>
            </span>
            {props.phase_times.al_status == Status.UPCOMING && (
              <span className={styles.mintDetailsSpan}>
                <DateCountdown
                  title={"Allowlist Starting in"}
                  date={props.phase_times.allowlist_start_time}
                />
              </span>
            )}
            {props.phase_times.al_status == Status.LIVE && (
              <span className={styles.mintDetailsSpan}>
                <DateCountdown
                  title={"Allowlist Ending in"}
                  date={props.phase_times.allowlist_end_time}
                />
              </span>
            )}
            {props.phase_times.al_status != Status.LIVE &&
              props.phase_times.al_status != Status.UPCOMING &&
              props.phase_times.public_status == Status.UPCOMING && (
                <span className={styles.mintDetailsSpan}>
                  <DateCountdown
                    title={"Public Phase Starting in"}
                    date={props.phase_times.public_start_time}
                  />
                </span>
              )}
            {props.phase_times.public_status == Status.LIVE && (
              <span className={styles.mintDetailsSpan}>
                <DateCountdown
                  title={"Public Phase Ending in"}
                  date={props.phase_times.public_end_time}
                />
              </span>
            )}
          </div>
        </Col>
      </Row>
      <Row className="pt-4">
        <Col sm={12} md={5}>
          <Container className="no-padding">
            <Row className="pb-4">
              <Col className={styles.tokenFrameContainerHalf}>
                {props.collection_preview && (
                  <NextGenTokenImageContent
                    preview={true}
                    token={props.collection_preview}
                  />
                )}
              </Col>
            </Row>
          </Container>
        </Col>
        <Col sm={12} md={7}>
          <Container>
            <Row>
              <Col>{printMintWidget()}</Col>
            </Row>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
