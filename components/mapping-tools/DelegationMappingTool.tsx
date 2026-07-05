"use client";

import {
  DELEGATION_USE_CASES,
  SUPPORTED_COLLECTIONS,
} from "@/components/delegation/delegation-constants";
import { publicEnv } from "@/config/env";
import { DELEGATION_ALL_ADDRESS, MEMES_CONTRACT } from "@/constants/constants";
import type { Delegation } from "@/entities/IDelegation";
import { areEqualAddresses } from "@/helpers/Helpers";
import { fetchAllPages } from "@/services/6529api";
import csvParser from "csv-parser";
import { useEffect, useState } from "react";
import {
  MappingToolSubmitButton,
  MappingToolUpload,
} from "./MappingToolControls";
import styles from "./MappingTool.module.css";

export default function DelegationMappingTool() {
  const [file, setFile] = useState<File | undefined>();
  const [collection, setCollection] = useState<string>("0");
  const [useCase, setUseCase] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const [delegations, setDelegations] = useState<Delegation[]>([]);

  const [csvData, setCsvData] = useState<string[]>([]);
  function submit() {
    setProcessing(true);
  }

  function getForAddress(address: string, collection: string, useCase: number) {
    const myDelegations = delegations.find(
      (d) =>
        areEqualAddresses(address, d.from_address) &&
        areEqualAddresses(collection, d.collection) &&
        useCase === d.use_case
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
      fetchAllPages<Delegation>(url).then((delegations) => {
        setDelegations(delegations);
        const reader = new FileReader();

        reader.onload = async () => {
          const data = reader.result;
          const results: string[] = [];

          const parser = csvParser({ headers: true })
            .on("data", (row: Record<string, string>) => {
              results.push(row["_0"]!);
            })
            .on("end", () => {
              setCsvData(results);
            })
            .on("error", (err: Error) => {
              console.error(err);
            });

          parser.write(data);
          parser.end();
        };

        if (file) {
          reader.readAsText(file);
        }
      });
    }
    if (processing) {
      const useCaseFilter = `&use_case=1,${useCase}`;

      const collectionFilter = `&collection=${DELEGATION_ALL_ADDRESS},${collection}`;
      const initialUrl = `${publicEnv.API_ENDPOINT}/api/delegations?${useCaseFilter}${collectionFilter}`;
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
    <div className={styles["toolArea"]} id="mapping-tool-form">
      <MappingToolUpload fileName={file?.name} onFileSelected={setFile} />
      <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-4">
        <label className="tw-w-full tw-px-3" htmlFor="delegation-collection">
          Select Collection
        </label>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-2">
        <div className="tw-w-full tw-px-3">
          <select
            id="delegation-collection"
            className={`tw-form-select tw-block tw-w-full ${styles["formInput"]}`}
            value={collection}
            onChange={(e) => {
              setCollection(e.target.value);
            }}
          >
            <option value="0" disabled>
              ...
            </option>
            {SUPPORTED_COLLECTIONS.map((sc) => {
              return (
                <option
                  key={`delegation-tool-select-collection-${sc.contract}`}
                  value={sc.contract}
                >
                  {sc.display}
                </option>
              );
            })}
          </select>
        </div>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-4">
        <label className="tw-w-full tw-px-3" htmlFor="delegation-use-case">
          Select Use Case
        </label>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-2">
        <div className="tw-w-full tw-px-3">
          <select
            id="delegation-use-case"
            className={`tw-form-select tw-block tw-w-full ${styles["formInput"]}`}
            value={useCase}
            onChange={(e) => {
              const newCase = Number.parseInt(e.target.value);
              setUseCase(newCase);
            }}
          >
            <option value={0} disabled>
              ...
            </option>
            {DELEGATION_USE_CASES.map((uc) => {
              return (
                <option
                  key={`delegation-tool-select-use-case-${uc.use_case}`}
                  value={uc.use_case}
                >
                  #{uc.use_case} - {uc.display}
                </option>
              );
            })}
          </select>
        </div>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-4">
        <div className="tw-w-full tw-px-3 tw-text-sm tw-text-iron-400">
          Note: If the selected collection or use case delegation is not found,
          the tool will automatically switch to using delegations for
          &quot;Any&quot; or &quot;All&quot; options respectively.
        </div>
      </div>
      <MappingToolSubmitButton
        disabled={useCase === 0 || processing || !file}
        processing={processing}
        onSubmit={submit}
      />
    </div>
  );
}
