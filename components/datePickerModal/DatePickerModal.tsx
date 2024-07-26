import { Button, Col, Container, Form, Modal, Row } from "react-bootstrap";
import styles from "./DatePickerModal.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";

interface Props {
  mode: "date" | "block";
  show: boolean;
  initial_from_date?: Date;
  initial_to_date?: Date;
  initial_from_block?: number;
  initial_to_block?: number;
  onApplyDate?: (fromDate: Date, toDate: Date) => void;
  onApplyBlock?: (fromBlock: number, toBlock: number) => void;
  onHide: () => void;
}

export default function DatePickerModal(props: Readonly<Props>) {
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const [fromBlock, setFromBlock] = useState("");
  const [toBlock, setToBlock] = useState("");

  const [error, setError] = useState<string>();

  useEffect(() => {
    if (props.initial_from_date)
      setFromDate(props.initial_from_date.toISOString());
  }, [props.initial_from_date]);

  useEffect(() => {
    if (props.initial_to_date) setToDate(props.initial_to_date.toISOString());
  }, [props.initial_to_date]);

  useEffect(() => {
    if (props.initial_from_block)
      setFromBlock(props.initial_from_block.toString());
  }, [props.initial_from_block]);

  useEffect(() => {
    if (props.initial_to_block) setToBlock(props.initial_to_block.toString());
  }, [props.initial_to_block]);

  function applyDate() {
    if (fromDate && toDate) {
      if (fromDate > toDate) {
        setError("The start date must be before the end date.");
        return;
      }
    }
    props.onApplyDate?.(new Date(fromDate), new Date(toDate));
    props.onHide();
  }

  function applyBlock() {
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
    props.onApplyBlock?.(fromBlockInt, toBlockInt);
    props.onHide();
  }

  function apply() {
    if (props.mode === "date") {
      applyDate();
    } else {
      applyBlock();
    }
  }

  return (
    <Modal show={props.show} onHide={() => props.onHide()}>
      <Modal.Header className={styles.header}>
        <Modal.Title>Select {props.mode}s</Modal.Title>
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
                  <Form.Label>Start {props.mode}</Form.Label>
                  {props.mode === "date" ? (
                    <Form.Control
                      value={
                        fromDate &&
                        new Date(fromDate)?.toISOString().slice(0, 10)
                      }
                      max={new Date().toISOString().slice(0, 10)}
                      type="date"
                      placeholder="Start Date"
                      className={`${styles.formInput}`}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value && value.length === 10) {
                          const tempDate = new Date(value);
                          if (!isNaN(tempDate.getTime())) {
                            setFromDate(value);
                          }
                        } else {
                          setFromDate("");
                        }
                      }}
                    />
                  ) : (
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
                  )}
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>End {props.mode}</Form.Label>
                  {props.mode === "date" ? (
                    <Form.Control
                      value={
                        toDate && new Date(toDate)?.toISOString().slice(0, 10)
                      }
                      max={new Date().toISOString().slice(0, 10)}
                      className={`${styles.formInput}`}
                      type="date"
                      placeholder="End Date"
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value && value.length === 10) {
                          const tempDate = new Date(value);
                          if (!isNaN(tempDate.getTime())) {
                            setToDate(value);
                          }
                        } else {
                          setToDate("");
                        }
                      }}
                    />
                  ) : (
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
                  )}
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
