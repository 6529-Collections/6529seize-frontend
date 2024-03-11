import styles from "./Delegation.module.scss";
import { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import {
  useContractWrite,
  useEnsAddress,
  useEnsName,
  useWaitForTransaction,
} from "wagmi";
import { DELEGATION_CONTRACT } from "../../constants";
import { Hash } from "viem";
import { getTransactionLink } from "../../helpers/Helpers";

export function useOrignalDelegatorEnsResolution(
  props: Readonly<{
    subdelegation?: { originalDelegator: string };
  }>
) {
  return useEnsName({
    address: props.subdelegation
      ? (props.subdelegation.originalDelegator as `0x${string}`)
      : undefined,
    chainId: 1,
  });
}

const DELEGATION_NETWORK_ERROR = `Switch to ${
  DELEGATION_CONTRACT.chain_id === 1 ? "Ethereum Mainnet" : "Sepolia Network"
}`;

const DELEGATION_LOCKED_ERROR =
  "CANNOT ESTIMATE GAS - This can be caused by locked collections/use-cases";

export function getGasError(error: any) {
  if (error.message.includes("Chain mismatch")) {
    return DELEGATION_NETWORK_ERROR;
  } else {
    return DELEGATION_LOCKED_ERROR;
  }
}

export function DelegationAddressInput(
  props: Readonly<{ setAddress: (address: string) => void }>
) {
  const [newDelegationInput, setNewDelegationInput] = useState("");
  const [newDelegationAddress, setNewDelegationAddress] = useState("");

  const newDelegationAddressEns = useEnsName({
    address:
      newDelegationInput && newDelegationInput.startsWith("0x")
        ? (newDelegationInput as `0x${string}`)
        : undefined,
    chainId: 1,
  });

  useEffect(() => {
    if (newDelegationAddressEns.data) {
      setNewDelegationAddress(newDelegationInput);
      setNewDelegationInput(
        `${newDelegationAddressEns.data} - ${newDelegationInput}`
      );
    }
  }, [newDelegationAddressEns.data]);

  const newDelegationToAddressFromEns = useEnsAddress({
    name:
      newDelegationInput && newDelegationInput.endsWith(".eth")
        ? newDelegationInput
        : undefined,
    chainId: 1,
  });

  useEffect(() => {
    if (newDelegationToAddressFromEns.data) {
      setNewDelegationAddress(newDelegationToAddressFromEns.data);
      setNewDelegationInput(
        `${newDelegationInput} - ${newDelegationToAddressFromEns.data}`
      );
    }
  }, [newDelegationToAddressFromEns.data]);

  useEffect(() => {
    props.setAddress(newDelegationAddress);
  }, [newDelegationAddress]);

  return (
    <Form.Control
      placeholder={"Consolidate with - 0x... or ENS"}
      className={`${styles.formInput}`}
      type="text"
      value={newDelegationInput}
      onChange={(e) => {
        setNewDelegationInput(e.target.value);
        setNewDelegationAddress(e.target.value);
      }}
    />
  );
}

export function DelegationWaitContractWrite(
  props: Readonly<{
    title: string;
    data: any;
    error: any;
    onSetToast: (toast: { title: string; message: string }) => void;
    setIsWaitLoading: (isLoading: boolean) => void;
  }>
) {
  const waitContractWriteDelegation = useWaitForTransaction({
    confirmations: 1,
    hash: props.data?.hash,
  });

  useEffect(() => {
    props.setIsWaitLoading(waitContractWriteDelegation.isLoading);
  }, [waitContractWriteDelegation.isLoading]);

  useEffect(() => {
    if (props.error) {
      props.onSetToast({
        title: props.title,
        message: props.error.message.split("Request Arguments")[0],
      });
    }
    if (props.data) {
      if (waitContractWriteDelegation.isLoading) {
        props.onSetToast({
          title: props.title,
          message: `Transaction submitted...
                    <a
                    href=${getTransactionLink(
                      DELEGATION_CONTRACT.chain_id,
                      props.data.hash
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className=${styles.etherscanLink}>
                    view
                  </a><br />Waiting for confirmation...`,
        });
      } else {
        props.onSetToast({
          title: props.title,
          message: `Transaction Successful!
                    <a
                    href=${getTransactionLink(
                      DELEGATION_CONTRACT.chain_id,
                      props.data.hash
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className=${styles.etherscanLink}>
                    view
                  </a>`,
        });
      }
    }
  }, [props.error, props.data, waitContractWriteDelegation.isLoading]);

  return <></>;
}
