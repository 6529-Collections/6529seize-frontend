"use client";

import { publicEnv } from "@/config/env";
import type { Consolidation } from "@/entities/IDelegation";
import { areEqualAddresses } from "@/helpers/Helpers";
import { fetchAllPages } from "@/services/6529api";
import { useEffect, useState } from "react";
import {
  MappingToolError,
  type MappingToolErrorKind,
  MappingToolSubmitButton,
  MappingToolUpload,
} from "./MappingToolControls";
import { parseCsvFile } from "./mappingToolCsv";
import { downloadCsvFile } from "./mappingToolDownload";
import styles from "./MappingTool.module.css";

interface ConsolidationData {
  address: string;
  token_id: number;
  balance: number;
  contract: string;
  name: string;
}

function parseConsolidationRow(row: Record<string, string>): ConsolidationData {
  return {
    address: row["_0"]!,
    token_id: Number.parseInt(row["_1"]!, 10),
    balance: Number.parseInt(row["_2"]!, 10),
    contract: row["_3"]!,
    name: row["_4"]!,
  };
}

export default function ConsolidationMappingTool() {
  const [file, setFile] = useState<File | undefined>();
  const [processing, setProcessing] = useState(false);
  const [consolidations, setConsolidations] = useState<Consolidation[]>([]);

  const [csvData, setCsvData] = useState<ConsolidationData[]>([]);
  const [error, setError] = useState<MappingToolErrorKind | null>(null);
  function failProcessing(kind: MappingToolErrorKind) {
    setError(kind);
    setProcessing(false);
  }

  function submit() {
    setError(null);
    setProcessing(true);

    fetchAllPages<Consolidation>(`${publicEnv.API_ENDPOINT}/api/consolidations`)
      .then((loadedConsolidations) => {
        setConsolidations(loadedConsolidations);
        if (file) {
          void parseCsvFile(
            file,
            (row, index) =>
              index === 0 ? undefined : parseConsolidationRow(row),
            setCsvData,
            () => failProcessing("fileReadFailed")
          );
        }
      })
      .catch(() => {
        failProcessing("dataLoadFailed");
      });
  }

  function getForAddress(address: string) {
    const myConsolidations = consolidations.find((c) =>
      c.wallets.some((w) => areEqualAddresses(address, w))
    );
    return myConsolidations;
  }

  function sumForAddresses(
    addresses: string[],
    token_id: number,
    contract: string
  ) {
    const myConsolidations = csvData.filter(
      (d) =>
        addresses.some((a) => areEqualAddresses(a, d.address)) &&
        areEqualAddresses(contract, d.contract) &&
        token_id === d.token_id
    );
    const balance = myConsolidations.reduce((a, b) => a + b.balance, 0);
    return balance;
  }

  function downloadConsolidatedCsv(data: ConsolidationData[]) {
    const csvHeader = "address,token_id,balance,contract,name";
    const csvRows = data.map((d) => {
      return `${d.address},${d.token_id},${d.balance},${d.contract},${d.name}`;
    });
    downloadCsvFile(
      `${csvHeader}\n${csvRows.join("\n")}`,
      "consolidation_output.csv"
    );
  }

  useEffect(() => {
    const out: ConsolidationData[] = [];
    if (csvData.length > 0 && consolidations.length > 0) {
      csvData.map((consolidationData) => {
        const addressConsolidations = getForAddress(consolidationData.address);
        if (addressConsolidations) {
          const sum = sumForAddresses(
            addressConsolidations.wallets,
            consolidationData.token_id,
            consolidationData.contract
          );
          if (
            areEqualAddresses(
              consolidationData.address,
              addressConsolidations.primary
            ) ||
            sum === consolidationData.balance
          ) {
            out.push({
              ...consolidationData,
              address: addressConsolidations.primary,
              balance: sum,
            });
          }
        } else {
          out.push(consolidationData);
        }
      });
      downloadConsolidatedCsv(out);
      setProcessing(false);
    }
  }, [csvData]);

  return (
    <div className={styles["toolArea"]} id="mapping-tool-form">
      <MappingToolUpload fileName={file?.name} onFileSelected={setFile} />
      {/* <div className="tw-flex tw-flex-wrap -tw-mx-3 tw-pt-4">
        <div className="tw-w-full tw-px-3 tw-text-sm tw-text-iron-400">
          Note: If the selected collection or use case delegation is not found,
          the tool will automatically switch to using delegations for
          &quot;Any&quot; or &quot;All&quot; options respectively.
        </div>
      </div> */}
      <MappingToolSubmitButton
        disabled={processing || !file}
        processing={processing}
        onSubmit={submit}
      />
      <MappingToolError error={error} />
    </div>
  );
}
