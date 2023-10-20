import { Container, Row, Col, Button, Form } from "react-bootstrap";
import styles from "./NextGenAdmin.module.scss";
import { useAccount, useContractRead, useContractWrite } from "wagmi";
import { useEffect, useState } from "react";
import {
  NEXTGEN_CORE,
  NEXTGEN_CHAIN_ID,
  FunctionSelectors,
} from "../contracts";
import NextGenContractWriteStatus from "../NextGenContractWriteStatus";
import {
  getCollectionIdsForAddress,
  useCollectionAdmin,
  useCollectionIndex,
  useFunctionAdmin,
  useGlobalAdmin,
} from "./admin_helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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

export default function NextGenAdminUpdateCollection(props: Props) {
  const account = useAccount();

  const globalAdmin = useGlobalAdmin(account.address as string);
  const functionAdmin = useFunctionAdmin(
    account.address as string,
    FunctionSelectors.UPDATE_COLLECTION_INFO
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
  const [collectionName, setCollectionName] = useState("");
  const [artist, setArtist] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [license, setLicense] = useState("");
  const [baseURI, setBaseURI] = useState("");
  const [library, setLibrary] = useState("");
  const [scriptIndex, setScriptIndex] = useState<number>();
  const [script, setScript] = useState("");

  const [existingScripts, setExistingScripts] = useState<string[]>([]);

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useContractRead({
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "retrieveCollectionInfo",
    enabled: !!collectionID,
    args: [collectionID],
    onSettled(data: any, error: any) {
      if (data) {
        const d = data as any[];
        setCollectionName(d[0]);
        setArtist(d[1]);
        setDescription(d[2]);
        setWebsite(d[3]);
        setLicense(d[4]);
        setBaseURI(d[5]);
      }
    },
  });

  useContractRead({
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "retrieveCollectionLibraryAndScript",
    watch: true,
    args: [collectionID],
    enabled: !!collectionID,
    onSettled(data: any, error: any) {
      if (data) {
        const d = data as any[];
        setLibrary(d[0]);
        if (props.type === UpdateType.UPDATE_SCRIPT) {
          setExistingScripts(d[1]);
        } else {
          setScript(d[1][0]);
        }
      }
    },
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
    } else if (props.type === UpdateType.UPDATE_BASE_URI) {
      params.push(UPDATE_BASE_URI_INDEX);
    } else {
      params.push(scriptIndex);
    }

    params.push([script]);

    return params;
  }

  const contractWrite = useContractWrite({
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "updateCollectionInfo",
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
    if (props.type === UpdateType.UPDATE_INFO) {
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
      if (!library) {
        errors.push("Library is required");
      }
      if (!script) {
        errors.push("Script is required");
      }
    }

    if (
      props.type === UpdateType.UPDATE_INFO ||
      props.type === UpdateType.UPDATE_BASE_URI
    ) {
      if (!baseURI) {
        errors.push("Base URI is required");
      }
    }

    if (props.type === UpdateType.UPDATE_SCRIPT) {
      if (!script) {
        errors.push("Script is required");
      }
      if (scriptIndex === undefined) {
        errors.push("Script index is required");
      }
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
      const params = getParams();
      console.log("submitting", params);
      contractWrite.write({
        args: params,
      });
    }
  }, [submitting]);

  useEffect(() => {
    setLoading(false);
    setSubmitting(false);
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
                  type="number"
                  placeholder="...index"
                  value={scriptIndex}
                  onChange={(e: any) => {
                    const i = parseInt(e.target.value);
                    setScriptIndex(i);
                    if (existingScripts.length > i) {
                      setScript(existingScripts[i]);
                    } else {
                      setScript("");
                    }
                  }}
                />
              </Form.Group>
            )}
            {(props.type === UpdateType.UPDATE_INFO ||
              props.type === UpdateType.UPDATE_SCRIPT) && (
              <Form.Group className="mb-3">
                <Form.Label>Script</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="...script"
                  value={script}
                  onChange={(e: any) => setScript(e.target.value)}
                />
              </Form.Group>
            )}
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
