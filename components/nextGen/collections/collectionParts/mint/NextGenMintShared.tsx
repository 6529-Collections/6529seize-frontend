import styles from "@/components/nextGen/collections/NextGen.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip } from "react-tooltip";
import { useEnsName } from "wagmi";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";

function NextGenMintAddressOption(props: Readonly<{ address: string }>) {
  const ens = useEnsName({
    address: props.address as `0x${string}`,
    chainId: 1,
  });

  return (
    <option value={props.address}>
      {ens.data ? `${ens.data} - ${props.address}` : props.address}
    </option>
  );
}

export function NextGenMintingFor(
  props: Readonly<{
    title: string;
    delegators: string[];
    mintForAddress: string | undefined;
    setMintForAddress: (address: string) => void;
  }>
) {
  const account = useSeizeConnectContext();

  return (
    <div className="tw-pb-2">
      <label className="tw-flex tw-items-center">
        {props.title}
        <FontAwesomeIcon
          className={styles["infoIcon"]}
          icon={faInfoCircle}
          data-tooltip-id="mint-for-address-info">
        </FontAwesomeIcon>
        <Tooltip 
          id="mint-for-address-info"
          content="The address you are minting for"
          place="top"
          style={{
            backgroundColor: "#1F2937",
            color: "white", 
            padding: "4px 8px",
          }}
        />
      </label>
      <select
        className={`${styles["mintSelect"]} tw-form-select tw-block tw-w-full tw-rounded-none`}
        value={props.mintForAddress}
        onChange={(e) => {
          props.setMintForAddress(e.currentTarget.value);
        }}>
        <option value="" disabled>
          Select Address to {props.title}
        </option>
        {account.address && <NextGenMintAddressOption address={account.address} />}
        {props.delegators.map((delegator) => (
          <NextGenMintAddressOption
            address={delegator}
            key={`delegator-${delegator}`}
          />
        ))}
      </select>
    </div>
  );
}

export function NextGenMintErrors({
  errors,
  className = "tw-py-2",
}: Readonly<{
  errors: string[];
  className?: string;
}>) {
  return (
    <div className={className}>
      <div className="tw-flex tw-items-center">Errors</div>
      <div className="tw-flex tw-items-center">
        <ul className="tw-mb-0">
          {errors.map((error) => (
            <li key={`mint-error-${error.replaceAll(" ", "-")}`}>{error}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
