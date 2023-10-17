import { Container, Row, Col, Button, Form } from "react-bootstrap";
import { v4 as uuidv4 } from "uuid";
import styles from "./NextGenAdmin.module.scss";
import { useAccount, useContractWrite, useSignMessage } from "wagmi";
import { useEffect, useState } from "react";
import { postFormData } from "../../../services/6529api";
import {
  NEXTGEN_MINTER,
  NEXTGEN_CHAIN_ID,
  FunctionSelectors,
} from "../contracts";
import {
  useGlobalAdmin,
  useFunctionAdmin,
  useCollectionIndex,
  useCollectionAdmin,
  getCollectionIdsForAddress,
} from "./admin_helpers";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Props {
  close: () => void;
}

export default function NextGenAdminSetPhases(props: Props) {
  const account = useAccount();
  const signMessage = useSignMessage();

  const [uuid, setuuid] = useState(uuidv4());

  const globalAdmin = useGlobalAdmin(account.address as string);
  const functionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.SET_COLLECTION_PHASES
  );
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
  const [allowlistFile, setAllowlistFile] = useState<any>();
  const [collectionAllowlistStartTime, setCollectionAllowlistStartTime] =
    useState("");
  const [collectionAllowlistEndTime, setCollectionAllowlistEndTime] =
    useState("");
  const [collectionPublicStartTime, setCollectionPublicStartTime] =
    useState("");
  const [collectionPublicEndTime, setCollectionPublicEndTime] = useState("");
  const [merkleRoot, setMerkleRoot] = useState("");

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [uploadError, setUploadError] = useState<string>();

  const contractWrite = useContractWrite({
    address: NEXTGEN_MINTER.contract as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "setCollectionPhases",
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
    if (!merkleRoot) {
      errors.push("Merkle Root is required");
    }
    if (!collectionAllowlistStartTime) {
      errors.push("Allowlist start time is required");
    }
    if (!collectionAllowlistEndTime) {
      errors.push("Allowlist ending time is required");
    }
    if (!collectionPublicStartTime) {
      errors.push("Public minting time is required");
    }
    if (!collectionPublicEndTime) {
      errors.push("Public minting end time is required");
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
          collectionAllowlistStartTime,
          collectionAllowlistEndTime,
          collectionPublicStartTime,
          collectionPublicEndTime,
          merkleRoot,
        ],
      });
    }
  }, [submitting]);

  useEffect(() => {
    setLoading(false);
    setSubmitting(false);
  }, [contractWrite.isSuccess || contractWrite.isError]);

  function uploadFile() {
    setUploadError(undefined);
    signMessage.reset();
    setUploading(true);
    signMessage.signMessage({
      message: uuid,
    });
  }

  useEffect(() => {
    if (signMessage.isError) {
      setUploading(false);
      setUploadError(`Error: ${signMessage.error?.message.split(".")[0]}`);
    }
  }, [signMessage.isError]);

  useEffect(() => {
    if (signMessage.isSuccess && signMessage.data) {
      const formData = new FormData();
      formData.append("allowlist", allowlistFile);
      formData.append(
        "nextgen",
        JSON.stringify({
          collection_id: collectionID,
          wallet: account.address as string,
          signature: signMessage.data,
          uuid: uuid,
        })
      );

      postFormData(
        `${process.env.SEIZE_API_ENDPOINT}/nextgen/create_allowlist`,
        formData
      ).then((response) => {
        setUploading(false);
        if (response.status === 200 && response.response.merkle_root) {
          setMerkleRoot(response.response.merkle_root);
        } else {
          setUploadError(
            `Error: ${
              response.response.error
                ? response.response.error
                : "Unknown error"
            }`
          );
        }
      });
    }
  }, [signMessage.data]);

  return (
    <Container className="no-padding">
      <Row className="pt-3">
        <Col className="d-flex align-items-center justify-content-between">
          <h3>
            <b>SET COLLECTION MINTING PHASES</b>
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
              <Form.Label>Allowlist</Form.Label>
              <Form.Control
                type="file"
                accept={".csv"}
                value={allowlistFile?.fileName}
                onChange={(e: any) => {
                  if (e.target.files) {
                    const f = e.target.files[0];
                    setAllowlistFile(f);
                  }
                }}
              />
              <div className="d-flex align-items-center mt-3 gap-3">
                <Button
                  className="seize-btn"
                  disabled={
                    !collectionID ||
                    !allowlistFile ||
                    uploading ||
                    merkleRoot != ""
                  }
                  onClick={() => uploadFile()}>
                  Upload
                </Button>
                {uploading && <span>Uploading...</span>}
                {!uploading && merkleRoot && (
                  <span className="text-success">Uploaded</span>
                )}
                {!uploading && uploadError && (
                  <span className="text-danger">{uploadError}</span>
                )}
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Merkle Root</Form.Label>
              <Form.Control
                type="text"
                placeholder={
                  merkleRoot ? merkleRoot : "Upload file to generate"
                }
                value={merkleRoot}
                disabled
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Allowlist Start Time</Form.Label>
              <Form.Control
                type="integer"
                placeholder="Unix epoch time"
                value={collectionAllowlistStartTime}
                onChange={(e: any) =>
                  setCollectionAllowlistStartTime(e.target.value)
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Allowlist Ending Time</Form.Label>
              <Form.Control
                type="integer"
                placeholder="Unix epoch time"
                value={collectionAllowlistEndTime}
                onChange={(e: any) =>
                  setCollectionAllowlistEndTime(e.target.value)
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Public Minting Start Time</Form.Label>
              <Form.Control
                type="integer"
                placeholder="Unix epoch time"
                value={collectionPublicStartTime}
                onChange={(e: any) =>
                  setCollectionPublicStartTime(e.target.value)
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Public Minting Ending Time</Form.Label>
              <Form.Control
                type="integer"
                placeholder="Unix epoch time"
                value={collectionPublicEndTime}
                onChange={(e: any) =>
                  setCollectionPublicEndTime(e.target.value)
                }
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
