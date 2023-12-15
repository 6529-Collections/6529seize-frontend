import { useWeb3Modal, useWeb3ModalState } from "@web3modal/wagmi/react";
import { useState, useEffect } from "react";
import { useDisconnect } from "wagmi";

export function useSeizeWeb3Modal(): {
  isOpen: boolean;
  connectDisabled: boolean;
  open: () => void;
  disconnect: () => void;
} {
  const web3Modal = useWeb3Modal();
  const web3Disconnect = useDisconnect();
  const { open: isOpen } = useWeb3ModalState();

  const [connectDisabled, setConnectDisabled] = useState(false);

  function open() {
    if (connectDisabled) {
      return;
    }
    web3Modal.open();
  }

  function disconnect() {
    web3Disconnect.disconnect();
  }

  useEffect(() => {
    fetch("/api/connectEnabled")
      .then((res) => res.json())
      .then((data) => {
        setConnectDisabled(data.disableConnect);
      })
      .catch((err) => {
        console.log("/api/connectEnabled error", err);
      });
  }, []);

  useEffect(() => {
    if (connectDisabled) {
      console.log("SEIZE CONNECT DISABLED");
      disconnect();
    }
  }, [connectDisabled]);

  return { isOpen, connectDisabled, open, disconnect };
}
