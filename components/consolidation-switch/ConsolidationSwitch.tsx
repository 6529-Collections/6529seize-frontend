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

export default function ConsolidationSwitch(props: Readonly<Props>) {
  return (
    <>
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
