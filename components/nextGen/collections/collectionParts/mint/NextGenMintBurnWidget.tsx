"use client";

import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Button, Col, Container, Form, Row, Table } from "react-bootstrap";
import { Tooltip } from "react-tooltip";
import { useChainId, useWriteContract } from "wagmi";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import styles from "@/components/nextGen/collections/NextGen.module.scss";
import {
  NEXTGEN_CHAIN_ID,
  NEXTGEN_CORE,
  NEXTGEN_MINTER,
} from "@/components/nextGen/nextgen_contracts";
import type {
  CollectionWithMerkle,
  ProofResponse,
  TokensPerAddress} from "@/components/nextGen/nextgen_entities";
import {
  Status
} from "@/components/nextGen/nextgen_entities";
import {
  getStatusFromDates,
  useMintSharedState,
} from "@/components/nextGen/nextgen_helpers";
import NextGenContractWriteStatus from "@/components/nextGen/NextGenContractWriteStatus";
import { publicEnv } from "@/config/env";
import type { NextGenCollection } from "@/entities/INextgen";
import { areEqualAddresses, getNetworkName } from "@/helpers/Helpers";
import { fetchOwnerNfts } from "@/hooks/useAlchemyNftQueries";
import { fetchUrl } from "@/services/6529api";
import type { OwnerNft } from "@/services/alchemy/types";

import { Spinner } from "./NextGenMint";
import { NextGenMintingFor } from "./NextGenMintShared";

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
  const account = useSeizeConnectContext();
  const chainId = useChainId();
  const { seizeConnect } = useSeizeConnectContext();

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
    OwnerNft[]
  >([]);

  function filterTokensOwnedForBurnAddress(r: OwnerNft[]) {
    if (props.collection_merkle.max_token_index > 0) {
      r = r.filter((t) => {
        const tokenIdNum = Number(t.tokenId);
        return (
          tokenIdNum >= props.collection_merkle.min_token_index &&
          tokenIdNum <= props.collection_merkle.max_token_index
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
        t.tokenId.startsWith(String(props.collection_merkle.burn_collection_id))
      );
    }
    return r;
  }

  useEffect(() => {
    const burnAddress = mintForAddress;
    if (!burnAddress) {
      return;
    }
    const controller = new AbortController();

    fetchOwnerNfts(
      NEXTGEN_CHAIN_ID,
      NEXTGEN_CORE[NEXTGEN_CHAIN_ID],
      burnAddress,
      controller.signal
    )
      .then((r) => {
        setTokensOwnedForBurnAddressLoaded(true);
        const filteredTokens = filterTokensOwnedForBurnAddress(r);
        setTokensOwnedForBurnAddress(filteredTokens);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setTokensOwnedForBurnAddressLoaded(true);
          setTokensOwnedForBurnAddress([]);
        }
      });

    return () => controller.abort();
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
      const url = `${publicEnv.API_ENDPOINT}/api/nextgen/burn_proofs/${props.collection_merkle.merkle_root}/${tokenId}`;
      fetchUrl<ProofResponse>(url).then((response: ProofResponse) => {
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
        seizeConnect();
      }
    } else {
      seizeConnect();
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
                <FontAwesomeIcon
                  className={styles["infoIcon"]}
                  icon={faInfoCircle}
                  data-tooltip-id={`mint-to-info-${props.collection.id}`}></FontAwesomeIcon>
                <Tooltip
                  id={`mint-to-info-${props.collection.id}`}
                  content="In burns to mint, the token is minted to the address that burns the token."
                  place="top"
                  style={{
                    backgroundColor: "#1F2937",
                    color: "white",
                    padding: "4px 8px",
                  }}
                />
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
                  className={styles["mintSelect"]}
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
                  className={styles["mintBtn"]}
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
