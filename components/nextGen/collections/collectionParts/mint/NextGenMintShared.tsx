import styles from "../../NextGen.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import { Form, Row, Col } from "react-bootstrap";
import { useEnsName } from "wagmi";

export function NextGenMintDelegatorOption(
  props: Readonly<{ address: string }>
) {
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

export function NextGenAdminMintForModeFormGroup(
  props: Readonly<{
    title: string;
    connectedAddress: string | undefined;
    delegators: number;
    mintingForDelegator: boolean;
    setMintingForDelegator: (mintFor: boolean) => void;
  }>
) {
  return (
    <Form.Group as={Row} className="pt-1 pb-1">
      <Form.Label column sm={12} className="d-flex align-items-center">
        {props.title}
      </Form.Label>
      <Col sm={12} className="d-flex align-items-center gap-3 flex-wrap">
        <span className="d-flex align-items-center">
          <Form.Check
            checked={!props.mintingForDelegator}
            className={styles.mintingForRadio}
            type="radio"
            label="Connected Wallet"
            name="expiryRadio"
            disabled={!props.connectedAddress}
            onChange={() => {
              props.setMintingForDelegator(false);
            }}
          />
          <Tippy
            content={`Mint for your connected wallet ${props.connectedAddress}`}
            placement={"top"}
            theme={"light"}>
            <FontAwesomeIcon
              className={styles.infoIcon}
              icon="info-circle"></FontAwesomeIcon>
          </Tippy>
        </span>
        <span className="d-flex align-items-center">
          <Form.Check
            checked={props.mintingForDelegator}
            className={styles.mintingForRadio}
            type="radio"
            label="Delegator"
            name="expiryRadio"
            disabled={props.delegators === 0}
            onChange={() => {
              props.setMintingForDelegator(true);
            }}
          />
          <Tippy
            content={`Mint for an address that has delegated to you${
              props.delegators === 0
                ? ` - you currently have no delegators`
                : ``
            }`}
            placement={"top"}
            theme={"light"}>
            <FontAwesomeIcon
              className={styles.infoIcon}
              icon="info-circle"></FontAwesomeIcon>
          </Tippy>
        </span>
      </Col>
    </Form.Group>
  );
}

export function NextGenAdminMintingForDelegator(
  props: Readonly<{
    delegators: string[];
    mintForAddress: string | undefined;
    setMintForAddress: (address: string) => void;
  }>
) {
  return (
    <Form.Group as={Row} className="pb-2">
      <Form.Label column sm={12} className="d-flex align-items-center">
        Delegator
        <Tippy
          content={`The address you are minting for`}
          placement={"top"}
          theme={"light"}>
          <FontAwesomeIcon
            className={styles.infoIcon}
            icon="info-circle"></FontAwesomeIcon>
        </Tippy>
      </Form.Label>
      <Col sm={12}>
        <Form.Select
          className={styles.mintSelect}
          value={props.mintForAddress}
          onChange={(e: any) => {
            props.setMintForAddress(e.currentTarget.value);
          }}>
          <option value="" disabled>
            Select Delegator
          </option>
          {props.delegators.map((delegator) => (
            <NextGenMintDelegatorOption
              address={delegator}
              key={`delegator-${delegator}`}
            />
          ))}
        </Form.Select>
      </Col>
    </Form.Group>
  );
}
