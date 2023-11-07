import styles from "../../NextGen.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { createArray, getNetworkName } from "../../../../../helpers/Helpers";
import NextGenContractWriteStatus from "../../../NextGenContractWriteStatus";
import {
  NEXTGEN_CHAIN_ID,
  NEXTGEN_CORE,
  NEXTGEN_MINTER,
} from "../../../nextgen_contracts";
import {
  AdditionalData,
  PhaseTimes,
  ProofResponse,
  Status,
  TokensPerAddress,
} from "../../../nextgen_entities";
import {
  useAccount,
  useChainId,
  useContractWrite,
  useEnsAddress,
  useEnsName,
} from "wagmi";
import { useState, useEffect } from "react";
import { NULL_ADDRESS } from "../../../../../constants";
import { fetchUrl } from "../../../../../services/6529api";
import { useWeb3Modal } from "@web3modal/react";
import { NextGenMintDelegatorOption } from "./NextGenMintDelegatorOption";
import { getNftsForContractAndOwner } from "../../../../../services/alchemy-api";

interface Props {
  collection: number;
  phase_times: PhaseTimes;
  additional_data: AdditionalData;
  available_supply: number;
  mint_price: number;
  mint_counts: TokensPerAddress;
  delegators: string[];
  mintingForDelegator: (mintingForDelegator: boolean) => void;
  mintForAddress: (mintForAddress: string) => void;
}

