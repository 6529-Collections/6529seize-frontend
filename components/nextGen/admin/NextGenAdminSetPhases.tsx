import { Container, Row, Col, Button, Form } from "react-bootstrap";
import { v4 as uuidv4 } from "uuid";
import { useAccount, useSignMessage } from "wagmi";
import { useEffect, useRef, useState } from "react";
import { postFormData } from "../../../services/6529api";
import { FunctionSelectors } from "../nextgen_contracts";
import {
  useGlobalAdmin,
  useFunctionAdmin,
  useCollectionIndex,
  useCollectionAdmin,
  getCollectionIdsForAddress,
  useCollectionPhases,
  useMinterUseContractWrite,
} from "../nextgen_helpers";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";
import { PhaseTimes } from "../nextgen_entities";
import { NULL_MERKLE } from "../../../constants";
import { printAdminErrors } from "./NextGenAdmin";
import {
  NextGenCollectionIdFormGroup,
  NextGenAdminHeadingRow,
} from "./NextGenAdminShared";
interface Props {
  close: () => void;
}

const MARKLE_ZERO_PATTERN = /^0x0+$/;

enum Type {
  ALLOWLIST = "allowlist",
  NO_ALLOWLIST = "no_allowlist",
  EXTERNAL_BURN = "external_burn",
}

export default function NextGenAdminSetPhases(props: Readonly<Props>) {
  const account = useAccount();
  const signMessage = useSignMessage();
  const uuid = useRef(uuidv4()).current;

  const globalAdmin = useGlobalAdmin(account.address as string);
  const functionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.SET_COLLECTION_PHASES
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
  const [allowlistFile, setAllowlistFile] = useState<any>();
  const [allowlistStartTime, setAllowlistStartTime] = useState("");
  const [allowlistEndTime, setAllowlistEndTime] = useState("");
  const [publicStartTime, setPublicStartTime] = useState("");
  const [publicEndTime, setPublicEndTime] = useState("");
  const [merkleRoot, setMerkleRoot] = useState("");
  const [phaseName, setPhaseName] = useState("");
  const [onChainMerkleRoot, setOnChainMerkleRoot] = useState("");

  const [type, setType] = useState(Type.ALLOWLIST);

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string>();

  useCollectionPhases(collectionID, (data: PhaseTimes) => {
    if (collectionID) {
      if (MARKLE_ZERO_PATTERN.test(data.merkle_root)) {
        setOnChainMerkleRoot("");
        setMerkleRoot("");
        setType(Type.NO_ALLOWLIST);
      } else {
        setOnChainMerkleRoot(data.merkle_root);
        setMerkleRoot(data.merkle_root);
        setType(Type.ALLOWLIST);
      }
      setAllowlistStartTime(data.allowlist_start_time.toString());
      setAllowlistEndTime(data.allowlist_end_time.toString());
      setPublicStartTime(data.public_start_time.toString());
      setPublicEndTime(data.public_end_time.toString());
    }
  });

  function clear() {
    setUploadSuccess(false);
    setAllowlistFile(undefined);
    setUploadError("");
    setMerkleRoot("");
    setAllowlistStartTime("");
    setAllowlistEndTime("");
    setPublicStartTime("");
    setPublicEndTime("");
    setErrors([]);
    contractWrite.reset();
  }

  const contractWrite = useMinterUseContractWrite("setCollectionPhases", () => {
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
    if (type != Type.NO_ALLOWLIST) {
      if (!merkleRoot) {
        errors.push("Merkle Root is required");
      }
      if (!allowlistStartTime) {
        errors.push("Allowlist start time is required");
      }
      if (!allowlistEndTime) {
        errors.push("Allowlist ending time is required");
      }
    }
    if (!publicStartTime) {
      errors.push("Public minting time is required");
    }
    if (!publicEndTime) {
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
          type === Type.ALLOWLIST ? publicStartTime : allowlistStartTime,
          type === Type.ALLOWLIST ? publicStartTime : allowlistEndTime,
          publicStartTime,
          publicEndTime,
          type !== Type.NO_ALLOWLIST ? merkleRoot : NULL_MERKLE,
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
          al_type: type,
          phase: phaseName,
        })
      );

      postFormData(
        `${process.env.API_ENDPOINT}/api/nextgen/create_allowlist`,
        formData
      ).then((response) => {
        setUploading(false);
        if (response.status === 200 && response.response.merkle_root) {
          setMerkleRoot(response.response.merkle_root);
          setUploadSuccess(true);
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
      <NextGenAdminHeadingRow
        close={props.close}
        title="Set Collection Minting Phases"
      />
      <Row className="pt-3">
        <Col>
          <Form>
            <NextGenCollectionIdFormGroup
              collection_id={collectionID}
              collection_ids={collectionIds}
              onChange={(id) => {
                clear();
                setCollectionID(id);
              }}
            />
            <Form.Group className="mb-3">
              <span className="d-flex align-items-center gap-3">
                <Form.Check
                  checked={type == Type.ALLOWLIST}
                  type="radio"
                  label="Allowlist"
                  name="hasAllowlistRadio"
                  onChange={() => {
                    setType(Type.ALLOWLIST);
                    setMerkleRoot(onChainMerkleRoot);
                  }}
                />
                <Form.Check
                  checked={type == Type.NO_ALLOWLIST}
                  type="radio"
                  label="No Allowlist"
                  name="hasAllowlistRadio"
                  onChange={() => {
                    setType(Type.NO_ALLOWLIST);
                  }}
                />
                <Form.Check
                  checked={type === Type.EXTERNAL_BURN}
                  type="radio"
                  label="Burn Allowlist"
                  name="hasAllowlistRadio"
                  onChange={() => {
                    setType(Type.EXTERNAL_BURN);
                    setMerkleRoot(onChainMerkleRoot);
                  }}
                />
              </span>
            </Form.Group>
            {type !== Type.NO_ALLOWLIST && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Phase</Form.Label>
                  <Form.Control
                    type="string"
                    placeholder="Phase 1"
                    value={phaseName}
                    onChange={(e: any) => setPhaseName(e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Control
                    type="file"
                    accept={".csv"}
                    value={allowlistFile ? allowlistFile.fileName : ""}
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
                        uploadSuccess
                      }
                      onClick={() => uploadFile()}>
                      Upload
                    </Button>
                    {uploading && (
                      <span>
                        Uploading... Sign Message <code>{uuid}</code> in your
                        wallet...
                      </span>
                    )}
                    {uploadSuccess && (
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
                    placeholder={merkleRoot || "Upload file to generate"}
                    value={merkleRoot}
                    disabled
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Allowlist Start Time</Form.Label>
                  <Form.Control
                    type="integer"
                    placeholder="Unix epoch time"
                    value={allowlistStartTime}
                    onChange={(e: any) => setAllowlistStartTime(e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Allowlist Ending Time</Form.Label>
                  <Form.Control
                    type="integer"
                    placeholder="Unix epoch time"
                    value={allowlistEndTime}
                    onChange={(e: any) => setAllowlistEndTime(e.target.value)}
                  />
                </Form.Group>
              </>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Public Minting Start Time</Form.Label>
              <Form.Control
                type="integer"
                placeholder="Unix epoch time"
                value={publicStartTime}
                onChange={(e: any) => setPublicStartTime(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Public Minting Ending Time</Form.Label>
              <Form.Control
                type="integer"
                placeholder="Unix epoch time"
                value={publicEndTime}
                onChange={(e: any) => setPublicEndTime(e.target.value)}
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
