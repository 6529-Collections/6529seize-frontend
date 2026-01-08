"use client";

import { Container, Row, Col, Button, Form } from "react-bootstrap";
import { useEffect, useState } from "react";
import { FunctionSelectors } from "../nextgen_contracts";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";
import {
  getCollectionIdsForAddress,
  useCoreContractWrite,
  useCollectionInfo,
  useCollectionLibraryAndScript,
  useCollectionAdmin,
  useCollectionIndex,
  useFunctionAdmin,
  useGlobalAdmin,
  useParsedCollectionIndex,
} from "../nextgen_helpers";
import type { Info, LibraryScript } from "../nextgen_entities";
import { printAdminErrors } from "./NextGenAdmin";
import {
  NextGenCollectionIdFormGroup,
  NextGenAdminHeadingRow,
  NextGenAdminScriptsFormGroup,
  NextGenAdminTextFormGroup,
} from "./NextGenAdminShared";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";

export enum UpdateType {
  UPDATE_INFO,
  UPDATE_BASE_URI,
  UPDATE_SCRIPT,
}

interface Props {
  type: UpdateType;
  close: () => void;
}

const UPDATE_INFO_INDEX = 1000000;
const UPDATE_BASE_URI_INDEX = 999999;

export default function NextGenAdminUpdateCollection(props: Readonly<Props>) {
  const account = useSeizeConnectContext();

  const globalAdmin = useGlobalAdmin(account.address as string);
  const functionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.UPDATE_COLLECTION_INFO
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
  const [collectionName, setCollectionName] = useState("");
  const [artist, setArtist] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [license, setLicense] = useState("");
  const [baseURI, setBaseURI] = useState("");
  const [library, setLibrary] = useState("");
  const [dependencyScript, setDependencyScript] = useState<string>("");
  const [scriptIndex, setScriptIndex] = useState("");
  const [scripts, setScripts] = useState<string[]>([]);

  const [existingScripts, setExistingScripts] = useState<string[]>([]);

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useCollectionInfo(collectionID, (data: Info) => {
    setCollectionName(data.name);
    setArtist(data.artist);
    setDescription(data.description);
    setWebsite(data.website);
    setLicense(data.licence);
    setBaseURI(data.base_uri);
  });

  useCollectionLibraryAndScript(collectionID, (data: LibraryScript) => {
    if (collectionID) {
      setLibrary(data.library);
      setDependencyScript(data.dependency_script);
      if (props.type === UpdateType.UPDATE_SCRIPT) {
        setExistingScripts(data.script);
      } else {
        setScripts(data.script);
      }
    }
  });

  function getParams() {
    const params: any[] = [];
    params.push(collectionID);
    params.push(collectionName);
    params.push(artist);
    params.push(description);
    params.push(website);
    params.push(license);
    params.push(baseURI);
    params.push(library);
    params.push(dependencyScript);

    if (props.type === UpdateType.UPDATE_INFO) {
      params.push(UPDATE_INFO_INDEX);
      params.push(scripts);
    } else if (props.type === UpdateType.UPDATE_BASE_URI) {
      params.push(UPDATE_BASE_URI_INDEX);
      params.push([]);
    } else if (props.type === UpdateType.UPDATE_SCRIPT) {
      params.push(scriptIndex);
      params.push(scripts);
    }

    return params;
  }

  const contractWrite = useCoreContractWrite("updateCollectionInfo", () => {
    setSubmitting(false);
    setLoading(false);
  });

  function submit(): void {
    setLoading(true);
    contractWrite.reset();
    const errors: string[] = validateInputs();

    if (errors.length > 0) {
      setErrors(errors);
      setLoading(false);
    } else {
      setErrors([]);
      setSubmitting(true);
    }
  }

  function validateInputs(): string[] {
    const errors: string[] = [];
    validateCommonInputs(errors);

    switch (props.type) {
      case UpdateType.UPDATE_INFO:
        validateUpdateInfoInputs(errors);
        validateUpdateBaseURI(errors);
        break;
      case UpdateType.UPDATE_BASE_URI:
        validateUpdateBaseURI(errors);
        break;
      case UpdateType.UPDATE_SCRIPT:
        validateUpdateScript(errors);
        break;
    }

    return errors;
  }

  function validateCommonInputs(errors: string[]): void {
    if (!collectionID) {
      errors.push("Collection id is required");
    }
  }

  function validateUpdateInfoInputs(errors: string[]): void {
    const requiredFields: { value: any; message: string }[] = [
      { value: collectionName, message: "Collection name is required" },
      { value: artist, message: "Artist is required" },
      { value: description, message: "Description is required" },
      { value: website, message: "Website is required" },
      { value: license, message: "License is required" },
      { value: library, message: "Library is required" },
    ];

    if (scripts.length === 0) {
      errors.push("At least one script is required");
    }

    requiredFields.forEach((field) => {
      if (!field.value) errors.push(field.message);
    });
  }

  function validateUpdateBaseURI(errors: string[]): void {
    if (!baseURI) {
      errors.push("Base URI is required");
    }
  }

  function validateUpdateScript(errors: string[]): void {
    if (scripts.length !== 1) {
      errors.push("You need exactly one script");
    }
    if (scriptIndex === undefined) {
      errors.push("Script index is required");
    }
  }

  useEffect(() => {
    if (submitting) {
      const params = getParams();
      contractWrite.writeContract({
        ...contractWrite.params,
        args: params,
      });
    }
  }, [submitting]);

  useEffect(() => {
    if (contractWrite.isSuccess || contractWrite.isError) {
      setLoading(false);
      setSubmitting(false);
    }
  }, [contractWrite.isSuccess || contractWrite.isError]);

  function getTitle() {
    switch (props.type) {
      case UpdateType.UPDATE_INFO:
        return "UPDATE INFO";
      case UpdateType.UPDATE_BASE_URI:
        return "UPDATE BASE URI";
      case UpdateType.UPDATE_SCRIPT:
        return "UPDATE SCRIPT";
    }
  }
  return (
    <Container className="no-padding">
      <NextGenAdminHeadingRow close={props.close} title={getTitle()} />
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
            {props.type === UpdateType.UPDATE_INFO && (
              <>
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
                  title="Library"
                  value={library}
                  setValue={setLibrary}
                />
                <NextGenAdminTextFormGroup
                  title="Dependency Script"
                  value={dependencyScript}
                  setValue={setDependencyScript}
                />
              </>
            )}
            {(props.type === UpdateType.UPDATE_INFO ||
              props.type === UpdateType.UPDATE_BASE_URI) && (
              <NextGenAdminTextFormGroup
                title="Base URI"
                value={baseURI}
                setValue={setBaseURI}
              />
            )}
            {props.type === UpdateType.UPDATE_SCRIPT && (
              <Form.Group className="mb-3">
                <Form.Label>Script Index</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="...index"
                  value={scriptIndex}
                  onChange={(e: any) => {
                    const i = e.target.value;
                    setScriptIndex(i);
                    if (existingScripts.length > i) {
                      setScripts([existingScripts[i]!]);
                    } else {
                      setScripts([]);
                    }
                  }}
                />
              </Form.Group>
            )}
            {(props.type === UpdateType.UPDATE_INFO ||
              props.type === UpdateType.UPDATE_SCRIPT) && (
              <NextGenAdminScriptsFormGroup
                scripts={scripts}
                setScripts={setScripts}
              />
            )}
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
    </Container>
  );
}
