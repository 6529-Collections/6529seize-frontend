import { useEnsName } from "wagmi";

interface Props {
  address: string;
}

export default function DelegationWallet(props: Readonly<Props>) {
  const ensResolution = useEnsName({
    address: props.address as `0x${string}`,
    chainId: 1,
  });

  if (ensResolution.data) {
    return (
      <span>
        {ensResolution.data} - {props.address}
      </span>
    );
  } else {
    return <span>{props.address}</span>;
  }
}
