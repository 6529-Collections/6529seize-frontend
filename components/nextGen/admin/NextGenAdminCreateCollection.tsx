"use client";

import { NULL_MERKLE } from "@/constants/constants";
import { useEffect, useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { useCoreContractWrite } from "../nextgen_helpers";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";
import { printAdminErrors } from "./NextGenAdmin";
import {
  NextGenAdminHeadingRow,
  NextGenAdminScriptsFormGroup,
  NextGenAdminTextFormGroup,
} from "./NextGenAdminShared";

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
  const [dependencyScript, setDependencyScript] = useState<string>(NULL_MERKLE);
  const [scripts, setScripts] = useState<string[]>([]);

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const contractWrite = useCoreContractWrite("createCollection", () => {
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
    if (!dependencyScript) {
      errors.push("Dependency script is required");
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
      contractWrite.writeContract({
        ...contractWrite.params,
        args: [
          collectionName,
          artist,
          description,
          website,
          license,
          baseURI,
          library,
          dependencyScript,
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
            <NextGenAdminTextFormGroup
              title="Collection Name"
              value={collectionName}
              setValue={setCollectionName}
            />
            <NextGenAdminTextFormGroup
              title="Artist"
              value={artist}
              setValue={setArtist}
            />
            <NextGenAdminTextFormGroup
              title="Description"
              value={description}
              setValue={setDescription}
            />
            <NextGenAdminTextFormGroup
              title="Website"
              value={website}
              setValue={setWebsite}
            />
            <NextGenAdminTextFormGroup
              title="License"
              value={license}
              setValue={setLicense}
            />
            <NextGenAdminTextFormGroup
              title="Base URI"
              value={baseURI}
              setValue={setBaseURI}
            />
            <NextGenAdminTextFormGroup
              title="Library"
              value={library}
              setValue={setLibrary}
            />
            <NextGenAdminTextFormGroup
              title="Dependency Script"
              value={dependencyScript}
              setValue={setDependencyScript}
            />
            <NextGenAdminScriptsFormGroup
              scripts={scripts}
              setScripts={setScripts}
            />
            {!loading && errors.length > 0 && printAdminErrors(errors)}
            <Button
              className={`mt-3 mb-3 seize-btn`}
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
    </Container>
  );
}
