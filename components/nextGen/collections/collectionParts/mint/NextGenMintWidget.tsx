import styles from "../../NextGen.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import {
  areEqualAddresses,
  capitalizeFirstChar,
  createArray,
  getNetworkName,
  isValidEthAddress,
} from "../../../../../helpers/Helpers";
import NextGenContractWriteStatus from "../../../NextGenContractWriteStatus";
import { NEXTGEN_CHAIN_ID, NEXTGEN_MINTER } from "../../../nextgen_contracts";
import {
  ProofResponse,
  Status,
  TokensPerAddress,
} from "../../../nextgen_entities";
import {
  useAccount,
  useChainId,
  useEnsAddress,
  useEnsName,
  useWriteContract,
} from "wagmi";
import { useEffect, useState } from "react";
import { NULL_ADDRESS } from "../../../../../constants";
import { fetchUrl } from "../../../../../services/6529api";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import {
  getStatusFromDates,
  useMintSharedState,
} from "../../../nextgen_helpers";
import { NextGenMintingFor } from "./NextGenMintShared";
import { NextGenCollection } from "../../../../../entities/INextgen";
import { Spinner } from "./NextGenMint";
import DotLoader from "../../../../dotLoader/DotLoader";

export function getJsonData(keccak: string, data: string) {
  const parsed = JSON.parse(data);
  const results: any[] = [];
  Object.entries(parsed).forEach(([key, value]) => {
    results.push({
      key,
      value,
    });
  });
  return (
    <ul className="mb-0">
      {results.map((r) => (
        <li key={`ul-${keccak}-${r.key}-${r.value}`}>
          {capitalizeFirstChar(r.key)}: {r.value}
        </li>
      ))}
    </ul>
  );
}

interface Props {
  collection: NextGenCollection;
  available_supply: number;
  mint_price: number;
  mint_counts: TokensPerAddress;
  delegators: string[];
  mintForAddress: (mintForAddress: string) => void;
  fetchingMintCounts: boolean;
  refreshMintCounts: () => void;
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

  const [currentProof, setCurrentProof] = useState<
    | {
        index: number;
        proof: ProofResponse;
      }
    | undefined
  >();
  const [originalProofs, setOriginalProofs] = useState<ProofResponse[]>([]);
  const [fetchingProofs, setFetchingProofs] = useState<boolean>(false);

  const alStatus = getStatusFromDates(
    props.collection.allowlist_start,
    props.collection.allowlist_end
  );

  const publicStatus = getStatusFromDates(
    props.collection.public_start,
    props.collection.public_end
  );

