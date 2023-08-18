import styles from "./ConsolidationSwitch.module.scss";
import { Button, Form } from "react-bootstrap";
import { useState } from "react";

export enum VIEW {
  CONSOLIDATION,
  WALLET,
}

interface Props {
  view: VIEW;
  plural?: boolean;
  onSetView(view: VIEW): any;
}

export default function ConsolidationSwitch(props: Props) {
  return (
    <>
      {/* <Button
        onClick={() => props.onSetView(VIEW.WALLET)}
        className={`${styles.consolidationSwitchLeft} ${
          props.view === VIEW.WALLET
            ? styles.consolidationSwitchActive
            : styles.consolidationSwitch
        }`}>
        Wallet{props.plural && "s"}
      </Button>
      <Button
        onClick={() => props.onSetView(VIEW.CONSOLIDATION)}
        className={`${styles.consolidationSwitchRight} ${
          props.view === VIEW.CONSOLIDATION
            ? styles.consolidationSwitchActive
            : styles.consolidationSwitch
        }`}>
        Consolidation{props.plural && "s"}
      </Button> */}
      <span className={styles.consolidationSwitchLabel}>
        Wallet{props.plural && "s"}
      </span>
      <Form.Check
        type="switch"
        className={`mb-0 ${styles.consolidationSwitch}`}
        label={``}
        checked={props.view === VIEW.CONSOLIDATION}
        onChange={(e: any) => {
          if (e.target.checked) {
            props.onSetView(VIEW.CONSOLIDATION);
          } else {
            props.onSetView(VIEW.WALLET);
          }
        }}
      />
      <span className={styles.consolidationSwitchLabel}>
        Consolidation{props.plural && "s"}
      </span>
    </>
  );
}
