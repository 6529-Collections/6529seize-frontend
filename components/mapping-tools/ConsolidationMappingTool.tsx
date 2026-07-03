"use client";

import { publicEnv } from "@/config/env";
import type { Consolidation } from "@/entities/IDelegation";
import { areEqualAddresses } from "@/helpers/Helpers";
import { fetchAllPages } from "@/services/6529api";
import { useEffect, useState } from "react";
import {
  MappingToolSubmitButton,
  MappingToolUpload,
} from "./MappingToolControls";
import styles from "./MappingTool.module.css";

const csvParser = require("csv-parser");

interface ConsolidationData {
  address: string;
  token_id: number;
  balance: number;
  contract: string;
  name: string;
}

export default function ConsolidationMappingTool() {
  const [file, setFile] = useState<any>();
  const [processing, setProcessing] = useState(false);
  const [consolidations, setConsolidations] = useState<Consolidation[]>([]);

  const [csvData, setCsvData] = useState<ConsolidationData[]>([]);
  function submit() {
    setProcessing(true);
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

  function downloadCsvFile(data: ConsolidationData[]) {
    const csvHeader = "address,token_id,balance,contract,name";
    const csvData = data.map((d) => {
      return `${d.address},${d.token_id},${d.balance},${d.contract},${d.name}`;
    });
    const csvString = `${csvHeader}\n${csvData.join("\n")}`;

    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "consolidation_output.csv");

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  useEffect(() => {
    async function fetchConsolidations(url: string) {
      fetchAllPages<Consolidation>(url).then((consolidations) => {
        setConsolidations(consolidations);
        const reader = new FileReader();

        reader.onload = async () => {
          const data = reader.result;
          const results: ConsolidationData[] = [];
          let isFirstRow = true;

          const parser = csvParser({ headers: true })
            .on("data", (row: any) => {
              if (isFirstRow) {
                isFirstRow = false;
              } else {
                const address = row["_0"];
                const token_id = Number.parseInt(row["_1"], 10);
                const balance = Number.parseInt(row["_2"], 10);
                const contract = row["_3"];
                const name = row["_4"];
                results.push({ address, token_id, balance, contract, name });
              }
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
      const initialUrl = `${publicEnv.API_ENDPOINT}/api/consolidations`;
      fetchConsolidations(initialUrl);
    }
  }, [processing]);

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
      downloadCsvFile(out);
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
    </div>
  );
}
