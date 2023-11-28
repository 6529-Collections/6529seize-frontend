import styles from "./NextGenAdmin.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Row, Col, Form } from "react-bootstrap";

export function NextGenAdminHeadingRow(
  props: Readonly<{ title: string; close: () => void }>
) {
  return (
    <Row className="pt-3">
      <Col className="d-flex align-items-center justify-content-between">
        <h3>
          <b>{props.title.toUpperCase()}</b>
        </h3>
        <FontAwesomeIcon
          className={styles.closeIcon}
          icon="times-circle"
          onClick={() => {
            props.close();
          }}></FontAwesomeIcon>
      </Col>
    </Row>
  );
}

export function NextGenCollectionIdFormGroup(
  props: Readonly<{
    collection_id: string;
    collection_ids?: string[];
    onChange: (id: string) => void;
  }>
) {
  return (
    <Form.Group className="mb-3">
      <Form.Label>Collection ID</Form.Label>
      <Form.Select
        className={`${styles.formInput}`}
        value={props.collection_id}
        onChange={(e) => {
          props.onChange(e.target.value);
        }}>
        <option value="" disabled>
          Select Collection
        </option>
        {props.collection_ids?.map((id) => (
          <option key={`collection-id-${id}`} value={id}>
            {id}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  );
}
