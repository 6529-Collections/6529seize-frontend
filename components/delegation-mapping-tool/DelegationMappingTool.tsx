import styles from "./DelegationMappingTool.module.scss";
import { Form, Row, Col, Button } from "react-bootstrap";
import { useEffect, useState } from "react";
import {
  AIRDROPS_USE_CASE,
  ANY_COLLECTION,
  MINTING_USE_CASE,
} from "../../pages/delegation/[...section]";
import { fetchAllPages } from "../../services/6529api";
import { Delegation } from "../../entities/IDelegation";
import { areEqualAddresses } from "../../helpers/Helpers";
import { DELEGATION_ALL_ADDRESS, MEMES_CONTRACT } from "../../constants";

const csvParser = require("csv-parser");

export default function Download() {
  const [file, setFile] = useState<any>();
  const [useCase, setUseCase] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const [delegations, setDelegations] = useState<Delegation[]>([]);

  const [csvData, setCsvData] = useState<any[]>([]);
  function submit() {
    setProcessing(true);
  }

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
    <Form>
      <Form.Group as={Row} className="pb-4">
        <Form.Label column sm={3} className="d-flex align-items-center">
          File
        </Form.Label>
        <Col sm={9}>
          <Form.Control
            className={`${styles.formInput}`}
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
        </Col>
      </Form.Group>
      <Form.Group as={Row} className="pb-4">
        <Form.Label column sm={3} className="d-flex align-items-center">
          Use Case
        </Form.Label>
        <Col sm={9}>
          <Form.Select
            className={`${styles.formInput}`}
            value={useCase}
            onChange={(e) => {
              const newCase = parseInt(e.target.value);
              setUseCase(newCase);
            }}>
            <option value={0} disabled>
              Select Use Case
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
      </Form.Group>
      <Form.Group as={Row} className="pb-4">
        <Form.Label column sm={3}></Form.Label>
        <Col sm={9} className="text-center">
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
      </Form.Group>
    </Form>
  );
}
