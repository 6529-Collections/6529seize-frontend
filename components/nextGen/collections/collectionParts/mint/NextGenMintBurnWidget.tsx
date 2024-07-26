import styles from "../../NextGen.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import { Container, Row, Col, Form, Button, Table } from "react-bootstrap";
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
  CollectionWithMerkle,
  ProofResponse,
  Status,
  TokensPerAddress,
} from "../../../nextgen_entities";
import { useAccount, useChainId, useWriteContract } from "wagmi";
import { useState, useEffect } from "react";
import { fetchUrl } from "../../../../../services/6529api";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { getNftsForContractAndOwner } from "../../../../../services/alchemy-api";
import {
  getStatusFromDates,
  useMintSharedState,
} from "../../../nextgen_helpers";
import { NextGenMintingFor } from "./NextGenMintShared";
import { NextGenCollection } from "../../../../../entities/INextgen";
import { Spinner } from "./NextGenMint";

interface Props {
  collection: NextGenCollection;
  collection_merkle: CollectionWithMerkle;
  available_supply: number;
  mint_price: number;
  mint_counts: TokensPerAddress;
  delegators: string[];
  mintForAddress: (mintForAddress: string) => void;
  fetchingMintCounts: boolean;
  refreshMintCounts: () => void;
}

export default function NextGenMintBurnWidget(props: Readonly<Props>) {
  const account = useAccount();
  const chainId = useChainId();
  const web3Modal = useWeb3Modal();

  const alStatus = getStatusFromDates(
    props.collection.allowlist_start,
    props.collection.allowlist_end
  );

  const publicStatus = getStatusFromDates(
    props.collection.public_start,
    props.collection.public_end
  );

  const {
    burnProofResponse,
    setBurnProofResponse,
    mintForAddress,
    setMintForAddress,
    tokenId,
    setTokenId,
    salt,
    isMinting,
    setIsMinting,
    fetchingProofs,
    setFetchingProofs,
    errors,
    setErrors,
  } = useMintSharedState();

  const [tokensOwnedForBurnAddressLoaded, setTokensOwnedForBurnAddressLoaded] =
    useState(false);
  const [tokensOwnedForBurnAddress, setTokensOwnedForBurnAddress] = useState<
    any[]
  >([]);

  function filterTokensOwnedForBurnAddress(r: any[]) {
    if (props.collection_merkle.max_token_index > 0) {
      r = r.filter((t) => {
        return (
          t.tokenId >= props.collection_merkle.min_token_index &&
          t.tokenId <= props.collection_merkle.max_token_index
        );
      });
    }
    if (
      areEqualAddresses(
        props.collection_merkle.burn_collection,
        NEXTGEN_CORE[NEXTGEN_CHAIN_ID]
      )
    ) {
      r = r.filter((t) =>
        t.tokenId
          .toString()
          .startsWith(props.collection_merkle.burn_collection_id)
      );
    }
    return r;
  }

  useEffect(() => {
    const burnAddress = mintForAddress;
    if (burnAddress) {
      getNftsForContractAndOwner(
        NEXTGEN_CHAIN_ID,
        NEXTGEN_CORE[NEXTGEN_CHAIN_ID],
        burnAddress
      ).then((r) => {
        setTokensOwnedForBurnAddressLoaded(true);
        const filteredTokens = filterTokensOwnedForBurnAddress(r);
        setTokensOwnedForBurnAddress(filteredTokens);
      });
    }
  }, [account.address, mintForAddress]);

  useEffect(() => {
    setTokenId("");
    setTokensOwnedForBurnAddressLoaded(false);
    setTokensOwnedForBurnAddress([]);
  }, [mintForAddress]);

  useEffect(() => {
    props.mintForAddress(mintForAddress);
  }, [mintForAddress]);

  useEffect(() => {
    mintWrite.reset();
    if (tokenId) {
      setFetchingProofs(true);
      const url = `${process.env.API_ENDPOINT}/api/nextgen/burn_proofs/${props.collection_merkle.merkle_root}/${tokenId}`;
      fetchUrl(url).then((response: ProofResponse) => {
        setBurnProofResponse(response);
        setFetchingProofs(false);
      });
    }
  }, [tokenId]);

  const mintWrite = useWriteContract();

  useEffect(() => {
    setIsMinting(false);
  }, [mintWrite.isSuccess || mintWrite.isError]);

  function validate() {
    let e: string[] = [];
    if (!burnProofResponse?.proof) {
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
    if (!props.collection_merkle.status) {
      return true;
    }
    return (
      !props.mint_counts ||
      props.fetchingMintCounts ||
      (alStatus == Status.LIVE && !burnProofResponse) ||
      (alStatus != Status.LIVE && publicStatus != Status.LIVE) ||
      (alStatus == Status.LIVE &&
        burnProofResponse &&
        burnProofResponse.proof.length === 0) ||
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
        value: BigInt(props.mint_price ? props.mint_price : 0),
        functionName: "burnOrSwapExternalToMint",
        args: [
          props.collection_merkle.burn_collection,
          props.collection_merkle.burn_collection_id,
          tokenId,
          props.collection_merkle.collection_id,
          burnProofResponse ? burnProofResponse.info : "",
          burnProofResponse && alStatus == Status.LIVE
            ? burnProofResponse.proof
            : [],
          salt,
        ],
      });
    }
  }, [isMinting]);

  useEffect(() => {
    setBurnProofResponse(undefined);
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
    if (!props.collection_merkle.status) {
      return "Burn Not Active";
    }

    let text = "Burn to Mint";
    if (fetchingProofs) {
      text += " - fetching proofs";
    }
    if (
      !fetchingProofs &&
      tokenId &&
      burnProofResponse &&
      burnProofResponse.proof.length === 0
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
            <Row>
              <Col xs={12}>
                <u>Burn Details</u>
              </Col>
              <Col xs={12}>
                <Table className="mb-0">
                  <tbody>
                    <tr>
                      <td>Contract</td>
                      <td>{props.collection_merkle.burn_collection}</td>
                    </tr>
                    {!!props.collection_merkle.burn_collection_id && (
                      <tr>
                        <td>Collection</td>
                        <td>{props.collection_merkle.burn_collection_id}</td>
                      </tr>
                    )}
                    {props.collection_merkle.max_token_index > 0 && (
                      <tr>
                        <td>Tokens</td>
                        <td>
                          #{props.collection_merkle.min_token_index} - #
                          {props.collection_merkle.max_token_index}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Col>
            </Row>
            <NextGenMintingFor
              title="Burn and Mint For"
              delegators={props.delegators}
              mintForAddress={mintForAddress}
              setMintForAddress={setMintForAddress}
            />
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
              <Col sm={12}>{mintForAddress}</Col>
            </Form.Group>
            <Form.Group as={Row} className="pt-1 pb-1">
              <Form.Label column sm={12}>
                <span>Select token from Burn collection</span>
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
              isLoading={mintWrite.isPending}
              hash={mintWrite.data}
              error={mintWrite.error}
              onSuccess={() => {
                props.refreshMintCounts();
              }}
            />
          </Form>
        </Col>
      </Row>
    </Container>
  );
}
