import styles from "../../NextGen.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import {
  areEqualAddresses,
  getNetworkName,
} from "../../../../../helpers/Helpers";
import NextGenContractWriteStatus from "../../../NextGenContractWriteStatus";
import {
  NEXTGEN_CHAIN_ID,
  NEXTGEN_CORE,
  NEXTGEN_MINTER,
} from "../../../nextgen_contracts";
import {
  AdditionalData,
  CollectionWithMerkle,
  PhaseTimes,
  ProofResponse,
  ProofResponseBurn,
  Status,
  TokensPerAddress,
} from "../../../nextgen_entities";
import { useAccount, useChainId, useContractWrite } from "wagmi";
import { useState, useEffect } from "react";
import { fetchUrl } from "../../../../../services/6529api";
import { useWeb3Modal } from "@web3modal/react";
import { NextGenMintDelegatorOption } from "./NextGenMintDelegatorOption";
import { getNftsForContractAndOwner } from "../../../../../services/alchemy-api";
import { Spinner } from "../../NextGen";

interface Props {
  collection: CollectionWithMerkle;
  phase_times: PhaseTimes;
  additional_data: AdditionalData;
  available_supply: number;
  mint_price: number;
  mint_counts: TokensPerAddress;
  delegators: string[];
  mintingForDelegator: (mintingForDelegator: boolean) => void;
  mintForAddress: (mintForAddress: string) => void;
}

