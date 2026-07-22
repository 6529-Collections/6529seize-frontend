"use client";

import { useEffect, useState } from "react";
import {
  useCollectionIndex,
  useCollectionArtist,
  isCollectionArtist,
  useCoreContractWrite,
  useParsedCollectionIndex,
} from "../nextgen_helpers";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";
import { areEqualAddresses } from "@/helpers/Helpers";
import { printAdminErrors } from "./NextGenAdminErrors";
import {
  Button,
  Col,
  Container,
  Form,
  NextGenCollectionIdFormGroup,
  NextGenAdminHeadingRow,
  Row,
} from "./NextGenAdminShared";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";

interface Props {
  close: () => void;
}

export default function NextGenAdminArtistSignCollection(
  props: Readonly<Props>
) {
  const account = useSeizeConnectContext();

  const collectionIndex = useCollectionIndex();
  const parsedCollectionIndex = useParsedCollectionIndex(collectionIndex);
  const collectionArtists = useCollectionArtist(parsedCollectionIndex);

  function getCollectionIds() {
    const ids: string[] = [];
    if (collectionArtists.data) {
      for (let i = 0; i < collectionArtists.data.length; i++) {
        const artist = collectionArtists.data[i]?.result;
        if (areEqualAddresses(artist, account.address)) {
          ids.push((i + 1).toString());
        }
      }
    }
    return ids;
  }

  const isArtist = isCollectionArtist(
    account.address as string,
    collectionArtists
  );

  const collectionIds = getCollectionIds();

  const [collectionID, setCollectionID] = useState("");
  const [signature, setSignature] = useState("");

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const contractWrite = useCoreContractWrite("artistSignature", () => {
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
    if (!signature) {
      errors.push("Signature is required");
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
        args: [collectionID, signature],
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
    <Container className="!tw-p-0">
      <NextGenAdminHeadingRow
        close={props.close}
        title="Sign Collection As Artist"
      />
      {isArtist ? (
        <Row className="tw-pt-4">
          <Col>
            <Form>
              <NextGenCollectionIdFormGroup
                collection_id={collectionID}
                collection_ids={collectionIds}
                onChange={(id) => {
                  setCollectionID(id);
                }}
              />
              <Form.Group className="tw-mb-4">
                <Form.Label>Signature</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="signature..."
                  value={signature}
                  onChange={(e) => {
                    setSignature(e.target.value);
                  }}
                />
              </Form.Group>
              {!loading && errors.length > 0 && printAdminErrors(errors)}
              <Button
                className={`tw-mb-4 tw-mt-4 tw-rounded-none tw-border-0 tw-px-5 tw-py-1.5 tw-font-bold disabled:tw-cursor-not-allowed disabled:tw-opacity-60`}
                disabled={submitting || loading}
                onClick={() => submit()}
              >
                Submit
              </Button>
            </Form>
            <NextGenContractWriteStatus
              isLoading={contractWrite.isLoading}
              hash={contractWrite.data}
              error={contractWrite.error}
            />
          </Col>
        </Row>
      ) : (
        <Row className="tw-pt-4">
          <Col>
            <b>ONLY COLLECTION ARTISTS CAN USE THIS SECTION.</b>
          </Col>
        </Row>
      )}
    </Container>
  );
}
