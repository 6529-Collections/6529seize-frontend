"use client";

import { publicEnv } from "@/config/env";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useSignMessage } from "wagmi";
import { postFormData } from "@/services/6529api";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import {
  buildNextgenAdminSignatureMessage,
  isStructuredSignaturesEnabled,
} from "@/services/wallet-signatures/structured-wallet-signatures";
import { FunctionSelectors, NEXTGEN_CHAIN_ID } from "../nextgen_contracts";
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
  Button,
  Col,
  Container,
  Form,
  NextGenAdminHeadingRow,
  NextGenCollectionIdFormGroup,
  Row,
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
  const signatureMessageRef = useRef<string | null>(null);
  const signedPayloadRef = useRef<ReturnType<
    typeof buildNextgenAllowlistPayload
  > | null>(null);
  const signerAddressRef = useRef<string | null>(null);

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
    globalAdmin.data === true,
    functionAdmin.data === true,
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
    signatureMessageRef.current = null;
    signedPayloadRef.current = null;
    signerAddressRef.current = null;
  }

  function uploadFile() {
    setUploadError(undefined);
    signMessage.reset();
    setUploading(true);
    signatureMessageRef.current = null;
    signedPayloadRef.current = null;
    signerAddressRef.current = null;
    const signerAddress = account.address;
    if (!signerAddress) {
      setUploading(false);
      setUploadError("Error: Connect a wallet before signing");
      return;
    }
    const payload = buildNextgenAllowlistPayload();
    signedPayloadRef.current = payload;
    signerAddressRef.current = signerAddress;
    const signatureMessage = isStructuredSignaturesEnabled()
      ? buildNextgenAdminSignatureMessage({
          address: signerAddress,
          chainId: NEXTGEN_CHAIN_ID,
          payload,
        }).message
      : null;
    signatureMessageRef.current = signatureMessage;
    signMessage.signMessage({
      message: signatureMessage ?? uuid,
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
      const signerAddress = signerAddressRef.current;
      if (!signerAddress) {
        setUploading(false);
        setUploadError("Error: Connect a wallet before signing");
        return;
      }
      const formData = new FormData();
      formData.append("allowlist", allowlistFile);
      formData.append(
        "nextgen",
        JSON.stringify({
          wallet: signerAddress,
          signature: signMessage.data,
          ...(signatureMessageRef.current
            ? { signature_message: signatureMessageRef.current }
            : {}),
          ...(signedPayloadRef.current ?? buildNextgenAllowlistPayload()),
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

  function buildNextgenAllowlistPayload() {
    return {
      collection_id: Number(collectionID),
      uuid,
      al_type: type,
      phase: phaseName,
      start_time: Number(allowlistStartTime),
      end_time: Number(allowlistEndTime),
      mint_price: Number(mintPrice),
    };
  }

  return (
    <Container className="!tw-p-0">
      <NextGenAdminHeadingRow close={props.close} title="UPLOAD ALLOWLIST" />
      <Row className="tw-pt-4">
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
            <Form.Group className="tw-mb-4">
              <span className="tw-flex tw-items-center tw-gap-4">
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

            <Form.Group className="tw-mb-4">
              <Form.Label>Phase</Form.Label>
              <Form.Control
                type="string"
                placeholder="...Phase name"
                value={phaseName}
                onChange={(e) => setPhaseName(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="tw-mb-4">
              <Form.Control
                type="file"
                accept={".csv"}
                value={allowlistFile ? allowlistFile.fileName : ""}
                onChange={(e) => {
                  if (e.target.files) {
                    const f = e.target.files[0];
                    setAllowlistFile(f);
                  }
                }}
              />
            </Form.Group>
            <Form.Group className="tw-mb-4">
              <Form.Label>Allowlist Start Time</Form.Label>
              <Form.Control
                type="integer"
                placeholder="Unix epoch time"
                value={allowlistStartTime}
                onChange={(e) => setAllowlistStartTime(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="tw-mb-4">
              <Form.Label>Allowlist end Time</Form.Label>
              <Form.Control
                type="integer"
                placeholder="Unix epoch time"
                value={allowlistEndTime}
                onChange={(e) => setAllowlistEndTime(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="tw-mb-4">
              <Form.Label>Mint Price (ETH)</Form.Label>
              <Form.Control
                type="integer"
                placeholder="...0.06529"
                value={mintPrice}
                onChange={(e) => setMintPrice(e.target.value)}
              />
            </Form.Group>
            {!uploading && errors.length > 0 && printAdminErrors(errors)}
            <div className="tw-mt-6 tw-flex tw-items-center tw-gap-4">
              <Button
                className="tw-rounded-none tw-border-0 tw-px-5 tw-py-1.5 tw-font-bold disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
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
              {uploadSuccess && (
                <span className="tw-text-success">Uploaded</span>
              )}
              {!uploading && uploadError && (
                <span className="tw-text-error">{uploadError}</span>
              )}
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}
