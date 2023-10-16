import { useWaitForTransaction } from "wagmi";
import { getTransactionLink } from "../../helpers/Helpers";
import { NEXTGEN_CHAIN_ID } from "./contracts";

interface Props {
  hash?: `0x${string}`;
  isLoading: boolean;
  error: any;
}

export default function NextGenContractWriteStatus(props: Props) {
  const waitContractWrite = useWaitForTransaction({
    confirmations: 1,
    hash: props.hash,
  });

  return (
    <>
      {props.isLoading && (
        <span>
          Submitting...
          <br />
          Confirm in your wallet
        </span>
      )}
      {props.error && (
        <span className="text-danger">{(props.error as any).details}</span>
      )}
      {!props.isLoading && props.hash && (
        <span>
          Transaction{" "}
          {waitContractWrite.isLoading
            ? `Submitted`
            : waitContractWrite.isSuccess
            ? `Successful`
            : `Failed`}{" "}
          <a
            href={getTransactionLink(NEXTGEN_CHAIN_ID, props.hash)}
            target="_blank"
            rel="noreferrer">
            view
          </a>
          {waitContractWrite.isLoading && (
            <>
              <br />
              Waiting for confirmation...
            </>
          )}
        </span>
      )}
    </>
  );
}
