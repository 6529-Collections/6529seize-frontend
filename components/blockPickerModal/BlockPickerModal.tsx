import { Button, Col, Container, Form, Modal, Row } from "react-bootstrap";
import styles from "./BlockPickerModal.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";

interface Props {
  show: boolean;
  initial_from: number | undefined;
  initial_to: number | undefined;
  onApply: (fromBlock: number | undefined, toBlock: number | undefined) => void;
  onHide: () => void;
}

export default function BlockPickerModal(props: Readonly<Props>) {
  const [fromBlock, setFromBlock] = useState("");
  const [toBlock, setToBlock] = useState("");

  const [error, setError] = useState<string>();

  useEffect(() => {
    if (props.initial_from) setFromBlock(props.initial_from.toString());
  }, [props.initial_from]);

  useEffect(() => {
    if (props.initial_to) setToBlock(props.initial_to.toString());
  }, [props.initial_to]);

  function apply() {
    const fromBlockInt = parseInt(fromBlock);
    const toBlockInt = parseInt(toBlock);
    if (isNaN(fromBlockInt) || isNaN(toBlockInt)) {
      setError("Please enter a valid start and end block.");
      return;
    }
    if (fromBlockInt > toBlockInt) {
      setError("The start block must be before the end block.");
      return;
    }
    props.onApply(fromBlockInt, toBlockInt);
    props.onHide();
  }

  return (
    <Modal show={props.show} onHide={() => props.onHide()}>
      <Modal.Header className={styles.header}>
        <Modal.Title>Select Dates</Modal.Title>
        <FontAwesomeIcon
          className={styles.modalClose}
          icon="times-circle"
          onClick={() => props.onHide()}
        />
      </Modal.Header>
      <Modal.Body
        className={`${styles.body} d-flex align-items-center justify-content-between font-larger`}>
        <Container>
          <Row>
            <Col>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Start Block</Form.Label>
                  <Form.Control
                    value={fromBlock}
                    className={`${styles.formInput}`}
                    type="number"
                    placeholder="Start Block"
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (isNaN(value)) {
                        setFromBlock("");
                      } else {
                        setFromBlock(value.toString());
                      }
                    }}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>End Blocks</Form.Label>
                  <Form.Control
                    value={toBlock}
                    className={`${styles.formInput}`}
                    type="number"
                    placeholder="End Block"
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (isNaN(value)) {
                        setToBlock("");
                      } else {
                        setToBlock(value.toString());
                      }
                    }}
                  />
                </Form.Group>
              </Form>
            </Col>
          </Row>
        </Container>
      </Modal.Body>
      <Modal.Footer className={styles.footer}>
        <Container>
          <Row>
            <Col className="d-flex justify-content-between gap-2">
              <span>
                {error && <span className="text-danger">{error}</span>}
              </span>
              <span className="d-flex justify-content-end gap-2">
                <Button
                  className="seize-btn-link"
                  onClick={() => props.onHide()}>
                  Cancel
                </Button>
                <Button
                  className="seize-btn btn-white"
                  onClick={() => {
                    setError(undefined);
                    apply();
                  }}>
                  Apply
                </Button>
              </span>
            </Col>
          </Row>
        </Container>
      </Modal.Footer>
    </Modal>
  );
}
