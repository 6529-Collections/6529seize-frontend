import { Container, Row, Col, Button, Form } from "react-bootstrap";
import styles from "./NextGenAdmin.module.scss";
import { useAccount, useContractWrite } from "wagmi";
import { useEffect, useState } from "react";
import {
  FunctionSelectors,
  NEXTGEN_CHAIN_ID,
  NEXTGEN_MINTER,
} from "../nextgen_contracts";
import {
  useGlobalAdmin,
  useFunctionAdmin,
  useCollectionIndex,
  getCollectionIdsForAddress,
} from "../nextgen_helpers";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { printAdminErrors } from "./NextGenAdmin";

export enum ProposalType {
  PRIMARY = "Primary",
  SECONDARY = "Secondary",
}

interface Props {
  type: ProposalType;
  close: () => void;
}

export default function NextGenAdminProposeAddressesAndPercentages(
  props: Readonly<Props>
) {
  const account = useAccount();

  const globalAdmin = useGlobalAdmin(account.address as string);
  const functionAdmin = useFunctionAdmin(
    account.address as string,
    props.type === ProposalType.PRIMARY
      ? FunctionSelectors.PROPOSE_PRIMARY_ADDRESSES_AND_PERCENTAGES
      : props.type === ProposalType.SECONDARY
      ? FunctionSelectors.PROPOSE_SECONDARY_ADDRESSES_AND_PERCENTAGES
      : ""
  );

  const collectionIndex = useCollectionIndex();

  const collectionIds = getCollectionIdsForAddress(
    globalAdmin.data === true,
    functionAdmin.data === true,
    undefined,
    parseInt(collectionIndex.data as string)
  );

  const [collectionID, setCollectionID] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [address3, setAddress3] = useState("");
  const [percentage1, setPercentage1] = useState("");
  const [percentage2, setPercentage2] = useState("");
  const [percentage3, setPercentage3] = useState("");

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function getFunctionName() {
    switch (props.type) {
      case ProposalType.PRIMARY:
        return "proposePrimaryAddressesAndPercentages";
      case ProposalType.SECONDARY:
        return "proposeSecondaryAddressesAndPercentages";
      default:
        return "";
    }
  }

  const contractWrite = useContractWrite({
    address: NEXTGEN_MINTER.contract as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: getFunctionName(),
    onError() {
      setSubmitting(false);
      setLoading(false);
    },
  });

  function submit() {
    setLoading(true);
    contractWrite.reset();
    const errors = [];
    if (!collectionID) {
      errors.push("Collection id is required");
    }
    if (!address1) {
      errors.push("Primary address 1 is required");
    }
    if (!address2) {
      errors.push("Primary address 2 is required");
    }
    if (!address3) {
      errors.push("Primary address 3 is required");
    }
    if (!percentage1) {
      errors.push("Percentage 1 is required");
    }
    if (!percentage2) {
      errors.push("Percentage 2 is required");
    }
    if (!percentage3) {
      errors.push("Percentage 3 is required");
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
      contractWrite.write({
        args: [
          collectionID,
          address1,
          address2,
          address3,
          percentage1,
          percentage2,
          percentage3,
        ],
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
      <Row className="pt-3">
        <Col className="d-flex align-items-center justify-content-between">
          <h3>
            <b>PROPOSE {props.type.toUpperCase()} ADDRESSES AND PERCENTAGES</b>
          </h3>
          <FontAwesomeIcon
            className={styles.closeIcon}
            icon="times-circle"
            onClick={() => {
              props.close();
            }}></FontAwesomeIcon>
        </Col>
      </Row>
      <Row className="pt-3">
        <Col>
          <Form>
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
            <Form.Group className="mb-3">
              <Form.Label>{props.type} Address 1</Form.Label>
              <Form.Control
                type="text"
                placeholder="0x..."
                value={address1}
                onChange={(e: any) => setAddress1(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{props.type} Address 2</Form.Label>
              <Form.Control
                type="text"
                placeholder="0x..."
                value={address2}
                onChange={(e: any) => setAddress2(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{props.type} Address 3</Form.Label>
              <Form.Control
                type="text"
                placeholder="0x..."
                value={address3}
                onChange={(e: any) => setAddress3(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{props.type} Percentage 1</Form.Label>
              <Form.Control
                type="text"
                placeholder="...percentage"
                value={percentage1}
                onChange={(e: any) => setPercentage1(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{props.type} Percentage 2</Form.Label>
              <Form.Control
                type="text"
                placeholder="...percentage"
                value={percentage2}
                onChange={(e: any) => setPercentage2(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{props.type} Percentage 3</Form.Label>
              <Form.Control
                type="text"
                placeholder="...percentage"
                value={percentage3}
                onChange={(e: any) => setPercentage3(e.target.value)}
              />
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
            hash={contractWrite.data?.hash}
            error={contractWrite.error}
          />
        </Col>
      </Row>
    </Container>
  );
}
