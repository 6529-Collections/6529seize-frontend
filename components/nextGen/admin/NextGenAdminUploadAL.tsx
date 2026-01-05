"use client";

import { publicEnv } from "@/config/env";
import { useEffect, useRef, useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { v4 as uuidv4 } from "uuid";
import { useSignMessage } from "wagmi";
import { postFormData } from "@/services/6529api";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { FunctionSelectors } from "../nextgen_contracts";
import {
  getCollectionIdsForAddress,
  useCollectionAdmin,
  useCollectionIndex,
  useFunctionAdmin,
  useGlobalAdmin,
  useParsedCollectionIndex,
} from "../nextgen_helpers";
import { printAdminErrors } from "./NextGenAdmin";
import {
  NextGenAdminHeadingRow,
  NextGenCollectionIdFormGroup,
} from "./NextGenAdminShared";
interface Props {
  close: () => void;
}

enum Type {
  ALLOWLIST = "allowlist",
  NO_ALLOWLIST = "no_allowlist",
  EXTERNAL_BURN = "external_burn",
}

export default function NextGenAdminUploadAL(props: Readonly<Props>) {
  const account = useSeizeConnectContext();
  const signMessage = useSignMessage();
  const uuid = useRef(uuidv4()).current;

  const globalAdmin = useGlobalAdmin(account.address as string);
  const functionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.SET_COLLECTION_PHASES
  );
  const collectionIndex = useCollectionIndex();
  const parsedCollectionIndex = useParsedCollectionIndex(collectionIndex);
  const collectionAdmin = useCollectionAdmin(
    account.address as string,
    parsedCollectionIndex
  );
  const collectionIds = getCollectionIdsForAddress(
    (globalAdmin.data as any) === true,
    (functionAdmin.data as any) === true,
    collectionAdmin.data,
    parsedCollectionIndex
  );

  const [collectionID, setCollectionID] = useState("");
  const [allowlistFile, setAllowlistFile] = useState<any>();
  const [allowlistStartTime, setAllowlistStartTime] = useState("");
  const [allowlistEndTime, setAllowlistEndTime] = useState("");
  const [phaseName, setPhaseName] = useState("");
  const [mintPrice, setMintPrice] = useState("");

  const [type, setType] = useState(Type.ALLOWLIST);

  const [errors, setErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string>();

  function clear() {
    setUploadSuccess(false);
    setAllowlistFile(undefined);
    setUploadError("");
    setAllowlistStartTime("");
    setAllowlistEndTime("");
    setErrors([]);
  }

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
          start_time: Number(allowlistStartTime),
          end_time: Number(allowlistEndTime),
          mint_price: Number(mintPrice),
        })
      );

      postFormData(
        `${publicEnv.API_ENDPOINT}/api/nextgen/create_allowlist`,
        formData
      ).then((response) => {
        setUploading(false);
        if (response.status === 200 && response.response.merkle_root) {
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
      <NextGenAdminHeadingRow close={props.close} title="UPLOAD ALLOWLIST" />
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
                  }}
                />
                <Form.Check
                  checked={type === Type.EXTERNAL_BURN}
                  type="radio"
                  label="Burn Allowlist"
                  name="hasAllowlistRadio"
                  onChange={() => {
                    setType(Type.EXTERNAL_BURN);
                  }}
                />
              </span>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Phase</Form.Label>
              <Form.Control
                type="string"
                placeholder="...Phase name"
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
              <Form.Label>Allowlist end Time</Form.Label>
              <Form.Control
                type="integer"
                placeholder="Unix epoch time"
                value={allowlistEndTime}
                onChange={(e: any) => setAllowlistEndTime(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mint Price (ETH)</Form.Label>
              <Form.Control
                type="integer"
                placeholder="...0.06529"
                value={mintPrice}
                onChange={(e: any) => setMintPrice(e.target.value)}
              />
            </Form.Group>
            {!uploading && errors.length > 0 && printAdminErrors(errors)}
            <div className="d-flex align-items-center mt-4 gap-3">
              <Button
                className="seize-btn"
                disabled={
                  !collectionID ||
                  !allowlistFile ||
                  !allowlistStartTime ||
                  !allowlistEndTime ||
                  !phaseName ||
                  !mintPrice ||
                  uploading ||
                  uploadSuccess
                }
                onClick={() => uploadFile()}
              >
                Upload
              </Button>
              {uploading && (
                <span>
                  Uploading... Sign Message <code>{uuid}</code> in your
                  wallet...
                </span>
              )}
              {uploadSuccess && <span className="text-success">Uploaded</span>}
              {!uploading && uploadError && (
                <span className="text-danger">{uploadError}</span>
              )}
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}
