import styles from "./ManifoldMinting.module.scss";

import { useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import { Spinner } from "../dotLoader/DotLoader";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ManifoldMerkleProof } from "./manifold-types";
import {
  ManifoldClaim,
  ManifoldClaimStatus,
} from "../../hooks/useManifoldClaim";

interface Props {
  index: number;
  contract: string;
  proxy: string;
  abi: any;
  claim: ManifoldClaim;
  proof: ManifoldMerkleProof;
}

export default function ManifoldMintingSpot(props: Readonly<Props>) {
  const [claimed, setClaimed] = useState<boolean>(false);

  const readContract = useReadContract({
    address: props.proxy as `0x${string}`,
    abi: props.abi,
    chainId: 1,
    functionName: "checkMintIndex",
    args: [props.contract, props.claim.instanceId, props.proof.value],
  });

  useEffect(() => {
    setClaimed(readContract.data as boolean);
  }, [readContract.data]);

  function printContent() {
    if (readContract.isFetching) {
      return <Spinner />;
    }

    if (readContract.error) {
      return "Something went wrong...";
    }

    if (claimed) {
      return (
        <span className={`${styles.claimed} d-flex gap-1 align-items-center`}>
          <b>Claimed</b>
          <FontAwesomeIcon icon={faCheckCircle} height={20} />
        </span>
      );
    }

    if (props.claim.status === ManifoldClaimStatus.EXPIRED) {
      return (
        <span className={`d-flex gap-1 align-items-center`}>
          <b>Not Claimed</b>
        </span>
      );
    }

    return <button className="btn btn-primary">Mint Now</button>;
  }

  return (
    <tr>
      <td className="pt-2 pb-2" style={{ verticalAlign: "middle" }}>
        Spot #{props.index}
      </td>
      <td className="pt-2 pb-2">{printContent()}</td>
    </tr>
  );
}
