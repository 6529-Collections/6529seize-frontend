import { Container, Row, Col, Button, Form } from "react-bootstrap";
import { useEffect, useState } from "react";
import { FunctionSelectors } from "../nextgen_contracts";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";

import {
  useGlobalAdmin,
  useCollectionIndex,
  getCollectionIdsForAddress,
  useAdminContractWrite,
  useParsedCollectionIndex,
} from "../nextgen_helpers";
import { printAdminErrors } from "./NextGenAdmin";
import {
  NextGenCollectionIdFormGroup,
  NextGenAdminHeadingRow,
  NextGenAdminTextFormGroup,
} from "./NextGenAdminShared";
import { useSeizeConnectContext } from "../../auth/SeizeConnectContext";

export enum ADMIN_TYPE {
  GLOBAL = "GLOBAL",
  FUNCTION = "FUNCTION",
  COLLECTION = "COLLECTION",
}

interface Props {
  close: () => void;
  type: ADMIN_TYPE;
}

export default function NextGenAdminRegisterAdmin(props: Readonly<Props>) {
  const account = useSeizeConnectContext();

  const [collectionID, setCollectionID] = useState("");
  const [address, setAddress] = useState("");
  const [selectors, setSelectors] = useState<string[]>([]);
  const [status, setStatus] = useState<boolean>(true);

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function getFunctionName() {
    switch (props.type) {
      case ADMIN_TYPE.GLOBAL:
        return "registerAdmin";
      case ADMIN_TYPE.FUNCTION:
        return "registerBatchFunctionAdmin";
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
        return [address, selectors, status];
      case ADMIN_TYPE.COLLECTION:
        return [collectionID, address, status];
      default:
        return [];
    }
  }

  const globalAdmin = useGlobalAdmin(account.address as string);
  const collectionIndex = useCollectionIndex();
  const parsedCollectionIndex = useParsedCollectionIndex(collectionIndex);
  const collectionIds = getCollectionIdsForAddress(
    (globalAdmin.data as any) === true,
    false,
    undefined,
    parsedCollectionIndex
  );

  const contractWrite = useAdminContractWrite(getFunctionName(), () => {
    setSubmitting(false);
    setLoading(false);
  });

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
    if (props.type === ADMIN_TYPE.FUNCTION && selectors.length === 0) {
      errors.push("At least one Function Selector is required");
    }
    if (status === undefined) {
      errors.push("Select Register or Revoke");
    }

    if (errors.length > 0) {
      setErrors(errors);
      setLoading(false);
    } else {
      setErrors([]);
      setSubmitting(true);
    }
  }

  useEffect(() => {
    if (submitting) {
      contractWrite.writeContract({
        ...contractWrite.params,
        args: getParams(),
      });
    }
  }, [submitting]);

  useEffect(() => {
    if (contractWrite.isSuccess || contractWrite.isError) {
      setLoading(false);
      setSubmitting(false);
    }
  }, [contractWrite.isSuccess || contractWrite.isError]);

  return (
    <Container className="no-padding">
      <NextGenAdminHeadingRow
        close={props.close}
        title={`Register / Revoke ${props.type} Admin`}
      />
      <Row className="pt-3">
        <Col>
          <Form>
            {props.type === ADMIN_TYPE.COLLECTION && (
              <NextGenCollectionIdFormGroup
                collection_id={collectionID}
                collection_ids={collectionIds}
                onChange={(id) => {
                  setCollectionID(id);
                }}
              />
            )}
            <NextGenAdminTextFormGroup
              title="Admin Address"
              value={address}
              setValue={setAddress}
            />
            {props.type === ADMIN_TYPE.FUNCTION && (
              <Form.Group className="mb-3">
                <Form.Label>Function Selector</Form.Label>
                <Form.Control
                  as="select"
                  multiple
                  value={selectors}
                  onChange={(e: any) => {
                    if (selectors.includes(e.target.value)) {
                      setSelectors((selectors) =>
                        selectors.filter(
                          (selector) => selector !== e.target.value
                        )
                      );
                    } else {
                      setSelectors((selectors) => [
                        ...selectors,
                        e.target.value,
                      ]);
                    }
                  }}>
                  {Object.entries(FunctionSelectors).map(([key, value]) => (
                    <option key={key} value={value}>
                      {key} - {value}
                    </option>
                  ))}
                </Form.Control>
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
                  checked={status === false}
                  type="radio"
                  label="Revoke"
                  name="statusRadio"
                  onChange={() => {
                    setStatus(false);
                  }}
                />
              </span>
            </Form.Group>
            {!loading && errors.length > 0 && printAdminErrors(errors)}
            <Button
              className={`mt-3 mb-3 seize-btn`}
              disabled={submitting || loading}
              onClick={() => submit()}>
              Submit
            </Button>
          </Form>
          <NextGenContractWriteStatus
            isLoading={contractWrite.isLoading}
            hash={contractWrite.data}
            error={contractWrite}
          />
        </Col>
      </Row>
    </Container>
  );
}
