"use client";

import { NULL_MERKLE } from "@/constants/constants";
import { areEqualAddresses, getTransactionLink } from "@/helpers/Helpers";
import { sanitizeErrorForUser } from "@/utils/error-sanitizer";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useWaitForTransactionReceipt } from "wagmi";
import DotLoader from "../dotLoader/DotLoader";
import { NEXTGEN_CHAIN_ID } from "./nextgen_contracts";

const TRANSFER_EVENT =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

interface Props {
  hash?: `0x${string}` | undefined;
  isLoading: boolean;
  error: any;
  onSuccess?: (() => void) | undefined;
}

export default function NextGenContractWriteStatus(props: Readonly<Props>) {
  const waitContractWrite = useWaitForTransactionReceipt({
    confirmations: 1,
    hash: props.hash,
  });

  const [mintedTokens, setMintedTokens] = useState<number[]>([]);

  useEffect(() => {
    if (waitContractWrite.data) {
      const tokenIds: number[] = [];
      waitContractWrite.data.logs.forEach((l) => {
        if (
          areEqualAddresses(l.topics[0], TRANSFER_EVENT) &&
          areEqualAddresses(l.topics[1], NULL_MERKLE)
        ) {
          const tokenIdHex = l.topics[3];
          if (tokenIdHex) {
            tokenIds.push(parseInt(tokenIdHex, 16));
          }
        }
      });
      setMintedTokens(tokenIds);
    }
  }, [waitContractWrite.data]);

  useEffect(() => {
    if (props.isLoading) {
      setMintedTokens([]);
    }
  }, [props.isLoading]);

  useEffect(() => {
    if (waitContractWrite.isSuccess && props.onSuccess) {
      props.onSuccess();
    }
  }, [waitContractWrite.isSuccess]);

  function getError() {
    const error = props.error;
    if (error.shortMessage) {
      return error.shortMessage;
    }
    if (error.details) {
      return error.details;
    }
    if (error.message) {
      return error.message;
    }
    return sanitizeErrorForUser(props.error);
  }

  function getStatusMessage() {
    if (waitContractWrite.isLoading) {
      return "Submitted";
    } else if (waitContractWrite.isSuccess) {
      return "Successful";
    } else {
      return "Failed";
    }
  }

  return (
    <>
      {props.isLoading && (
        <span>
          Submitting <DotLoader />
          <br />
          Confirm in your wallet
        </span>
      )}
      {props.error && <span className="text-danger">{getError()}</span>}
      {!props.isLoading && props.hash && (
        <span>
          Transaction {getStatusMessage()}{" "}
          <Link
            href={getTransactionLink(NEXTGEN_CHAIN_ID, props.hash)}
            target="_blank"
            rel="noopener noreferrer"
          >
            view
          </Link>
          {waitContractWrite.isLoading && (
            <>
              <br />
              Waiting for confirmation <DotLoader />
            </>
          )}
        </span>
      )}
      {!props.isLoading && mintedTokens.length > 0 && (
        <div className="pt-2">
          Token{mintedTokens.length > 1 ? "s" : ""} Minted:{" "}
          <ul>
            {mintedTokens.map((t) => (
              <li key={`minted-token-${t}`}>
                <Link
                  href={`/nextgen/token/${t}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  #{t}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
