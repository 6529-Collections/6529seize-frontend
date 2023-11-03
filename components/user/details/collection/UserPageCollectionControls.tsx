import { ConsolidatedTDHMetrics, TDHMetrics } from "../../../../entities/ITDH";
import styles from "../../UserPage.module.scss";
import { Row, Col, Form } from "react-bootstrap";

export default function UserPageCollectionControls({
  tdh,
  hideSeized,
  hideNonSeized,
  setHideSeized,
  setHideNonSeized,
  hideGradients,
  setHideGradients,
  hideMemes,
  setHideMemes,
}: {
  tdh?: ConsolidatedTDHMetrics | TDHMetrics;
  hideSeized: boolean;
  hideNonSeized: boolean;
  setHideSeized: (hide: boolean) => void;
  setHideNonSeized: (hide: boolean) => void;
  hideGradients: boolean;
  setHideGradients: (hide: boolean) => void;
  hideMemes: boolean;
  setHideMemes: (hide: boolean) => void;
}) {
  return (
    <Row className="pt-3">
      <Col>
        <Form.Check
          type="radio"
          name="hide"
          checked={!hideSeized && !hideNonSeized}
          className={`${styles.seizedToggle}`}
          label={`All`}
          onChange={() => {
            setHideSeized(false);
            setHideNonSeized(false);
          }}
        />
        <Form.Check
          type="radio"
          checked={!hideSeized && hideNonSeized}
          className={`${styles.seizedToggle}`}
          name="hide"
          label={`Seized`}
          onChange={() => {
            setHideSeized(false);
            setHideNonSeized(true);
          }}
        />
        <Form.Check
          type="radio"
          checked={hideSeized && !hideNonSeized}
          className={`${styles.seizedToggle}`}
          name="hide"
          label={`Unseized`}
          onChange={() => {
            setHideSeized(true);
            setHideNonSeized(false);
          }}
        />
        {tdh && tdh.memes_balance > 0 && tdh.gradients_balance > 0 && (
          <>
            <Form.Check
              type="switch"
              className={`${styles.seizedToggle}`}
              label={`Hide Gradients`}
              checked={hideGradients}
              onChange={() => {
                setHideGradients(!hideGradients);
              }}
            />
            <Form.Check
              type="switch"
              className={`${styles.seizedToggle}`}
              label={`Hide Memes`}
              checked={hideMemes}
              onChange={() => {
                setHideMemes(!hideMemes);
              }}
            />
          </>
        )}
      </Col>
    </Row>
  );
}
