import styles from "../../NextGen.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import {
  createArray,
  getNetworkName,
  isValidEthAddress,
} from "../../../../../helpers/Helpers";
import NextGenContractWriteStatus from "../../../NextGenContractWriteStatus";
import { NEXTGEN_CHAIN_ID, NEXTGEN_MINTER } from "../../../nextgen_contracts";
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
import { useEffect } from "react";
import { NULL_ADDRESS } from "../../../../../constants";
import { fetchUrl } from "../../../../../services/6529api";
import { useWeb3Modal } from "@web3modal/react";
import { Spinner } from "../../NextGen";
import { useMintSharedState } from "../../../nextgen_helpers";
import {
  NextGenAdminMintForModeFormGroup,
  NextGenAdminMintingForDelegator,
} from "./NextGenMintShared";

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

function getMintValue(mintCount: number, mintPrice: number) {
  if (!mintCount || !mintPrice) {
    return BigInt(0);
  }
  return BigInt(mintPrice * mintCount);
}

export default function NextGenMintWidget(props: Readonly<Props>) {
  const account = useAccount();
  const chainId = useChainId();
  const web3Modal = useWeb3Modal();

  const {
    available,
    setAvailable,
    proofResponse,
    setProofResponse,
    mintForAddress,
    setMintForAddress,
    mintingForDelegator,
    setMintingForDelegator,
    salt,
    mintCount,
    setMintCount,
    mintToInput,
    setMintToInput,
    mintToAddress,
    setMintToAddress,
    isMinting,
    setIsMinting,
    errors,
    setErrors,
  } = useMintSharedState();

  useEffect(() => {
    const a =
      props.additional_data.total_supply -
      props.additional_data.circulation_supply;
    setAvailable(a);
  }, [props.additional_data]);

  useEffect(() => {
    if (props.delegators.length > 0) {
      setMintForAddress(props.delegators[0]);
    } else {
      setMintForAddress(undefined);
    }
  }, [props.delegators]);

  useEffect(() => {
    props.mintingForDelegator(mintingForDelegator);
  }, [mintingForDelegator]);

  useEffect(() => {
    if (
      props.phase_times &&
      account.address &&
      props.phase_times.allowlist_end_time > 0
    ) {
      const wallet = mintingForDelegator ? mintForAddress : account.address;
      if (wallet) {
        const url = `${process.env.API_ENDPOINT}/api/nextgen/proofs/${props.phase_times.merkle_root}/${wallet}`;
        fetchUrl(url).then((response: ProofResponse) => {
          setProofResponse(response);
        });
      }
    }
  }, [props.phase_times, account.address, mintingForDelegator]);

  const mintWrite = useContractWrite({
    address: NEXTGEN_MINTER.contract as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
    value: getMintValue(mintCount, props.mint_price),
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

  function disableMint() {
    if (!account.isConnected || chainId !== NEXTGEN_CHAIN_ID) {
      return false;
    }
    if (available <= 0) {
      return true;
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
    setProofResponse(undefined);
    if (account.address) {
      setMintToAddress(account.address);
      setMintToInput(account.address);
    } else {
      setMintToInput("");
      setMintToAddress("");
    }
  }, [account.address]);

  const mintToAddressEns = useEnsName({
    address:
      mintToInput && isValidEthAddress(mintToInput)
        ? (mintToInput as `0x${string}`)
        : undefined,
    chainId: 1,
  });

  useEnsName({
    address:
      mintToInput && isValidEthAddress(mintToInput)
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
    name: mintToInput?.endsWith(".eth") ? mintToInput : undefined,
    chainId: 1,
  });

  useEffect(() => {
    if (mintToAddressFromEns.data) {
      setMintToAddress(mintToAddressFromEns.data);
      setMintToInput(`${mintToInput} - ${mintToAddressFromEns.data}`);
    }
  }, [mintToAddressFromEns.data]);

  function renderAllowlistStatus() {
    if (proofResponse && props.phase_times.al_status === Status.LIVE) {
      if (proofResponse.spots > 0) {
        const spotsRemaining =
          proofResponse.spots > props.mint_counts.allowlist
            ? ` (${
                proofResponse.spots - props.mint_counts.allowlist
              } remaining)`
            : "";
        return `${props.mint_counts.allowlist} / ${proofResponse.spots}${spotsRemaining}`;
      } else {
        return "You don't have any spots in the allowlist";
      }
    }
    return null;
  }

  function renderPublicStatus() {
    if (props.phase_times.public_status == Status.LIVE) {
      const publicRemaining =
        props.additional_data.max_purchases > props.mint_counts.public
          ? ` (${
              props.additional_data.max_purchases - props.mint_counts.public
            } remaining)`
          : "";
      return `${props.mint_counts.public} / ${props.additional_data.max_purchases}${publicRemaining}`;
    }
    return null;
  }

  function renderAllowlistOptions() {
    if (
      props.phase_times.al_status == Status.LIVE &&
      proofResponse &&
      proofResponse.spots > 0
    ) {
      return createArray(
        1,
        proofResponse.spots - props.mint_counts.allowlist
      ).map((i) => (
        <option selected key={`allowlist-mint-count-${i}`} value={i}>
          {i > 0 ? i : `n/a`}
        </option>
      ));
    }
    return null;
  }

  function renderPublicOptions() {
    if (props.phase_times.public_status == Status.LIVE) {
      return createArray(
        1,
        props.additional_data.max_purchases - props.mint_counts.public
      ).map((i) => (
        <option key={`public-mint-count-${i}`} value={i}>
          {i > 0 ? i : `n/a`}
        </option>
      ));
    }
    return <option value={0}>n/a</option>;
  }

  function renderButtonText() {
    if (!account.isConnected) {
      return "Connect Wallet";
    }
    if (chainId !== NEXTGEN_CHAIN_ID) {
      return `Switch to ${getNetworkName(NEXTGEN_CHAIN_ID)}`;
    }
    if (isMinting) {
      return "Processing...";
    }
    return "Mint";
  }

  return (
    <Container className="no-padding">
      <Row>
        <Col>
          <Form
            onChange={() => {
              setErrors([]);
              setIsMinting(false);
            }}>
            <NextGenAdminMintForModeFormGroup
              title="Mint For"
              connectedAddress={account.address}
              delegators={props.delegators.length}
              mintingForDelegator={mintingForDelegator}
              setMintingForDelegator={setMintingForDelegator}
            />
            {mintingForDelegator && (
              <NextGenAdminMintingForDelegator
                delegators={props.delegators}
                mintForAddress={mintForAddress}
                setMintForAddress={setMintForAddress}
              />
            )}
            <Form.Group as={Row} className="pb-2">
              <Form.Label column sm={12} className="d-flex align-items-center">
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
              <Form.Label column sm={12} className="d-flex align-items-center">
                Wallet Mints:{" "}
                <b>
                  {renderAllowlistStatus()}
                  {renderPublicStatus()}
                </b>
              </Form.Label>
            </Form.Group>
            <Form.Group as={Row} className="pb-2">
              <Form.Label column sm={12} className="d-flex align-items-center">
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
                  {props.phase_times && props.mint_counts ? (
                    renderAllowlistOptions() ?? renderPublicOptions()
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
                  {renderButtonText()}
                  {isMinting && <Spinner />}
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
                    {errors.map((e) => (
                      <li key={`mint-error-${e.replaceAll(" ", "-")}`}>{e}</li>
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
