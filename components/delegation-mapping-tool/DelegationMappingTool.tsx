import styles from "./DelegationMappingTool.module.scss";
import { Form, Row, Col, Button, Container } from "react-bootstrap";
import { useEffect, useRef, useState } from "react";
import {
  AIRDROPS_USE_CASE,
  ANY_COLLECTION,
  MINTING_USE_CASE,
} from "../../pages/delegation/[...section]";
import { fetchAllPages } from "../../services/6529api";
import { Delegation } from "../../entities/IDelegation";
import { areEqualAddresses } from "../../helpers/Helpers";
import { DELEGATION_ALL_ADDRESS, MEMES_CONTRACT } from "../../constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const csvParser = require("csv-parser");

export default function Download() {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const [file, setFile] = useState<any>();
  const [useCase, setUseCase] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const [delegations, setDelegations] = useState<Delegation[]>([]);

  const [csvData, setCsvData] = useState<any[]>([]);
  function submit() {
    setProcessing(true);
  }

  const handleUpload = () => {
    (inputRef.current as any).click();
  };

  const handleDrag = function (e: any) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = function (e: any) {
    e.preventDefault();
    e.stopPropagation();
    console.log("drop");
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  function getForAddress(address: string, collection: string, useCase: number) {
    const myDelegations = delegations.find(
      (d) =>
        areEqualAddresses(address, d.from_address) &&
        areEqualAddresses(collection, d.collection) &&
        useCase == d.use_case
    );
    return myDelegations;
  }

  function downloadCsvFile(data: string[]) {
    const csvString = data.map((d) => d.toLowerCase()).join("\n");

    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "output.csv");

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  useEffect(() => {
    async function fetchDelegations(url: string) {
      fetchAllPages(url).then((delegations: Delegation[]) => {
        setDelegations(delegations);
        const reader = new FileReader();

        reader.onload = async () => {
          const data = reader.result;
          const results: any[] = [];

          const parser = csvParser({ headers: true })
            .on("data", (row: any) => {
              results.push(row["_0"]);
            })
            .on("end", () => {
              setCsvData(results);
            })
            .on("error", (err: any) => {
              console.error(err);
            });

          parser.write(data);
          parser.end();
        };

        reader.readAsText(file);
      });
    }
    if (processing) {
      const initialUrl = `${process.env.API_ENDPOINT}/api/delegations?use_case=1,${useCase}`;
      fetchDelegations(initialUrl);
    }
  }, [processing]);

  useEffect(() => {
    const out: string[] = [];
    if (csvData.length > 0 && delegations.length > 0) {
      csvData.map((address) => {
        const memesUseCase = getForAddress(address, MEMES_CONTRACT, useCase);
        if (memesUseCase) {
          out.push(memesUseCase.to_address);
        } else {
          const memesAll = getForAddress(address, MEMES_CONTRACT, 1);
          if (memesAll) {
            out.push(memesAll.to_address);
          } else {
            const anyUseCase = getForAddress(
              address,
              DELEGATION_ALL_ADDRESS,
              useCase
            );
            if (anyUseCase) {
              out.push(anyUseCase.to_address);
            } else {
              const anyAll = getForAddress(address, DELEGATION_ALL_ADDRESS, 1);
              if (anyAll) {
                out.push(anyAll.to_address);
              } else {
                out.push(address);
              }
            }
          }
        }
      });
      downloadCsvFile(out);
      setProcessing(false);
    }
  }, [csvData]);

  return (
    <Container className={styles.toolArea} id="mapping-tool-form">
      <Row>
        <Col>
          Upload File <span className="font-color-h">(.csv)</span>
        </Col>
      </Row>
      <Row className="pt-2">
        <Col>
          <Container
            className={`${styles.uploadArea} ${
              dragActive ? styles.uploadAreaActive : ""
            }`}
            onClick={handleUpload}
            onDrop={handleDrop}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}>
            <div>
              <FontAwesomeIcon
                icon="file-upload"
                className={styles.uploadIcon}
              />
            </div>
            {file ? (
              <div>{file.name}</div>
            ) : (
              <div>Drag and drop your file here, or click to upload</div>
            )}
          </Container>
        </Col>
      </Row>
      <Row className="pt-4">
        <Col>Select Use Case</Col>
      </Row>
      <Row className="pt-2">
        <Col>
          <Form.Select
            className={`${styles.formInput}`}
            value={useCase}
            onChange={(e) => {
              const newCase = parseInt(e.target.value);
              setUseCase(newCase);
            }}>
            <option value={0} disabled>
              ...
            </option>
            {[MINTING_USE_CASE, AIRDROPS_USE_CASE].map((uc) => {
              return (
                <option
                  key={`delegation-tool-select-use-case-${uc.use_case}`}
                  value={uc.use_case}>
                  #{uc.use_case} - {uc.display}
                </option>
              );
            })}
          </Form.Select>
        </Col>
      </Row>
      <Row className="pt-3">
        <Col>
          <Button
            className={`${styles.submitBtn} ${
              useCase == 0 || processing || !file
                ? styles.submitBtnDisabled
                : ""
            }`}
            onClick={() => submit()}>
            {processing ? "Processing" : "Submit"}
            {processing && (
              <div className="d-inline">
                <div
                  className={`spinner-border ${styles.loader}`}
                  role="status">
                  <span className="sr-only"></span>
                </div>
              </div>
            )}
          </Button>
        </Col>
      </Row>
      <Form.Control
        ref={inputRef}
        className={`${styles.formInputHidden}`}
        type="file"
        accept=".csv"
        value={file?.fileName}
        onChange={(e: any) => {
          if (e.target.files) {
            const f = e.target.files[0];
            setFile(f);
          }
        }}
      />
    </Container>
  );
}
