import { useWeb3Modal } from "@web3modal/wagmi/react";

export default function HeaderUserConnect() {
    const { open: onConnect } = useWeb3Modal();
  return <button onClick={() => onConnect()}>Connect</button>;
}