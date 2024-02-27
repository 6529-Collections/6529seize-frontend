import styles from "./MintCountdownBox.module.scss";
import DateCountdown from "../date-countdown/DateCountdown";

interface Props {
  title: string;
  date: number;
  hide_mint_btn: boolean;
  btn_label: string;
  mint_link: string;
  new_tab?: boolean;
  additional_elements?: any;
}

export default function MintCountdownBox(props: Readonly<Props>) {
  return (
    <span className={styles.countdownContainer}>
      <DateCountdown title={props.title} date={new Date(props.date * 1000)} />
      {!props.hide_mint_btn && (
        <a
          href={props.mint_link}
          target={props.new_tab ? "_blank" : "_self"}
          rel="noreferrer">
          <button
            className={`pt-2 pb-2 seize-btn btn-block no-wrap ${styles.mintBtn}`}>
            {props.btn_label}
          </button>
        </a>
      )}
      {props.additional_elements}
    </span>
  );
}