export default function NextGenMintBurnWidget(props: Readonly<Props>) {
  const account = useAccount();
  const chainId = useChainId();
  const web3Modal = useWeb3Modal();

  const [proofResponse, setProofResponse] = useState<ProofResponseBurn>();

  const [mintForAddress, setMintForAddress] = useState<string>();
  useEffect(() => {
    if (props.delegators.length > 0) {
      setMintForAddress(props.delegators[0]);
    } else {
      setMintForAddress(undefined);
    }
  }, [props.delegators]);

  const [tokensOwnedForBurnAddressLoaded, setTokensOwnedForBurnAddressLoaded] =
    useState(false);
  const [tokensOwnedForBurnAddress, setTokensOwnedForBurnAddress] = useState<
    any[]
  >([]);
  const [tokenId, setTokenId] = useState<string>("");

  const [mintingForDelegator, setMintingForDelegator] = useState(false);
  const salt = 0;
  const [isMinting, setIsMinting] = useState(false);

  const [fetchingProofs, setFetchingProofs] = useState(false);

  const [errors, setErrors] = useState<string[]>([]);

  function filterTokensOwnedForBurnAddress(r: any[]) {
    if (props.collection.max_token_index > 0) {
      r = r.filter((t) => {
        return (
          t.tokenId >= props.collection.min_token_index &&
          t.tokenId <= props.collection.max_token_index
        );
      });
    }
    if (
      areEqualAddresses(props.collection.burn_collection, NEXTGEN_CORE.contract)
    ) {
      r = r.filter((t) =>
        t.tokenId.toString().startsWith(props.collection.burn_collection_id)
      );
    }
    return r;
  }

  useEffect(() => {
    const burnAddress = mintingForDelegator ? mintForAddress : account.address;
    if (burnAddress) {
      getNftsForContractAndOwner(
        NEXTGEN_CHAIN_ID,
        NEXTGEN_CORE.contract,
        burnAddress
      ).then((r) => {
        setTokensOwnedForBurnAddressLoaded(true);
        const filteredTokens = filterTokensOwnedForBurnAddress(r);
        setTokensOwnedForBurnAddress(filteredTokens);
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
    if (mintForAddress) {
      props.mintForAddress(mintForAddress);
    }
  }, [mintForAddress]);

  useEffect(() => {
    mintWrite.reset();
    if (tokenId) {
      setFetchingProofs(true);
      const url = `${process.env.API_ENDPOINT}/api/nextgen/burn_proofs/${props.phase_times.merkle_root}/${tokenId}`;
      fetchUrl(url).then((response: ProofResponse) => {
        setProofResponse(response);
        setFetchingProofs(false);
      });
    }
  }, [tokenId]);

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
    if (!proofResponse?.proof) {
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
    if (!props.collection.status) {
      return true;
    }
    return (
      !props.phase_times ||
      !props.additional_data ||
      !props.mint_counts ||
      (props.phase_times.al_status == Status.LIVE && !proofResponse) ||
      (props.phase_times.al_status != Status.LIVE &&
        props.phase_times.public_status != Status.LIVE) ||
      (props.phase_times.al_status == Status.LIVE &&
        proofResponse &&
        proofResponse.proof.length === 0) ||
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
          props.collection.burn_collection,
          props.collection.burn_collection_id,
          tokenId,
          props.collection.collection_id,
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

  function getButtonText() {
    if (!account.isConnected) {
      return "Connect Wallet";
    }
    if (chainId !== NEXTGEN_CHAIN_ID) {
      return `Switch to ${getNetworkName(NEXTGEN_CHAIN_ID)}`;
    }
    if (isMinting) {
      return "Processing...";
    }
    if (!props.collection.status) {
      return "Burn Not Active";
    }

    let text = "Burn to Mint";
    if (fetchingProofs) {
      text += " - fetching proofs";
    }
    if (
      !fetchingProofs &&
      tokenId &&
      proofResponse &&
      proofResponse.proof.length === 0
    ) {
      text += " - no proofs found";
    }
    return text;
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
            {props.collection.phase && (
              <Row className="pt-1">
                <Col>
                  <h4 className="mb-0">{props.collection.phase}</h4>
                </Col>
              </Row>
            )}
            <Form.Group as={Row} className="pt-1 pb-1">
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
                    onChange={(e: any) => {
                      setMintForAddress(e.currentTarget.value);
                    }}>
                    <option value="" disabled>
                      Select Delegator
                    </option>
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
            <Form.Group as={Row} className="pt-1 pb-1">
              <Form.Label column sm={12} className="d-flex align-items-center">
                Mint To
                <Tippy
                  content={`In burns to mint, the token is minted to the address that burns the token.`}
                  placement={"top"}
                  theme={"light"}>
                  <FontAwesomeIcon
                    className={styles.infoIcon}
                    icon="info-circle"></FontAwesomeIcon>
                </Tippy>
              </Form.Label>
              <Col sm={12}>
                {mintingForDelegator ? mintForAddress : account.address}
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="pt-1 pb-1">
              <Form.Label column sm={12} className="d-flex flex-column">
                <span>Select token from Burn collection</span>
                <span>
                  {props.collection.burn_collection}
                  {!!props.collection.burn_collection_id && (
                    <> | Collection {props.collection.burn_collection_id}</>
                  )}
                  {props.collection.max_token_index > 0 && (
                    <>
                      {" "}
                      | #{props.collection.min_token_index} - #
                      {props.collection.max_token_index}
                    </>
                  )}
                </span>
              </Form.Label>
              <Col sm={12}>
                <Form.Select
                  disabled={!tokensOwnedForBurnAddressLoaded}
                  className={styles.mintSelect}
                  value={tokenId}
                  onChange={(e: any) => setTokenId(e.currentTarget.value)}>
                  <option value="" disabled>
                    Select Token to burn -{" "}
                    {tokensOwnedForBurnAddressLoaded
                      ? `${tokensOwnedForBurnAddress.length} available`
                      : "fetching..."}
                  </option>
                  {tokensOwnedForBurnAddress.map((token) => (
                    <option
                      value={token.tokenId}
                      key={`token-${token.tokenId}`}>
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
                  {getButtonText()}
                  {isMinting && <Spinner />}
                </Button>
              </Col>
            </Form.Group>
            {errors.length > 0 && (
              <Form.Group as={Row} className={`pt-1 pb-1`}>
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
