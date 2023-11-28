import { Container, Row, Col, Button, Form } from "react-bootstrap";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { FunctionSelectors } from "../nextgen_contracts";
import {
  useGlobalAdmin,
  useFunctionAdmin,
  useCollectionIndex,
  getCollectionIdsForAddress,
  getMinterUseContractWrite,
} from "../nextgen_helpers";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";
import { printAdminErrors } from "./NextGenAdmin";
import {
  NextGenCollectionIdFormGroup,
  NextGenAdminHeadingRow,
} from "./NextGenAdminShared";

export enum ProposalType {
  PRIMARY = "Primary",
  SECONDARY = "Secondary",
}

interface Props {
  type: ProposalType;
  close: () => void;
}

function getFunctionSelector(type: ProposalType) {
  switch (type) {
    case ProposalType.PRIMARY:
      return FunctionSelectors.PROPOSE_PRIMARY_ADDRESSES_AND_PERCENTAGES;
    case ProposalType.SECONDARY:
      return FunctionSelectors.PROPOSE_SECONDARY_ADDRESSES_AND_PERCENTAGES;
    default:
      return "";
  }
}

export default function NextGenAdminProposeAddressesAndPercentages(
  props: Readonly<Props>
) {
  const account = useAccount();

  const globalAdmin = useGlobalAdmin(account.address as string);
  const functionAdmin = useFunctionAdmin(
    account.address as string,
    getFunctionSelector(props.type)
  );

  const collectionIndex = useCollectionIndex();

  const collectionIds = getCollectionIdsForAddress(
    globalAdmin.data === true,
    functionAdmin.data === true,
    undefined,
    parseInt(collectionIndex?.data as string)
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

  const contractWrite = getMinterUseContractWrite(getFunctionName(), () => {
    setSubmitting(false);
    setLoading(false);
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
      <NextGenAdminHeadingRow
        close={props.close}
        title={`Propose ${props.type} Addresses and Percentages`}
      />
      <Row className="pt-3">
        <Col>
          <Form>
            <NextGenCollectionIdFormGroup
              collection_id={collectionID}
              collection_ids={collectionIds}
              onChange={(id) => {
                setCollectionID(id);
              }}
            />
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