  const {
    proofResponse,
    setProofResponse,
    mintForAddress,
    setMintForAddress,
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
    props.mintForAddress(mintForAddress);
  }, [mintForAddress]);

  function findActiveProof(proofs: ProofResponse[]) {
    if (publicStatus == Status.LIVE) {
      return undefined;
    }

    let runningTotal = 0;

    for (let index = 0; index < proofs.length; index++) {
      const response = proofs[index];
      runningTotal += response.spots;
      if (index > 0) {
        runningTotal -= proofs[index - 1].spots;
      }
      if (props.mint_counts.allowlist < runningTotal) {
        return { proof: response, index };
      }
    }
    return {
      proof: proofs[proofs.length - 1],
      index: proofs.length - 1,
    };
  }

  useEffect(() => {
    if (account.address && props.collection.allowlist_end > 0) {
      if (mintForAddress) {
        setFetchingProofs(true);
        const merkleRoot = props.collection.merkle_root;
        const url = `${process.env.API_ENDPOINT}/api/nextgen/proofs/${merkleRoot}/${mintForAddress}`;
        fetchUrl(url).then((response: ProofResponse[]) => {
          const proofResponses: ProofResponse[] = [];
          if (response.length > 0) {
            proofResponses.push({
              keccak: response[0].keccak,
              spots: response[0].spots,
              info: response[0].info,
              proof: response[0].proof,
            });
            for (let i = 1; i < response.length; i++) {
              const spots = response[i].spots - response[i - 1].spots;
              proofResponses.push({
                keccak: response[i].keccak,
                spots: spots,
                info: response[i].info,
                proof: response[i].proof,
              });
            }
          }
          setProofResponse(proofResponses);
          setCurrentProof(findActiveProof(response));
          setOriginalProofs(response);
          setFetchingProofs(false);
        });
      }
    }
  }, [props.collection, account.address, mintForAddress]);

  const mintWrite = useWriteContract();

  useEffect(() => {
    setIsMinting(false);
  }, [mintWrite.isSuccess || mintWrite.isError]);

  function isAllowlistError() {
    return (
      proofResponse && alStatus == Status.LIVE && 0 >= proofResponse.length
    );
  }

  function validate() {
    let e: string[] = [];
    if (isAllowlistError()) {
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
        web3Modal.open();
      }
    } else {
      web3Modal.open();
    }
  };

  function disableMint() {
    if (!account.isConnected || chainId !== NEXTGEN_CHAIN_ID) {
      return false;
    }
    if (props.available_supply <= 0) {
      return true;
    }
    if (isAllowlistError()) {
      return true;
    }
    return (
      !props.mint_counts ||
      props.fetchingMintCounts ||
      (alStatus == Status.LIVE && !proofResponse) ||
      (alStatus != Status.LIVE && publicStatus != Status.LIVE) ||
      (alStatus == Status.LIVE &&
        currentProof &&
        0 >= currentProof.proof.spots - props.mint_counts.allowlist) ||
      (publicStatus == Status.LIVE &&
        0 >= props.collection.max_purchases - props.mint_counts.public) ||
      0 >= props.available_supply ||
      isMinting
    );
  }

  useEffect(() => {
    if (isMinting) {
      mintWrite.writeContract({
        address: NEXTGEN_MINTER[NEXTGEN_CHAIN_ID] as `0x${string}`,
        abi: NEXTGEN_MINTER.abi,
        chainId: NEXTGEN_CHAIN_ID,
        value: getMintValue(mintCount, props.mint_price),
        functionName: "mint",
        args: [
          props.collection.id,
          mintCount,
          currentProof &&
          currentProof.proof.spots > 0 &&
          alStatus == Status.LIVE
            ? currentProof.proof.spots
            : 0,
          currentProof ? currentProof.proof.info : "",
          mintToAddress,
          currentProof && alStatus == Status.LIVE
            ? currentProof.proof.proof
            : [],
          areEqualAddresses(mintForAddress, account.address)
            ? NULL_ADDRESS
            : mintForAddress,
          salt,
        ],
      });
    }
  }, [isMinting]);

  useEffect(() => {
    setProofResponse([]);
    if (account.address) {
      setMintToAddress(account.address);
      setMintToInput(account.address);
    } else {
      setMintToInput("");
      setMintToAddress("");
    }
    setMintCount(0);
    mintWrite.reset();
    props.refreshMintCounts();
    props.mintForAddress((account.address as string) ?? "");
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

  useEffect(() => {
    if (props.mint_counts) {
      setMintCount(1);
    }
  }, [props.mint_counts]);

  useEffect(() => {
    setCurrentProof(findActiveProof(originalProofs));
  }, [props.fetchingMintCounts]);

  function renderAllowlistStatus() {
    if (proofResponse && alStatus === Status.LIVE) {
      const maxSpots = proofResponse.reduce(
        (acc, response) => acc + response.spots,
        0
      );
      if (maxSpots > 0) {
        const spotsRemaining =
          maxSpots > props.mint_counts.allowlist
            ? ` (${maxSpots - props.mint_counts.allowlist} remaining)`
            : "";
        return `${props.mint_counts.allowlist} / ${maxSpots}${spotsRemaining}`;
      } else {
        return "You don't have any spots in the allowlist";
      }
    }
    return null;
  }

  function renderPublicStatus() {
    if (publicStatus == Status.LIVE) {
      const publicRemaining =
        props.collection.max_purchases > props.mint_counts.public
          ? ` (${
              props.collection.max_purchases - props.mint_counts.public
            } remaining)`
          : "";
      return `${props.mint_counts.public} / ${props.collection.max_purchases}${publicRemaining}`;
    }
    return null;
  }

  function renderAllowlistOptions() {
    if (alStatus == Status.LIVE && proofResponse && proofResponse.length > 0) {
      return createArray(
        1,
        currentProof
          ? currentProof.proof.spots - props.mint_counts.allowlist
          : 0
      ).map((i) => (
        <option selected key={`allowlist-mint-count-${i}`} value={i}>
          {i > 0 ? i : `n/a`}
        </option>
      ));
    }
    return null;
  }

  function renderPublicOptions() {
    if (publicStatus == Status.LIVE) {
      return createArray(
        1,
        props.collection.max_purchases - props.mint_counts.public
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

  function getWalletMintsLabel() {
    let label = "";
    if (alStatus === Status.LIVE) {
      label = "Allowlist";
    }
    if (publicStatus === Status.LIVE) {
      label = "Public Phase";
    }
    return <>Wallet Mints {label}</>;
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
            <NextGenMintingFor
              title={"Mint For"}
              delegators={props.delegators}
              mintForAddress={mintForAddress}
              setMintForAddress={setMintForAddress}
            />
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
                  disabled={!account.isConnected || disableMint()}
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
                {getWalletMintsLabel()}
                :&nbsp;
                {props.fetchingMintCounts ? (
                  <DotLoader />
                ) : (
                  <b>
                    {renderAllowlistStatus()}
                    {renderPublicStatus()}
                  </b>
                )}
              </Form.Label>
            </Form.Group>
            {alStatus === Status.LIVE &&
              (fetchingProofs ? (
                <DotLoader />
              ) : (
                proofResponse.map((response, index) => (
                  <Form.Group
                    key={response.keccak}
                    as={Row}
                    className="pt-2 pl-2">
                    <Col>
                      <Form.Check
                        type="checkbox"
                        label={
                          <>
                            Spots: {response.spots}
                            <br />
                            <span className="d-flex gap-1">
                              Data:{" "}
                              {getJsonData(response.keccak, response.info)}
                            </span>
                          </>
                        }
                        id={`${response.keccak}`}
                        checked={currentProof && currentProof.index >= index}
                        disabled={
                          (currentProof && index != currentProof.index) ||
                          disableMint()
                        }
                        className={`pt-1 pb-1 `}></Form.Check>
                    </Col>
                  </Form.Group>
                ))
              ))}
            <Form.Group
              as={Row}
              className="pt-2 pb-2 d-flex align-items-center">
              <Form.Label className="d-flex align-items-center">
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
              <Col xs={3}>
                <Form.Select
                  className={styles.mintSelect}
                  value={mintCount}
                  disabled={
                    !account.isConnected ||
                    (publicStatus !== Status.LIVE &&
                      currentProof?.proof &&
                      currentProof.proof.spots <= 0) ||
                    disableMint()
                  }
                  onChange={(e: any) => {
                    setMintCount(parseInt(e.currentTarget.value));
                  }}>
                  {props.mint_counts ? (
                    renderAllowlistOptions() ?? renderPublicOptions()
                  ) : (
                    <option value={0}>n/a</option>
                  )}
                </Form.Select>
              </Col>
              <Col xs={9}>
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
              isLoading={mintWrite.isPending}
              hash={mintWrite.data}
              error={mintWrite.error}
              onSuccess={() => {
                setCurrentProof(findActiveProof(originalProofs));
                props.refreshMintCounts();
              }}
            />
          </Form>
        </Col>
      </Row>
    </Container>
  );
}
