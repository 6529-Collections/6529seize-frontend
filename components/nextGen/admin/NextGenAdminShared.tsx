import { faTimesCircle } from "@fortawesome/free-solid-svg-icons";
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
          icon={faTimesCircle}
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

export function NextGenAdminScriptsFormGroup(
  props: Readonly<{
    scripts: string[];
    setScripts: (scripts: string[]) => void;
  }>
) {
  return (
    <Form.Group className="mb-3">
      <Form.Label>
        Scripts {props.scripts.length > 0 && `x${props.scripts.length}`}
      </Form.Label>
      <Form.Control
        as="textarea"
        rows={3}
        placeholder="...script - one line per entry"
        value={props.scripts.join("\n")}
        onChange={(e) => {
          if (e.target.value) {
            props.setScripts(e.target.value.split("\n"));
          } else {
            props.setScripts([]);
          }
        }}
      />
    </Form.Group>
  );
}

export function NextGenAdminTextFormGroup(
  props: Readonly<{
    title: string;
    value: string;
    setValue: (scripts: string) => void;
  }>
) {
  return (
    <Form.Group className="mb-3">
      <Form.Label>{props.title}</Form.Label>
      <Form.Control
        type="text"
        placeholder={`...${props.title}`}
        value={props.value}
        onChange={(e: any) => props.setValue(e.target.value)}
      />
    </Form.Group>
  );
}

export function NextGenAdminStatusFormGroup(
  props: Readonly<{
    title: string;
    status: boolean | undefined;
    setStatus: (status: boolean) => void;
  }>
) {
  return (
    <Form.Group className="mb-3">
      <Form.Label>{props.title}</Form.Label>
      <span className="d-flex align-items-center gap-3">
        <Form.Check
          checked={props.status}
          type="radio"
          label="Active"
          name="statusRadio"
          onChange={() => {
            props.setStatus(true);
          }}
        />
        <Form.Check
          checked={props.status === false}
          type="radio"
          label="Inactive"
          name="statusRadio"
          onChange={() => {
            props.setStatus(false);
          }}
        />
      </span>
    </Form.Group>
  );
}