export default function NextGenBurnMintWidget(props: Props) {
  const account = useAccount();
  const chainId = useChainId();
  const web3Modal = useWeb3Modal();

  const [available, setAvailable] = useState<number>(0);

  useEffect(() => {
    const a =
      props.additional_data.total_supply -
      props.additional_data.circulation_supply;
    setAvailable(a);
  }, [props.additional_data]);

  const [proofResponse, setProofResponse] = useState<ProofResponse>();

  const [mintForAddress, setMintForAddress] = useState<string>();
  useEffect(() => {
    if (props.delegators.length > 0) {
      setMintForAddress(props.delegators[0]);
    } else {
      setMintForAddress(undefined);
    }
  }, [props.delegators]);

  const [burnCollection, setBurnCollection] = useState<string>("");
  const [burnCollectionId, setBurnCollectionId] = useState<number>(0);
  const [tokensOwnedForBurnAddressLoaded, setTokensOwnedForBurnAddressLoaded] =
    useState(false);
  const [tokensOwnedForBurnAddress, setTokensOwnedForBurnAddress] = useState<
    any[]
  >([]);
  const [tokenId, setTokenId] = useState<string>("");

  const [mintingForDelegator, setMintingForDelegator] = useState(false);
  const [salt, setSalt] = useState<number>(0);
  const [isMinting, setIsMinting] = useState(false);

  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const burnAddress = mintingForDelegator ? mintForAddress : account.address;
    if (burnAddress) {
      getNftsForContractAndOwner(
        NEXTGEN_CHAIN_ID,
        NEXTGEN_CORE.contract,
        burnAddress
      ).then((r) => {
        setTokensOwnedForBurnAddressLoaded(true);
        setTokensOwnedForBurnAddress(r);
      });
    }
  }, [account.address, mintingForDelegator, mintForAddress]);

  useEffect(() => {
    setTokenId("");
    setTokensOwnedForBurnAddressLoaded(false);
    setTokensOwnedForBurnAddress([]);
  }, [mintingForDelegator, mintForAddress]);

  useEffect(() => {
    props.mintingForDelegator(mintingForDelegator);
  }, [mintingForDelegator]);

  useEffect(() => {
    if (
      props.phase_times &&
      account.address &&
      props.phase_times.allowlist_end_time > 0
    ) {
      // const wallet = mintingForDelegator ? mintForAddress : account.address;
      // if (wallet) {
      //   const url = `${process.env.API_ENDPOINT}/api/nextgen/${props.phase_times.merkle_root}/${wallet}`;
      //   fetchUrl(url).then((response: ProofResponse) => {
      //     setProofResponse(response);
      //   });
      // }
    }
  }, [props.phase_times, account.address, mintingForDelegator]);

  const mintWrite = useContractWrite({
    address: NEXTGEN_MINTER.contract as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
    value: BigInt(props.mint_price ? props.mint_price : 0),
    functionName: "burnOrSwapExternalToMint",
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

  function disableMint() {
    if (!account.isConnected || chainId !== NEXTGEN_CHAIN_ID) {
      return false;
    }
    return (
      !props.phase_times ||
      !props.additional_data ||
      !props.phase_times ||
      !props.mint_counts ||
      (props.phase_times.al_status == Status.LIVE && !proofResponse) ||
      (props.phase_times.al_status != Status.LIVE &&
        props.phase_times.public_status != Status.LIVE) ||
      (props.phase_times.al_status == Status.LIVE &&
        proofResponse &&
        0 >= proofResponse.spots - props.mint_counts.allowlist) ||
      (props.phase_times.public_status == Status.LIVE &&
        0 >= props.additional_data.max_purchases - props.mint_counts.public) ||
      0 >= props.available_supply ||
      isMinting
    );
  }

  useEffect(() => {
    if (isMinting) {
      mintWrite.write({
        args: [
          burnCollection,
          burnCollectionId,
          tokenId,
          props.collection,
          proofResponse ? proofResponse.info : "",
          props.phase_times &&
          proofResponse &&
          props.phase_times.al_status == Status.LIVE
            ? proofResponse.proof
            : [],
          salt,
        ],
      });
    }
  }, [isMinting]);

  useEffect(() => {
    setProofResponse(undefined);
  }, [account.address]);

  return (
    <Container className="no-padding">
      <Row>
        <Col>
          <span className="d-inline-flex align-items-center">
            <b>
              {props.additional_data.circulation_supply} /{" "}
              {props.additional_data.total_supply} minted
              {available > 0 && ` | ${available} remaining`}
            </b>
          </span>
          <Form
            onChange={() => {
              setErrors([]);
              setIsMinting(false);
            }}>
            <Form.Group as={Row} className="pb-2">
              <Form.Label column sm={12} className="d-flex align-items-center">
                Burn to Mint For
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
                    disabled={props.delegators.length === 0}
                    onChange={() => {
                      setMintingForDelegator(true);
                    }}
                  />
                  <Tippy
                    content={`Mint for an address that has delegated to you${
                      props.delegators.length === 0
                        ? ` - you currently have no props.delegators`
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
                    onChange={(e: any) => {
                      setMintForAddress(e.currentTarget.value);
                    }}>
                    {/* <option value="" selected disabled>
                      Select Delegator
                    </option> */}
                    {props.delegators.map((delegator) => (
                      <NextGenMintDelegatorOption
                        address={delegator}
                        key={`delegator-${delegator}`}
                      />
                    ))}
                  </Form.Select>
                </Col>
              </Form.Group>
            )}
            <Form.Group as={Row} className="pb-2">
              <Form.Label column sm={12} className="d-flex align-items-center">
                Select token from BURN collection
              </Form.Label>
              <Col sm={12}>
                <Form.Select
                  disabled={!tokensOwnedForBurnAddressLoaded}
                  className={styles.mintSelect}
                  value={tokenId}
                  onChange={(e: any) => setTokenId(e.currentTarget.value)}>
                  <option value="" selected disabled>
                    Select Token to burn -{" "}
                    {tokensOwnedForBurnAddressLoaded
                      ? `${tokensOwnedForBurnAddress.length} available`
                      : "fetching..."}
                  </option>
                  {tokensOwnedForBurnAddress.map((token) => (
                    <option value={token.tokenId}>
                      #{token.tokenId}
                      {token.name ? ` - ${token.name}` : ""}
                    </option>
                  ))}
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
              props.mint_counts &&
              proofResponse.spots > 0 &&
              0 >= proofResponse.spots - props.mint_counts.allowlist && (
                <Form.Group as={Row} className={`pt-3`}>
                  <Col sm={12} className="d-flex align-items-center">
                    Max allowlist spots reached (x
                    {props.mint_counts.allowlist})
                  </Col>
                </Form.Group>
              )}
            {props.phase_times &&
              proofResponse &&
              props.mint_counts &&
              0 >=
                props.additional_data.max_purchases -
                  props.mint_counts.public && (
                <Form.Group as={Row} className={`pt-3`}>
                  <Col sm={12} className="d-flex align-items-center">
                    Max public spots reached (x
                    {props.mint_counts.public})
                  </Col>
                </Form.Group>
              )}
          </Form>
        </Col>
      </Row>
    </Container>
  );
}
