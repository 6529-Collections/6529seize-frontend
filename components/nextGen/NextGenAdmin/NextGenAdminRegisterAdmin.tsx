import { Container, Row, Col, Button, Form } from "react-bootstrap";
import styles from "./NextGenAdmin.module.scss";
import { useAccount, useContractWrite, usePrepareContractWrite } from "wagmi";
import { useEffect, useState } from "react";
import { NEXTGEN_CHAIN_ID, NEXTGEN_ADMIN } from "../contracts";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";

import {
  useGlobalAdmin,
  useFunctionAdmin,
  useCollectionIndex,
  useCollectionAdmin,
  getCollectionIdsForAddress,
} from "./admin_helpers";

export enum ADMIN_TYPE {
  GLOBAL = "GLOBAL",
  FUNCTION = "FUNCTION",
  COLLECTION = "COLLECTION",
}

interface Props {
  type: ADMIN_TYPE;
}

export default function NextGenAdminRegisterAdmin(props: Props) {
  const account = useAccount();

  const [collectionID, setCollectionID] = useState("");
  const [address, setAddress] = useState("");
  const [selector, setSelector] = useState("");
  const [status, setStatus] = useState(true);

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function getFunctionName() {
    if (!submitting) {
      return "";
    }

    switch (props.type) {
      case ADMIN_TYPE.GLOBAL:
        return "registerAdmin";
      case ADMIN_TYPE.FUNCTION:
        return "registerFunctionAdmin";
      case ADMIN_TYPE.COLLECTION:
        return "registerCollectionAdmin";
      default:
        return "";
    }
  }

  function getParams() {
    switch (props.type) {
      case ADMIN_TYPE.GLOBAL:
        return [address, status];
      case ADMIN_TYPE.FUNCTION:
        return [address, selector, status];
      case ADMIN_TYPE.COLLECTION:
        return [collectionID, address, status];
      default:
        return [];
    }
  }

  const globalAdmin = useGlobalAdmin(account.address as string);
  const functionAdmin = useFunctionAdmin(account.address as string);
  const collectionIndex = useCollectionIndex();
  const collectionAdmin = useCollectionAdmin(
    account.address as string,
    parseInt(collectionIndex.data as string)
  );

  const collectionIds = getCollectionIdsForAddress(
    globalAdmin.data === true,
    functionAdmin.data === true,
    collectionAdmin.data,
    parseInt(collectionIndex.data as string)
  );

  const contractWriteConfig = usePrepareContractWrite({
    address: NEXTGEN_ADMIN.contract as `0x${string}`,
    abi: NEXTGEN_ADMIN.abi,
    chainId: NEXTGEN_CHAIN_ID,
    args: getParams(),
    functionName: getFunctionName(),
    onError(err) {
      alert(err);
      setSubmitting(false);
      setLoading(false);
    },
  });
  const contractWrite = useContractWrite(contractWriteConfig.config);

  function submit() {
    setLoading(true);
    contractWrite.reset();
    const errors = [];

    if (props.type === ADMIN_TYPE.COLLECTION && !collectionID) {
      errors.push("Collection ID is required");
    }
    if (!address) {
      errors.push("Address is required");
    }
    if (props.type === ADMIN_TYPE.FUNCTION && !selector) {
      errors.push("Function Selector is required");
    }

    if (errors.length > 0) {
      setErrors(errors);
      setLoading(false);
    } else {
      setSubmitting(true);
    }
  }

  useEffect(() => {
    if (submitting) {
      contractWrite.write?.();
    }
  }, [submitting]);

  useEffect(() => {
    setLoading(false);
    setSubmitting(false);
  }, [contractWrite.isSuccess || contractWrite.isError]);

  return (
    <Container className="no-padding">
      <Row className="pt-3">
        <Col className="text-center">
          <h3>
            <b>REGISTER / REVOKE {props.type} ADMIN</b>
          </h3>
        </Col>
      </Row>
      <Row className="pt-3">
        <Col>
          <Form>
            {props.type === ADMIN_TYPE.COLLECTION && (
              <Form.Group className="mb-3">
                <Form.Label>Collection ID</Form.Label>
                <Form.Select
                  className={`${styles.formInput}`}
                  value={collectionID}
                  onChange={(e) => {
                    setCollectionID(e.target.value);
                  }}>
                  <option value="" disabled>
                    Select Collection
                  </option>
                  {collectionIds.map((id) => (
                    <option key={`collection-id-${id}`} value={id}>
                      {id}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Admin Address</Form.Label>
              <Form.Control
                type="text"
                placeholder="0x..."
                value={address}
                onChange={(e: any) => setAddress(e.target.value)}
              />
            </Form.Group>
            {props.type === ADMIN_TYPE.FUNCTION && (
              <Form.Group className="mb-3">
                <Form.Label>Function Selector</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="function selector..."
                  value={selector}
                  onChange={(e: any) => setSelector(e.target.value)}
                />
              </Form.Group>
            )}
            <Form.Group className="mb-3">
              <Form.Label>REGISTER / REVOKE</Form.Label>
              <span className="d-flex align-items-center gap-3">
                <Form.Check
                  checked={status}
                  type="radio"
                  label="Register"
                  name="statusRadio"
                  onChange={() => {
                    setStatus(true);
                  }}
                />
                <Form.Check
                  checked={!status}
                  type="radio"
                  label="Revoke"
                  name="statusRadio"
                  onChange={() => {
                    setStatus(false);
                  }}
                />
              </span>
            </Form.Group>
            {!loading && errors.length > 0 && (
              <div className="mb-3">
                <ul>
                  {errors.map((error, index) => (
                    <li key={`error-${index}`} className="text-danger">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Button
              className={`mt-3 mb-3 seize-btn`}
              disabled={submitting || loading}
              onClick={() => submit()}>
              Submit
            </Button>
          </Form>
          <NextGenContractWriteStatus
            isLoading={contractWrite.isLoading}
            hash={contractWrite.data?.hash}
            error={contractWrite.error}
          />
        </Col>
      </Row>
    </Container>
  );
}
