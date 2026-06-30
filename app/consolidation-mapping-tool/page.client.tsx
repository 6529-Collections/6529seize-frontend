"use client";

import ConsolidationMappingTool from "@/components/mapping-tools/ConsolidationMappingTool";
import {
  delegationContainerClass,
  delegationNarrowColumnClass,
  delegationRowClass,
  delegationWideColumnClass,
} from "@/components/delegation/delegation-tailwind-classes";
import { useSetTitle } from "@/contexts/TitleContext";
import styles from "@/styles/Home.module.scss";
import { useEffect, useState } from "react";

export default function ConsolidationMappingToolPage() {
  useSetTitle("Consolidation Mapping Tool | Tools");

  const [html, setHtml] = useState("");

  useEffect(() => {
    fetch(
      "https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/consolidation-mapping-tool/how-to-use.html"
    ).then((response) => {
      if (response.status === 200) {
        response.text().then((htmlText) => {
          setHtml(htmlText);
        });
      }
    });
  }, []);

  return (
    <main className={`${styles["main"]} tailwind-scope`}>
      <div className="tw-w-full tw-px-3">
        <div className={delegationContainerClass}>
          <div className={`${delegationRowClass} tw-pt-4`}>
            <div className={delegationWideColumnClass}>
              <h1 className="tw-text-center">Consolidation Mapping Tool</h1>
            </div>
          </div>
          <div className={`${delegationRowClass} tw-pt-2`}>
            <div className={delegationWideColumnClass}>
              <h5>Overview</h5>
            </div>
          </div>
          <div className={delegationRowClass}>
            <div className={delegationWideColumnClass}>
              The Consolidation Mapping tool allows anyone to easily upload a
              CSV file with addresses and balances to receive consolidated
              addresses in return (from the NFTDelegation contract).{" "}
              <a href="#how-to-use">How to use this tool?</a>
            </div>
          </div>
          <div className={delegationRowClass}>
            <div className={delegationNarrowColumnClass}>
              <div className="tw-py-5">
                <ConsolidationMappingTool />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        id="how-to-use"
        className={`${delegationContainerClass} tw-pt-1 tw-pb-5`}
      >
        <div className={delegationRowClass}>
          <div
            className={`${styles["htmlContainer"]} ${delegationNarrowColumnClass}`}
            dangerouslySetInnerHTML={{
              __html: html,
            }}></div>
        </div>
      </div>
    </main>
  );
}
