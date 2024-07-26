import { Container, Row, Col, Button, Form } from "react-bootstrap";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import {
  useCollectionIndex,
  useCollectionArtist,
  isCollectionArtist,
  useCoreContractWrite,
  useParsedCollectionIndex,
} from "../nextgen_helpers";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";
import { areEqualAddresses } from "../../../helpers/Helpers";
import { printAdminErrors } from "./NextGenAdmin";
import {
  NextGenCollectionIdFormGroup,
  NextGenAdminHeadingRow,
} from "./NextGenAdminShared";

interface Props {
  close: () => void;
}

export default function NextGenAdminArtistSignCollection(
  props: Readonly<Props>
) {
  const account = useAccount();

  const collectionIndex = useCollectionIndex();
  const parsedCollectionIndex = useParsedCollectionIndex(collectionIndex);
  const collectionArtists = useCollectionArtist(parsedCollectionIndex);

  function getCollectionIds() {
    const ids: string[] = [];
    if (collectionArtists.data) {
      for (let i = 0; i < collectionArtists.data.length; i++) {
        const artist = collectionArtists.data[i].result;
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
    <Container className="no-padding">
      <NextGenAdminHeadingRow
        close={props.close}
        title="Sign Collection As Artist"
      />
      {isArtist ? (
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
                <Form.Label>Signature</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="signature..."
                  value={signature}
                  onChange={(e: any) => {
                    setSignature(e.target.value);
                  }}
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
              hash={contractWrite.data}
              error={contractWrite.error}
            />
          </Col>
        </Row>
      ) : (
        <Row className="pt-3">
          <Col>
            <b>ONLY COLLECTION ARTISTS CAN USE THIS SECTION.</b>
          </Col>
        </Row>
      )}
    </Container>
  );
}
