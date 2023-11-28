import { Container, Row, Col, Button, Form } from "react-bootstrap";
import { useEffect, useState } from "react";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";
import { printAdminErrors } from "./NextGenAdmin";
import { useCoreUseContractWrite } from "../nextgen_helpers";
import { NextGenAdminHeadingRow } from "./NextGenAdminShared";

interface Props {
  close: () => void;
}

export default function NextGenAdminCreateCollection(props: Readonly<Props>) {
  const [collectionName, setCollectionName] = useState("");
  const [artist, setArtist] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [license, setLicense] = useState("");
  const [baseURI, setBaseURI] = useState("");
  const [library, setLibrary] = useState("");
  const [scripts, setScripts] = useState<string[]>([]);

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const contractWrite = useCoreUseContractWrite("createCollection", () => {
    setSubmitting(false);
    setLoading(false);
  });

  function submit() {
    setLoading(true);
    contractWrite.reset();
    const errors = [];
    if (!collectionName) {
      errors.push("Collection name is required");
    }
    if (!artist) {
      errors.push("Artist is required");
    }
    if (!description) {
      errors.push("Description is required");
    }
    if (!website) {
      errors.push("Website is required");
    }
    if (!license) {
      errors.push("License is required");
    }
    if (!baseURI) {
      errors.push("Base URI is required");
    }
    if (!library) {
      errors.push("Library is required");
    }
    if (scripts.length === 0) {
      errors.push("Script is required");
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
          collectionName,
          artist,
          description,
          website,
          license,
          baseURI,
          library,
          scripts,
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
      <NextGenAdminHeadingRow title="Create Collection" close={props.close} />
      <Row className="pt-3">
        <Col>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Collection Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="my collection"
                value={collectionName}
                onChange={(e: any) => setCollectionName(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Artist</Form.Label>
              <Form.Control
                type="text"
                placeholder="XCOPY"
                value={artist}
                onChange={(e: any) => setArtist(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                type="text"
                placeholder="...description"
                value={description}
                onChange={(e: any) => setDescription(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Website</Form.Label>
              <Form.Control
                type="text"
                placeholder="https://"
                value={website}
                onChange={(e: any) => setWebsite(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>License</Form.Label>
              <Form.Control
                type="text"
                placeholder="...license"
                value={license}
                onChange={(e: any) => setLicense(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Base URI</Form.Label>
              <Form.Control
                type="text"
                placeholder="https://"
                value={baseURI}
                onChange={(e: any) => setBaseURI(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Library</Form.Label>
              <Form.Control
                type="text"
                placeholder="...library"
                value={library}
                onChange={(e: any) => setLibrary(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Scripts x{scripts.length}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="...script - one line per entry"
                value={scripts.join("\n")}
                onChange={(e) => {
                  if (e.target.value) {
                    setScripts(e.target.value.split("\n"));
                  } else {
                    setScripts([]);
                  }
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
            hash={contractWrite.data?.hash}
            error={contractWrite.error}
          />
        </Col>
      </Row>
    </Container>
  );
}
