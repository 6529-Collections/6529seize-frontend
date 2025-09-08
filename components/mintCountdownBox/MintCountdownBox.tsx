import styles from "./MintCountdownBox.module.scss";
import DateCountdown from "../date-countdown/DateCountdown";
import { Container, Row, Col } from "react-bootstrap";
import Link from "next/link";

import type { JSX } from "react";

export interface MemePageMintBtn {
  label: JSX.Element | string;
  link: string;
  target: "_blank" | "_self";
}

interface Props {
  title: string;
  date: number;
  hide_mint_btn?: boolean;
  is_full_width?: boolean;
  buttons: MemePageMintBtn[];
  additional_elements?: any;
}

export default function MintCountdownBox(props: Readonly<Props>) {
  return (
    <Container className={styles.countdownContainer}>
      <Row>
        <Col sm={12} md={12} className="pt-2 pb-2">
          <DateCountdown
            title={props.title}
            date={new Date(props.date * 1000)}
          />
        </Col>
        {!props.hide_mint_btn &&
          props.buttons.map((btn) => (
            <Col
              className="pt-2 pb-2"
              key={btn.link}
              sm={12}
              md={12}>
              <Link href={btn.link} target={btn.target} rel="noreferrer">
                <button
                  className={`pt-2 pb-2 btn-block no-wrap ${styles.mintBtn}`}>
                  {btn.label}
                </button>
              </Link>
            </Col>
          ))}
      </Row>
      <Row>
        <Col>{props.additional_elements}</Col>
      </Row>
    </Container>
  );
}
