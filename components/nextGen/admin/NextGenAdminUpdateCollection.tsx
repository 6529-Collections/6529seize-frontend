import { Container, Row, Col, Button, Form } from "react-bootstrap";
import styles from "./NextGenAdmin.module.scss";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { FunctionSelectors } from "../nextgen_contracts";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";
import {
  getCollectionIdsForAddress,
  getCoreUseContractWrite,
  retrieveCollectionInfo,
  retrieveCollectionLibraryAndScript,
  useCollectionAdmin,
  useCollectionIndex,
  useFunctionAdmin,
  useGlobalAdmin,
} from "../nextgen_helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Info, LibraryScript } from "../nextgen_entities";
import { printAdminErrors } from "./NextGenAdmin";

export enum UpdateType {
  UPDATE_INFO,
  UPDATE_BASE_URI,
  UPDATE_SCRIPT,
}

interface Props {
  type: UpdateType;
  close: () => void;
}

const UPDATE_INFO_INDEX = 1000;
const UPDATE_BASE_URI_INDEX = 999;

export default function NextGenAdminUpdateCollection(props: Readonly<Props>) {
  const account = useAccount();

  const globalAdmin = useGlobalAdmin(account.address as string);
  const functionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.UPDATE_COLLECTION_INFO
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
  const [collectionName, setCollectionName] = useState("");
  const [artist, setArtist] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [license, setLicense] = useState("");
  const [baseURI, setBaseURI] = useState("");
  const [library, setLibrary] = useState("");
  const [scriptIndex, setScriptIndex] = useState("");
  const [scripts, setScripts] = useState<string[]>([]);

  const [existingScripts, setExistingScripts] = useState<string[]>([]);

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  retrieveCollectionInfo(collectionID, (data: Info) => {
    setCollectionName(data.name);
    setArtist(data.artist);
    setDescription(data.description);
    setWebsite(data.website);
    setLicense(data.licence);
    setBaseURI(data.base_uri);
  });

  retrieveCollectionLibraryAndScript(collectionID, (data: LibraryScript) => {
    setLibrary(data.library);
    if (props.type === UpdateType.UPDATE_SCRIPT) {
      setExistingScripts(data.script);
    } else {
      setScripts(data.script);
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

  const contractWrite = getCoreUseContractWrite("updateCollectionInfo", () => {
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
      console.log("submitting - update params", params);
      contractWrite.write({
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

  return (
    <Container className="no-padding">
      <Row className="pt-3">
        <Col className="d-flex align-items-center justify-content-between">
          <h3>
            <b>
              {props.type === UpdateType.UPDATE_INFO &&
                "UPDATE COLLECTION INFO"}
              {props.type === UpdateType.UPDATE_BASE_URI && "UPDATE BASE URI"}
              {props.type === UpdateType.UPDATE_SCRIPT && "UPDATE SCRIPT"}
            </b>
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
            {props.type === UpdateType.UPDATE_INFO && (
              <>
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
              </>
            )}
            {(props.type === UpdateType.UPDATE_INFO ||
              props.type === UpdateType.UPDATE_BASE_URI) && (
              <Form.Group className="mb-3">
                <Form.Label>Base URI</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="https://"
                  value={baseURI}
                  onChange={(e: any) => setBaseURI(e.target.value)}
                />
              </Form.Group>
            )}
            {props.type === UpdateType.UPDATE_INFO && (
              <Form.Group className="mb-3">
                <Form.Label>Library</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="...library"
                  value={library}
                  onChange={(e: any) => setLibrary(e.target.value)}
                />
              </Form.Group>
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
                      setScripts([existingScripts[i]]);
                    } else {
                      setScripts([]);
                    }
                  }}
                />
              </Form.Group>
            )}
            {(props.type === UpdateType.UPDATE_INFO ||
              props.type === UpdateType.UPDATE_SCRIPT) && (
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
            hash={contractWrite.data?.hash}
            error={contractWrite.error}
          />
        </Col>
      </Row>
    </Container>
  );
}
