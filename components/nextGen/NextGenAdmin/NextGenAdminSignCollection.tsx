import { Container, Row, Col, Button, Form } from "react-bootstrap";
import styles from "./NextGenAdmin.module.scss";
import {
  useAccount,
  useContractWrite,
  usePrepareContractWrite,
  useSignMessage,
} from "wagmi";
import { useEffect, useState } from "react";
import { NEXTGEN_CHAIN_ID, NEXTGEN_CORE } from "../contracts";
import {
  useGlobalAdmin,
  useFunctionAdmin,
  useCollectionIndex,
  useCollectionAdmin,
  getCollectionIdsForAddress,
} from "./admin_helpers";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";

export default function NextGenAdminSignCollection() {
  const account = useAccount();
  const signMessage = useSignMessage();

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

  const [collectionID, setCollectionID] = useState("");
  const [signature, setSignature] = useState("");
  const [signedMessage, setSignedMessage] = useState("");

  const [errors, setErrors] = useState<string[]>([]);
  const [signing, setSigning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [signError, setSignError] = useState<string>();

  const contractWriteConfig = usePrepareContractWrite({
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    args: [collectionID, signature],
    functionName: submitting ? "artistSignature" : "",
    onError(err) {
      alert(err);
      setSubmitting(false);
      setLoading(false);
    },
  });
  const contractWrite = useContractWrite(contractWriteConfig.config);

  function submit() {
    setLoading(true);
    const errors = [];
    if (!collectionID) {
      errors.push("Collection id is required");
    }
    if (!signature) {
      errors.push("Signature is required");
    }
    if (!signedMessage) {
      errors.push("Signed message is required");
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

  function sign() {
    setSignError(undefined);
    setSignedMessage("");
    signMessage.reset();
    setSigning(true);
    signMessage.signMessage({
      message: signature,
    });
  }

  useEffect(() => {
    if (signMessage.isError) {
      setSigning(false);
      setSignError(`Error: ${signMessage.error?.message.split(".")[0]}`);
    }
  }, [signMessage.isError]);

  useEffect(() => {
    if (signMessage.isSuccess && signMessage.data) {
      setSigning(false);
      setSignedMessage(signMessage.data);
    }
  }, [signMessage.data]);

  return (
    <Container className="no-padding">
      <Row className="pt-3">
        <Col className="text-center">
          <h3>
            <b>SIGN COLLECTION AS ARTIST</b>
          </h3>
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
              <Form.Label>Signature</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="signature..."
                value={signature}
                onChange={(e: any) => {
                  setSignedMessage("");
                  setSignature(e.target.value);
                }}
              />
              <div className="d-flex align-items-center mt-3 gap-3">
                <Button
                  className="seize-btn"
                  disabled={!signature}
                  onClick={() => sign()}>
                  Sign
                </Button>
                {signing && <span>Signing...</span>}
                {!signing && signedMessage && (
                  <span className="text-success">Signed</span>
                )}
                {!signing && signError && (
                  <span className="text-danger">{signError}</span>
                )}
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Signed Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Sign message above"
                value={signedMessage}
                disabled={true}
              />
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
              disabled={submitting || loading || !signedMessage}
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
