import styles from "@/components/nextGen/collections/NextGen.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip } from "react-tooltip";
import { Form, Row, Col } from "react-bootstrap";
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
    <Form.Group as={Row} className="pb-2">
      <Form.Label column sm={12} className="d-flex align-items-center">
        {props.title}
        <FontAwesomeIcon
          className={styles.infoIcon}
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
      </Form.Label>
      <Col sm={12}>
        <Form.Select
          className={styles.mintSelect}
          value={props.mintForAddress}
          onChange={(e: any) => {
            props.setMintForAddress(e.currentTarget.value);
          }}>
          <option value="" disabled>
            Select Address to {props.title}
          </option>
          {account.address && (
            <NextGenMintAddressOption address={account.address} />
          )}
          {props.delegators.map((delegator) => (
            <NextGenMintAddressOption
              address={delegator}
              key={`delegator-${delegator}`}
            />
          ))}
        </Form.Select>
      </Col>
    </Form.Group>
  );
}
