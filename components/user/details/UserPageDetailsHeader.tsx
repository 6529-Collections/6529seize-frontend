import styles from "../UserPage.module.scss";
import { Col, Row } from "react-bootstrap";
import { Focus } from "./UserPageDetails";

export default function UserPageDetailsHeader({
  focus,
  setFocus,
}: {
  focus: Focus;
  setFocus: (focus: Focus) => void;
}) {
  return (
    <Row className="pt-5 pb-5">
      <Col className="d-flex align-items-center justify-content-center">
        <h3
          className={
            focus === Focus.COLLECTION ? styles.focusActive : styles.focus
          }
          onClick={() => setFocus(Focus.COLLECTION)}
        >
          Collection
        </h3>
        <h3>&nbsp;|&nbsp;</h3>
        <h3
          className={
            focus === Focus.ACTIVITY ? styles.focusActive : styles.focus
          }
          onClick={() => setFocus(Focus.ACTIVITY)}
        >
          Activity
        </h3>
        <h3>&nbsp;|&nbsp;</h3>
        <h3
          className={
            focus === Focus.DISTRIBUTIONS ? styles.focusActive : styles.focus
          }
          onClick={() => setFocus(Focus.DISTRIBUTIONS)}
        >
          Distributions
        </h3>
        <h3>&nbsp;|&nbsp;</h3>
        <h3
          className={focus === Focus.STATS ? styles.focusActive : styles.focus}
          onClick={() => setFocus(Focus.STATS)}
        >
          Stats
        </h3>
      </Col>
    </Row>
  );
}
