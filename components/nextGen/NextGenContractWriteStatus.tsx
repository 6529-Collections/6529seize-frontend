import { useWaitForTransaction } from "wagmi";
import { getTransactionLink } from "../../helpers/Helpers";
import { NEXTGEN_CHAIN_ID } from "./nextgen_contracts";
import DotLoader from "../dotLoader/DotLoader";

interface Props {
  hash?: `0x${string}`;
  isLoading: boolean;
  error: any;
}

export default function NextGenContractWriteStatus(props: Readonly<Props>) {
  const waitContractWrite = useWaitForTransaction({
    confirmations: 1,
    hash: props.hash,
  });

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
    return JSON.stringify(props.error);
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
          <a
            href={getTransactionLink(NEXTGEN_CHAIN_ID, props.hash)}
            target="_blank"
            rel="noreferrer">
            view
          </a>
          {waitContractWrite.isLoading && (
            <>
              <br />
              Waiting for confirmation <DotLoader />
            </>
          )}
        </span>
      )}
    </>
  );
}
