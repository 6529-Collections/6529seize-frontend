import styles from "./MintCountdownBox.module.scss";
import DateCountdown from "../date-countdown/DateCountdown";
import { Container, Row, Col } from "react-bootstrap";
import Link from "next/link";

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
    <span className={styles.countdownContainer}>
      <DateCountdown title={props.title} date={new Date(props.date * 1000)} />
      <span>
        <Container className="no-padding">
          <Row>
            {!props.hide_mint_btn &&
              props.buttons.map((btn) => (
                <Col
                  className="pt-1 pb-1"
                  key={btn.link}
                  sm={12}
                  md={props.is_full_width ? 12 : 12 / props.buttons.length}>
                  <Link href={btn.link} target={btn.target} rel="noreferrer">
                    <button
                      className={`pt-2 pb-2 btn-block seize-btn no-wrap ${styles.mintBtn}`}>
                      {btn.label}
                    </button>
                  </Link>
                </Col>
              ))}
          </Row>
        </Container>
      </span>

      {props.additional_elements}
    </span>
  );
}
