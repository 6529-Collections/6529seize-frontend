import { Container, Row, Col, Button, Form } from "react-bootstrap";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import {
  useGlobalAdmin,
  useFunctionAdmin,
  useCollectionIndex,
  useCollectionAdmin,
  getCollectionIdsForAddress,
  useMinterContractWrite,
} from "../nextgen_helpers";
import { FunctionSelectors } from "../nextgen_contracts";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";
import { printAdminErrors } from "./NextGenAdmin";
import {
  NextGenCollectionIdFormGroup,
  NextGenAdminHeadingRow,
} from "./NextGenAdminShared";
interface Props {
  close: () => void;
}

export default function NextGenAdminAirdropTokens(props: Readonly<Props>) {
  const account = useAccount();

  const globalAdmin = useGlobalAdmin(account.address as string);
  const functionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.AIRDROP_TOKENS
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

  const [recipients, setRecipients] = useState<string[]>([]);
  const [tokenData, setTokenData] = useState<string[]>([]);
  const [salts, setSalts] = useState<string[]>([]);
  const [collectionID, setCollectionID] = useState("");
  const [tokenCounts, setTokenCounts] = useState<string[]>([]);

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const contractWrite = useMinterContractWrite("airDropTokens", () => {
    setSubmitting(false);
    setLoading(false);
  });

  function submit() {
    setLoading(true);
    contractWrite.reset();
    const errors = [];
    if (recipients.length === 0) {
      errors.push("At least one recipient is required");
    }
    if (tokenData.length === 0) {
      errors.push("At least one token data is required");
    }
    if (salts.length === 0) {
      errors.push("At least one salt is required");
    }
    if (!collectionID) {
      errors.push("Collection id is required");
    }
    if (tokenCounts.length === 0) {
      errors.push("At least one token count is required");
    }
    if (
      recipients.length !== tokenData.length ||
      recipients.length !== salts.length ||
      recipients.length !== tokenCounts.length ||
      tokenData.length !== salts.length ||
      tokenData.length !== tokenCounts.length ||
      salts.length !== tokenCounts.length
    ) {
      errors.push(
        "Number of entries for recipients, token data, salts and token counts must all be the same"
      );
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
          recipients,
          tokenData,
          salts,
          collectionID,
          tokenCounts.map((count) => parseInt(count)),
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
      <NextGenAdminHeadingRow title="Airdrop Tokens" close={props.close} />
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
              <Form.Label>Recipients</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="One line per entry"
                value={recipients.join("\n")}
                onChange={(e) => {
                  setRecipients(e.target.value.split("\n"));
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Token Data</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="One line per entry"
                value={tokenData.join("\n")}
                onChange={(e) => {
                  setTokenData(e.target.value.split("\n"));
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Salts</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="One line per entry"
                value={salts.join("\n")}
                onChange={(e) => {
                  setSalts(e.target.value.split("\n"));
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Token Counts</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="One line per entry"
                value={tokenCounts.join("\n")}
                onChange={(e) => {
                  setTokenCounts(e.target.value.split("\n"));
                }}
              />
            </Form.Group>
            {!loading && errors.length > 0 && printAdminErrors(errors)}
            <Button
              className={`mt-3 mb-3 seize-btn`}
              disabled={submitting || loading}
              onClick={() => {
                setLoading(true);
                submit();
              }}>
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
