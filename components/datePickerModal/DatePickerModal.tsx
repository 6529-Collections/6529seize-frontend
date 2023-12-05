import { Button, Col, Container, Form, Modal, Row } from "react-bootstrap";
import styles from "./DatePickerModal.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";

interface Props {
  show: boolean;
  initial_from: Date | undefined;
  initial_to: Date | undefined;
  onApply: (fromDate: Date | undefined, toDate: Date | undefined) => void;
  onHide: () => void;
}

export default function DatePickerModal(props: Readonly<Props>) {
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const [error, setError] = useState<string>();

  useEffect(() => {
    if (props.initial_from) setFromDate(props.initial_from.toISOString());
  }, [props.initial_from]);

  useEffect(() => {
    if (props.initial_to) setToDate(props.initial_to.toISOString());
  }, [props.initial_to]);

  function apply() {
    if (fromDate && toDate) {
      if (fromDate > toDate) {
        setError("The start date must be before the end date.");
        return;
      }
    }
    props.onApply(new Date(fromDate), new Date(toDate));
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
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    value={
                      fromDate && new Date(fromDate)?.toISOString().slice(0, 10)
                    }
                    max={new Date().toISOString().slice(0, 10)}
                    className={`${styles.formInput}`}
                    type="date"
                    placeholder="Start Date"
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
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
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
