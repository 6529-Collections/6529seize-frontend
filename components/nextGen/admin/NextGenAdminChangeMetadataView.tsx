import { Container, Row, Col, Button, Form } from "react-bootstrap";
import { useAccount, useContractRead } from "wagmi";
import { useEffect, useState } from "react";
import {
  FunctionSelectors,
  NEXTGEN_CHAIN_ID,
  NEXTGEN_CORE,
} from "../nextgen_contracts";
import {
  useGlobalAdmin,
  useFunctionAdmin,
  useCollectionIndex,
  useCollectionAdmin,
  getCollectionIdsForAddress,
  getCoreUseContractWrite,
} from "../nextgen_helpers";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";
import { printAdminErrors } from "./NextGenAdmin";
import {
  NextGenCollectionIdFormGroup,
  NextGenAdminHeadingRow,
} from "./NextGenAdminShared";

interface Props {
  close: () => void;
}

export default function NextGenAdminChangeMetadataView(props: Readonly<Props>) {
  const account = useAccount();

  const globalAdmin = useGlobalAdmin(account.address as string);
  const functionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.CHANGE_METADATA_VIEW
  );
  const collectionIndex = useCollectionIndex();
  const collectionAdmin = useCollectionAdmin(
    account.address as string,
    parseInt(collectionIndex?.data as string)
  );

  const collectionIds = getCollectionIdsForAddress(
    globalAdmin.data === true,
    functionAdmin.data === true,
    collectionAdmin.data,
    parseInt(collectionIndex?.data as string)
  );

  const [collectionID, setCollectionID] = useState("");
  const [status, setStatus] = useState<boolean>();

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useContractRead({
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "onchainMetadata",
    args: [collectionID],
    enabled: !!collectionID,
    onSettled(data: any, error: any) {
      setStatus(data);
    },
  });

  const contractWrite = getCoreUseContractWrite("updateBaseURI", () => {
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
    if (status === undefined) {
      errors.push("Metadata view is required");
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
        args: [collectionID, status],
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
        title="Change Metadata View"
        close={props.close}
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
              <Form.Label>Metadata View</Form.Label>
              <span className="d-flex align-items-center gap-3">
                <Form.Check
                  checked={status}
                  type="radio"
                  label="On Chain"
                  name="statusRadio"
                  onChange={() => {
                    setStatus(true);
                  }}
                />
                <Form.Check
                  checked={status === false}
                  type="radio"
                  label="Off Chain"
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
            hash={contractWrite.data?.hash}
            error={contractWrite.error}
          />
        </Col>
      </Row>
    </Container>
  );
}
